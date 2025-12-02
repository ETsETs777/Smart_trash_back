import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { WasteClassificationService } from '../services/waste-classification.service';

interface WasteClassificationJobData {
  wastePhotoId: string;
}

@Processor('waste-classification')
export class WasteClassificationProcessor extends WorkerHost {
  constructor(private readonly classificationService: WasteClassificationService) {
    super();
  }

  async process(job: Job<WasteClassificationJobData>): Promise<void> {
    await this.classificationService.processWastePhoto(job.data.wastePhotoId);
  }
}


