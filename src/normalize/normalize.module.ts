import { Module } from '@nestjs/common';
import { NormalizeService } from './normalize.service';

@Module({ providers: [NormalizeService] })
export class NormalizeModule {}
