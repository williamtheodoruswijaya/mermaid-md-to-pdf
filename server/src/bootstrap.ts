import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ApiExceptionFilter } from './common/filters/api-exception.filter';

export function configureApplication(app: INestApplication): void {
  app.enableCors({
    origin: resolveCorsOrigin(),
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(new ApiExceptionFilter());
}

function resolveCorsOrigin(): boolean | string[] {
  const configuredOrigins = process.env.CLIENT_ORIGIN?.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (configuredOrigins?.length) {
    return configuredOrigins;
  }

  return process.env.NODE_ENV === 'production' ? [] : true;
}
