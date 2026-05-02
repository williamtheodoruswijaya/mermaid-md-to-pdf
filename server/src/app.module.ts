import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { MarkdownPdfModule } from './markdown-pdf/markdown-pdf.module';

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        ttl: Number(process.env.RATE_LIMIT_TTL_MS ?? 60_000),
        limit: Number(process.env.RATE_LIMIT_MAX ?? 20),
      },
    ]),
    MarkdownPdfModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
