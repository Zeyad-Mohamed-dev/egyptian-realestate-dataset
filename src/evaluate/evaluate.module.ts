import { Module } from '@nestjs/common';
import { EvaluateService } from './evaluate.service';

@Module({ providers: [EvaluateService] })
export class EvaluateModule {}
