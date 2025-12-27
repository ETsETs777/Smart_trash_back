import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WastePhotoEntity } from 'src/entities/smart-trash/waste-photo.entity';
import { WastePhotoStatus } from 'src/entities/smart-trash/waste-photo-status.enum';
import { TrashBinType } from 'src/entities/smart-trash/trash-bin-type.enum';
import { GigachatService } from 'src/modules/gigachat/gigachat.service';
import { AchievementService } from './achievement.service';
import { GamificationService } from './gamification.service';
import { ImageService } from 'src/modules/files/services/image.service';
import { PubSubService } from 'src/common/pubsub/pubsub.service';
import { CacheService } from 'src/common/cache/cache.service';

@Injectable()
export class WasteClassificationService {
  private readonly logger = new Logger(WasteClassificationService.name);

  constructor(
    @InjectRepository(WastePhotoEntity)
    private readonly wastePhotoRepository: Repository<WastePhotoEntity>,
    private readonly gigachatService: GigachatService,
    private readonly achievementService: AchievementService,
    private readonly gamificationService: GamificationService,
    private readonly imageService: ImageService,
    private readonly pubSub: PubSubService,
    private readonly cacheService: CacheService,
  ) {}

  async processWastePhoto(wastePhotoId: string): Promise<void> {
    const wastePhoto = await this.wastePhotoRepository.findOne({
      where: { id: wastePhotoId },
      relations: ['image', 'company', 'collectionArea', 'user'],
    });
    if (!wastePhoto) {
      throw new NotFoundException('Фотография мусора не найдена для обработки');
    }

    try {
      const imageBuffer = await this.imageService.getImageBuffer(
        wastePhoto.image.id,
      );

      const availableBinTypes = await this.detectAvailableBinsForPhoto(
        wastePhotoId,
      );

      const result = await this.gigachatService.classifyWaste({
        imageBuffer,
        imageFileName: wastePhoto.image.name || 'waste-photo.jpg',
        companyName: wastePhoto.company?.name,
        areaName: wastePhoto.collectionArea?.name,
        availableBinTypes:
          availableBinTypes.length > 0
            ? availableBinTypes
            : Object.values(TrashBinType),
      });

      wastePhoto.recommendedBinType = result.recommendedBinType ?? null;
      wastePhoto.aiExplanation = result.explanation;
      wastePhoto.aiRawResult = result.raw;
      wastePhoto.status = result.recommendedBinType
        ? WastePhotoStatus.CLASSIFIED
        : WastePhotoStatus.FAILED;

      const updatedWastePhoto = await this.wastePhotoRepository.save(wastePhoto);

      // Publish status update event
      await this.pubSub.publish('wastePhotoStatusUpdated', {
        wastePhotoStatusUpdated: updatedWastePhoto,
      });

      if (wastePhoto.status === WastePhotoStatus.CLASSIFIED && wastePhoto.user?.id && wastePhoto.company?.id) {
        // Начисляем базовые очки и опыт за классификацию
        const basePoints = 10;
        const baseExperience = 5;
        
        // Бонус за правильную классификацию (если recommendedBinType совпадает с выбранным)
        const bonusPoints = wastePhoto.recommendedBinType ? 5 : 0;
        const bonusExperience = wastePhoto.recommendedBinType ? 3 : 0;
        
        await this.gamificationService.awardPointsAndExperience(
          wastePhoto.user.id,
          basePoints + bonusPoints,
          baseExperience + bonusExperience,
          wastePhoto.company.id,
        );
        
        // Обновляем streak пользователя
        await this.gamificationService.updateStreak(
          wastePhoto.user.id,
          wastePhoto.company.id,
        );
        
        // Проверяем и выдаем ачивки
        const earnedAchievements = await this.achievementService.checkAndGrantForEmployeeByPhoto(
          wastePhoto,
        );
        
        // Начисляем награды за полученные ачивки
        for (const earnedAchievement of earnedAchievements) {
          const achievement = earnedAchievement.achievement;
          if (achievement.rewardPoints || achievement.rewardExperience) {
            await this.gamificationService.awardPointsAndExperience(
              wastePhoto.user.id,
              achievement.rewardPoints || 0,
              achievement.rewardExperience || 0,
              wastePhoto.company.id,
            );
          }
        }
        
        // Invalidate analytics cache for the company
        await this.cacheService.invalidateCompanyCache(wastePhoto.company.id);
        
        // Publish leaderboard update event if achievements were earned
        if (earnedAchievements.length > 0) {
          await this.pubSub.publish('leaderboardUpdated', {
            leaderboardUpdated: {
              companyId: wastePhoto.company.id,
              userId: wastePhoto.user.id,
            },
          });
        }
      }
    } catch (error) {
      this.logger.error(
        `Ошибка при обработке фотографии мусора ${wastePhotoId}: ${error.message}`,
      );
      wastePhoto.status = WastePhotoStatus.FAILED;
      const updatedWastePhoto = await this.wastePhotoRepository.save(wastePhoto);

      // Publish status update event even on failure
      await this.pubSub.publish('wastePhotoStatusUpdated', {
        wastePhotoStatusUpdated: updatedWastePhoto,
      });
    }
  }

  private async detectAvailableBinsForPhoto(
    wastePhotoId: string,
  ): Promise<TrashBinType[]> {
    const wastePhoto = await this.wastePhotoRepository.findOne({
      where: { id: wastePhotoId },
      relations: ['collectionArea', 'collectionArea.bins'],
    });
    if (!wastePhoto || !wastePhoto.collectionArea) {
      return [];
    }
    return (wastePhoto.collectionArea.bins || []).map((b) => b.type);
  }
}


