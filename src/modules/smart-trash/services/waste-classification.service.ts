import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WastePhotoEntity } from 'src/entities/smart-trash/waste-photo.entity';
import { WastePhotoStatus } from 'src/entities/smart-trash/waste-photo-status.enum';
import { TrashBinType } from 'src/entities/smart-trash/trash-bin-type.enum';
import { GigachatService } from 'src/modules/gigachat/gigachat.service';
import { AchievementService } from './achievement.service';
import { ImageService } from 'src/modules/files/services/image.service';

@Injectable()
export class WasteClassificationService {
  private readonly logger = new Logger(WasteClassificationService.name);

  constructor(
    @InjectRepository(WastePhotoEntity)
    private readonly wastePhotoRepository: Repository<WastePhotoEntity>,
    private readonly gigachatService: GigachatService,
    private readonly achievementService: AchievementService,
    private readonly imageService: ImageService,
  ) {}

  async processWastePhoto(wastePhotoId: string): Promise<void> {
    const wastePhoto = await this.wastePhotoRepository.findOne({
      where: { id: wastePhotoId },
      relations: ['image', 'company', 'collectionArea'],
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

      await this.wastePhotoRepository.save(wastePhoto);

      if (wastePhoto.status === WastePhotoStatus.CLASSIFIED) {
        await this.achievementService.checkAndGrantForEmployeeByPhoto(
          wastePhoto,
        );
      }
    } catch (error) {
      this.logger.error(
        `Ошибка при обработке фотографии мусора ${wastePhotoId}: ${error.message}`,
      );
      wastePhoto.status = WastePhotoStatus.FAILED;
      await this.wastePhotoRepository.save(wastePhoto);
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


