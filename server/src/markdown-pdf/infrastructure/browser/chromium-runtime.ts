import { existsSync } from 'node:fs';
import chromium from '@sparticuz/chromium';

export interface ChromiumLaunchConfig {
  readonly args: readonly string[];
  readonly executablePath: string;
  readonly headless: boolean | 'shell';
}

let launchConfigPromise: Promise<ChromiumLaunchConfig> | undefined;

export async function createChromiumLaunchConfig(): Promise<ChromiumLaunchConfig> {
  launchConfigPromise ??= buildChromiumLaunchConfig();
  return launchConfigPromise;
}

export function isChromiumLaunchBusyError(error: unknown): boolean {
  return (
    error instanceof Error &&
    (error.message.includes('ETXTBSY') ||
      error.message.includes('Text file busy'))
  );
}

async function buildChromiumLaunchConfig(): Promise<ChromiumLaunchConfig> {
  const executable = await resolveChromiumExecutable();

  return {
    args: executable.isLocalBrowser ? localChromiumArgs : chromium.args,
    executablePath: executable.path,
    headless: executable.isLocalBrowser ? true : chromium.headless,
  };
}

interface ResolvedChromiumExecutable {
  readonly path: string;
  readonly isLocalBrowser: boolean;
}

const localChromiumArgs = [
  '--disable-dev-shm-usage',
  '--disable-gpu',
  '--disable-setuid-sandbox',
  '--no-first-run',
  '--no-sandbox',
];

async function resolveChromiumExecutable(): Promise<ResolvedChromiumExecutable> {
  const configuredPath =
    process.env.PUPPETEER_EXECUTABLE_PATH ?? process.env.CHROME_EXECUTABLE_PATH;

  if (configuredPath && existsSync(configuredPath)) {
    return { path: configuredPath, isLocalBrowser: true };
  }

  for (const candidate of getLocalChromeCandidates()) {
    if (existsSync(candidate)) {
      return { path: candidate, isLocalBrowser: true };
    }
  }

  return {
    path: await chromium.executablePath(),
    isLocalBrowser: false,
  };
}

function getLocalChromeCandidates(): readonly string[] {
  return [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium-browser',
    '/usr/bin/chromium',
  ];
}
