import { NestFactory } from '@nestjs/core';

import { AppModule } from '../app.module';
import { SearchablePropertyService  } from '../extract/services/searchable-property.service';

async function bootstrap() {
  const app =
    await NestFactory.createApplicationContext(
      AppModule,
    );

  try {
    const service =
      app.get(SearchablePropertyService);

    await service.buildSearchableProperties();

    console.log(
      'Searchable properties build complete.',
    );
  } finally {
    await app.close();
  }
}

bootstrap().catch((error) => {
  console.error(
    'Searchable properties build failed:',
    error,
  );

  process.exit(1);
});