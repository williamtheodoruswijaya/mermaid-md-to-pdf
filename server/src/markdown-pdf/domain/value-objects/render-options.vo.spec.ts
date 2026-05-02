import { RenderOptions } from './render-options.vo';

describe('RenderOptions', () => {
  it('uses secure PDF defaults', () => {
    const options = RenderOptions.create();

    expect(options.pageSize).toBe('A4');
    expect(options.margin).toBe('16mm');
    expect(options.renderMermaid).toBe(true);
    expect(options.allowRemoteImages).toBe(false);
    expect(options.filename).toBe('document.pdf');
  });

  it('normalizes filenames', () => {
    const options = RenderOptions.create({
      filename: 'Course Notes Final',
    });

    expect(options.filename).toBe('Course-Notes-Final.pdf');
  });

  it('rejects invalid timeout values', () => {
    expect(() => RenderOptions.create({ timeoutMs: 100 })).toThrow(
      'Render timeout must be between 1000 and 60000 milliseconds.',
    );
  });
});
