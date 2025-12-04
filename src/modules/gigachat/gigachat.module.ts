import { Module } from '@nestjs/common';
import { GigachatService } from './gigachat.service';
import { LLMRequestService } from './services/llm-request.service';
import { ConfigModule } from '../config/config.module';

@Module({
  imports: [ConfigModule],
  providers: [GigachatService, LLMRequestService],
  exports: [GigachatService, LLMRequestService],
})
export class GigachatModule {}


