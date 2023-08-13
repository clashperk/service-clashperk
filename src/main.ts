import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import morgan from 'morgan';
import { AppModule } from './app.module';

async function bootstrap() {
    const logger = new Logger('HTTP');

    const app = await NestFactory.create<NestExpressApplication>(AppModule, { rawBody: true });
    const configService = app.get(ConfigService);

    app.set('trust proxy', true);
    app.enableCors();
    app.use(
        morgan(
            function (tokens, req, res) {
                const status = res.statusCode;
                const color =
                    status >= 500
                        ? 31 // red
                        : status >= 400
                        ? 33 // yellow
                        : status >= 300
                        ? 36 // cyan
                        : status >= 200
                        ? 32 // green
                        : 0; // no color

                return [
                    `\x1b[0m${tokens.method(req, res)}`,
                    `${tokens.url(req, res)} \x1b[` + color + `m${tokens.status(req, res)}\x1b[0m`,
                    `${tokens['response-time'](req, res)} ms - ${tokens['remote-addr'](req, res)}\x1b[0m`,
                    // @ts-expect-error - morgan typings are wrong xD
                    req.user?.username ?? ''
                ].join(' ');
            },
            {
                stream: {
                    write: (message: string) => logger.log(message.trim())
                }
            }
        )
    );

    const port: number = configService.get<number>('PORT');
    await app.listen(port);
    logger.log(`Server listening on port ${port}`);
}
bootstrap();
