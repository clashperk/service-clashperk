import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import morgan from 'morgan';
import { AppModule } from './app.module';

async function bootstrap() {
    const logger = new Logger('HTTP');

    const app = await NestFactory.create(AppModule, { rawBody: true });
    const configService = app.get(ConfigService);

    app.enableCors();
    app.use(
        morgan('dev', {
            stream: {
                write: (message: string) => logger.log(message.trim())
            }
        })
    );

    const port: number = configService.get<number>('PORT');
    await app.listen(port);
    logger.log(`Server listening on port ${port}`);
}
bootstrap();
