import { NestFactory } from '@nestjs/core';

import { AppModule } from '../app.module';
import { ExtractorRunnerService } from '../extract/exctractor-runner.service';

async function bootstrap() {
  const app =
    await NestFactory.createApplicationContext(
      AppModule,
    );

  try {
    const runner =
      app.get(ExtractorRunnerService);

    const result =
      await runner.extractAll();

    console.log(
      'Extraction complete:',
      result,
    );
  } finally {
    await app.close();
  }
}

bootstrap().catch((error) => {
  console.error('Extraction failed:', error);
  process.exit(1);
});