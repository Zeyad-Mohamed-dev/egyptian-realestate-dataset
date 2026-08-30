import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { NormalizeService } from '../normalize/normalize.service';

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule);

    try {
        const normalizeService = app.get(NormalizeService);

        await normalizeService.normalize();
    } catch (error) {
        console.error('Normalization failed:', error);
        process.exitCode = 1;
    } finally {
        await app.close();
    }
}

bootstrap();