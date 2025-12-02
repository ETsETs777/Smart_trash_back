import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CompanyEntity } from 'src/entities/smart-trash/company.entity';
import { CollectionAreaEntity } from 'src/entities/smart-trash/collection-area.entity';
import { CollectionAreaBinEntity } from 'src/entities/smart-trash/collection-area-bin.entity';
import { CollectionAreaCreateInput } from '../inputs/collection-area-create.input';

@Injectable()
export class CollectionAreaService {
  constructor(
    @InjectRepository(CompanyEntity)
    private readonly companyRepository: Repository<CompanyEntity>,
    @InjectRepository(CollectionAreaEntity)
    private readonly areaRepository: Repository<CollectionAreaEntity>,
    @InjectRepository(CollectionAreaBinEntity)
    private readonly binRepository: Repository<CollectionAreaBinEntity>,
  ) {}

  async createAreaWithBins(
    input: CollectionAreaCreateInput,
  ): Promise<CollectionAreaEntity> {
    const company = await this.companyRepository.findOneBy({
      id: input.companyId,
    });
    if (!company) {
      throw new NotFoundException('Компания не найдена');
    }

    const area = this.areaRepository.create({
      name: input.name,
      description: input.description,
      company,
    });
    const savedArea = await this.areaRepository.save(area);

    const bins = input.presentBinTypes.map((type) =>
      this.binRepository.create({
        type,
        area: savedArea,
      }),
    );
    await this.binRepository.save(bins);

    return this.areaRepository.findOneOrFail({
      where: { id: savedArea.id },
      relations: ['bins', 'company'],
    });
  }
}


