export interface NpmVersionInfo {
  version: string;
  date: string;
  description?: string;
  changelog?: string;
  major: number;
  minor: number;
  patch: number;
  era: VersionEra;
  eraLabel: string;
  eventType: VersionEventType;
  isPrerelease: boolean;
  preTag?: string; // alpha, beta, rc, etc.
}

export type VersionEra = 'ancient' | 'founding' | 'revolution' | 'war' | 'modern';
export type VersionEventType = 'birth' | 'founding' | 'revolution' | 'war' | 'reform' | 'minor' | 'patch';

export interface NpmPackageData {
  name: string;
  description: string;
  versions: NpmVersionInfo[];
  latestVersion: string;
  repositoryUrl?: string; // GitHub repo URL for fetching releases
}
