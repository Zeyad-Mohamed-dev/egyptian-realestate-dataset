import { NestFactory } from '@nestjs/core';

import { AppModule } from '../app.module';
import { ExportService } from '../export/export.service';

async function bootstrap() {
  const app =
    await NestFactory.createApplicationContext(
      AppModule,
    );

  try {
    const exporter =
      app.get(ExportService);

    const result =
      await exporter.exportToXlsx();

    console.log('Export complete:', result);
  } finally {
    await app.close();
  }
}

bootstrap().catch((error) => {
  console.error('Export failed:', error);
  process.exit(1);
});
