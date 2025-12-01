import { Global, Module } from '@nestjs/common';
import { ConfigService } from './config.service';

/**
 * Module receives startup configuration of the whole application
 */
@Global()
@Module({
  providers: [ConfigService],
  exports: [ConfigService],
})
export class ConfigModule {}
