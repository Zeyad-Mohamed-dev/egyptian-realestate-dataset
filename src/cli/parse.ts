import { NestFactory } from '@nestjs/core';
import { PipelineModule } from '../pipeline/pipeline.module';
import { PipelineService } from '../pipeline/pipeline.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(
    PipelineModule,
  );

  try {
    const pipelineService =
      app.get(PipelineService);

    const result =
      await pipelineService.processSavedHtml();

    console.log('Parsing complete:', result);
  } finally {
    await app.close();
  }
}

bootstrap().catch((error) => {
  console.error('Parsing failed:', error);
  process.exit(1);
});