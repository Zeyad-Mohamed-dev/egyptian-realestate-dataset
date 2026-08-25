import 'reflect-metadata';

import { NestFactory } from '@nestjs/core';

import { AppModule } from '../app.module';

import { GroupAReExtractionService     } from '../extract/group-a-re-extraction';

async function bootstrap() {
  const app =
    await NestFactory.createApplicationContext(
      AppModule,
    );

  const service =
    app.get(GroupAReExtractionService);

  try {
    const result = await service.run();

    console.log('');
    console.log('Group A re-extraction complete');
    console.log(`Found: ${result.found}`);
    console.log(`Processed: ${result.processed}`);
    console.log(`Failures: ${result.failures}`);
  } finally {
    await app.close();
  }
}

bootstrap();