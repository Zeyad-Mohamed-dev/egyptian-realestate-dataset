import { Module } from '@nestjs/common';
import { CollectService } from './collect.service';

@Module({ providers: [CollectService], exports: [CollectService] })
export class CollectModule {}
