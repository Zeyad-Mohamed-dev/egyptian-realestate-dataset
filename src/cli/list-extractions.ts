import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { ExtractorRunnerService } from '../extract/exctractor-runner.service';

async function bootstrap() {
  const app =
    await NestFactory.createApplicationContext(
      AppModule,
    );

  const runner =
    app.get(ExtractorRunnerService);

  const listings =
    await runner.getAllListings();

  console.table(
    listings.map((listing) => ({
      id: listing.id,
      listingId: listing.listingId,
      status: listing.status,
      groupAValid: listing.groupAValid,
      groupBValid: listing.groupBValid,
      extractedAt: listing.extractedAt,
    })),
  );

  await app.close();
}

bootstrap();