import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { CollectModule } from '../collect/collect.module';
import { CollectService } from '../collect/collect.service';

async function run(): Promise<void> {
  const app = await NestFactory.createApplicationContext(CollectModule);
  const service = app.get(CollectService);

  try {
    const result = await service.collectFromSearch();
    console.log('Collection complete:', result);
  } finally {
    await app.close();
  }
}

void run();