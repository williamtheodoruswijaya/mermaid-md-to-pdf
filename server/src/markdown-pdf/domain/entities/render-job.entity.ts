export type RenderJobStatus = 'completed' | 'failed';

export class RenderJob {
  constructor(
    readonly id: string,
    readonly status: RenderJobStatus,
    readonly createdAt: Date,
  ) {}
}
