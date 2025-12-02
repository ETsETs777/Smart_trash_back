import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { InjectQueue } from '@nestjs/bullmq';
import { Repository } from 'typeorm';
import { Queue } from 'bullmq';
import { WastePhotoEntity } from 'src/entities/smart-trash/waste-photo.entity';
import { CompanyEntity } from 'src/entities/smart-trash/company.entity';
import { CollectionAreaEntity } from 'src/entities/smart-trash/collection-area.entity';
import { EmployeeEntity } from 'src/entities/smart-trash/employee.entity';
import { ImageEntity } from 'src/entities/files/image.entity';
import { WastePhotoStatus } from 'src/entities/smart-trash/waste-photo-status.enum';
import { WastePhotoCreateInput } from '../inputs/waste-photo-create.input';
import { EmployeeService } from './employee.service';

@Injectable()
export class WastePhotoService {
  constructor(
    @InjectRepository(WastePhotoEntity)
    private readonly wastePhotoRepository: Repository<WastePhotoEntity>,
    @InjectRepository(CompanyEntity)
    private readonly companyRepository: Repository<CompanyEntity>,
    @InjectRepository(CollectionAreaEntity)
    private readonly areaRepository: Repository<CollectionAreaEntity>,
    @InjectRepository(EmployeeEntity)
    private readonly employeeRepository: Repository<EmployeeEntity>,
    @InjectRepository(ImageEntity)
    private readonly imageRepository: Repository<ImageEntity>,
    private readonly employeeService: EmployeeService,
    @InjectQueue('waste-classification')
    private readonly queue: Queue,
  ) {}

  async createAndEnqueue(
    input: WastePhotoCreateInput,
  ): Promise<WastePhotoEntity> {
    const company = await this.companyRepository.findOneBy({
      id: input.companyId,
    });
    if (!company) {
      throw new NotFoundException('Компания не найдена');
    }

    const image = await this.imageRepository.findOneBy({
      id: input.imageId,
    });
    if (!image) {
      throw new NotFoundException('Изображение не найдено');
    }

    let employee: EmployeeEntity | null = null;
    if (input.employeeId) {
      employee = await this.employeeRepository.findOne({
        where: { id: input.employeeId },
        relations: ['company'],
      });
      if (!employee) {
        throw new NotFoundException('Сотрудник не найден');
      }
    } else if (input.employeeFirstName && input.employeeLastName) {
      employee = await this.employeeService.createOrFindAnonymousEmployee({
        companyId: company.id,
        firstName: input.employeeFirstName,
        lastName: input.employeeLastName,
      });
    }

    let collectionArea: CollectionAreaEntity | null = null;
    if (input.collectionAreaId) {
      collectionArea = await this.areaRepository.findOne({
        where: { id: input.collectionAreaId },
        relations: ['company'],
      });
      if (!collectionArea) {
        throw new NotFoundException('Область сбора не найдена');
      }
    }

    const wastePhoto = this.wastePhotoRepository.create({
      company,
      employee: employee ?? undefined,
      collectionArea: collectionArea ?? undefined,
      image,
      status: WastePhotoStatus.PENDING,
    });
    const saved = await this.wastePhotoRepository.save(wastePhoto);

    await this.queue.add(
      'classify-waste-photo',
      {
        wastePhotoId: saved.id,
      },
      {
        removeOnComplete: true,
        removeOnFail: false,
      },
    );

    return saved;
  }
}


