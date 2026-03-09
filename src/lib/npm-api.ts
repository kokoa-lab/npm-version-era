import type { NpmPackageData, NpmVersionInfo, VersionEra, VersionEventType } from "@/types/version";

function parseVersion(version: string): { major: number; minor: number; patch: number; preTag?: string } | null {
  const match = version.match(/^(\d+)\.(\d+)\.(\d+)(?:-(.+))?/);
  if (!match) return null;
  return {
    major: parseInt(match[1]),
    minor: parseInt(match[2]),
    patch: parseInt(match[3]),
    preTag: match[4] || undefined,
  };
}

function classifyEra(major: number): VersionEra {
  if (major === 0) return 'ancient';
  if (major === 1) return 'founding';
  if (major <= 3) return 'revolution';
  if (major <= 8) return 'modern';
  return 'modern';
}

function classifyEvent(major: number, minor: number, patch: number, prevMajor: number | null): VersionEventType {
  if (prevMajor !== null && major > prevMajor) {
    if (major === 1 && prevMajor === 0) return 'founding';
    return 'revolution';
  }
  if (minor === 0 && patch === 0 && major > 0) return 'revolution';
  if (minor > 0 && patch === 0) return 'reform';
  return 'patch';
}

const eraLabels: Record<VersionEra, string> = {
  ancient: '고대 문명기',
  founding: '건국 시대',
  revolution: '혁명의 시대',
  war: '격변기',
  modern: '현대',
};

function extractGitHubRepo(repoField: any): string | undefined {
  if (!repoField) return undefined;
  let url = typeof repoField === 'string' ? repoField : repoField.url;
  if (!url) return undefined;
  // Normalize git URLs to owner/repo
  url = url.replace(/^git\+/, '').replace(/\.git$/, '').replace(/^ssh:\/\/git@github\.com/, 'https://github.com');
  const match = url.match(/github\.com[/:]([^/]+\/[^/]+)/);
  return match ? match[1] : undefined;
}

export async function fetchPackageVersions(packageName: string): Promise<NpmPackageData> {
  const res = await fetch(`https://registry.npmjs.org/${encodeURIComponent(packageName)}`);
  if (!res.ok) throw new Error(`패키지를 찾을 수 없습니다: ${packageName}`);

  const data = await res.json();
  const times: Record<string, string> = data.time || {};
  const description = data.description || '';
  const latestVersion = data['dist-tags']?.latest || '';
  const repositoryUrl = extractGitHubRepo(data.repository);

  const versionEntries = Object.entries(times)
    .filter(([key]) => key !== 'created' && key !== 'modified')
    .map(([version, date]) => ({ version, date: date as string }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  let prevMajor: number | null = null;
  const versions: NpmVersionInfo[] = [];

  for (const entry of versionEntries) {
    const parsed = parseVersion(entry.version);
    if (!parsed) continue;

    const { major, minor, patch, preTag } = parsed;
    const isPrerelease = !!preTag;
    const era = classifyEra(major);
    const eventType = classifyEvent(major, minor, patch, prevMajor);

    const versionMeta = data.versions?.[entry.version];
    const desc = versionMeta?.description || '';

    versions.push({
      version: entry.version,
      date: entry.date,
      description: desc,
      major, minor, patch,
      era,
      eraLabel: eraLabels[era],
      eventType,
      isPrerelease,
      preTag,
    });

    if (!isPrerelease) prevMajor = major;
  }

  return { name: packageName, description, versions, latestVersion, repositoryUrl };
}

// Fetch GitHub release notes for a specific version
export async function fetchGitHubRelease(repo: string, version: string): Promise<string | null> {
  // Try common tag formats
  const tags = [`v${version}`, version];
  for (const tag of tags) {
    try {
      const res = await fetch(`https://api.github.com/repos/${repo}/releases/tags/${encodeURIComponent(tag)}`, {
        headers: { 'Accept': 'application/vnd.github.v3+json' },
      });
      if (res.ok) {
        const data = await res.json();
        return data.body || null;
      }
    } catch {
      // continue
    }
  }
  return null;
}

export function filterSignificantVersions(versions: NpmVersionInfo[], maxCount = 80): NpmVersionInfo[] {
  // Always keep major/minor/prerelease milestones, sample patches
  const significant = versions.filter(
    v => v.patch === 0 || v.eventType === 'founding' || v.eventType === 'revolution' || v.isPrerelease
  );
  const patches = versions.filter(
    v => v.patch !== 0 && v.eventType !== 'founding' && v.eventType !== 'revolution' && !v.isPrerelease
  );

  if (significant.length >= maxCount) {
    return significant.slice(0, maxCount);
  }

  const remaining = maxCount - significant.length;
  const step = Math.max(1, Math.floor(patches.length / remaining));
  const sampledPatches = patches.filter((_, i) => i % step === 0).slice(0, remaining);

  return [...significant, ...sampledPatches].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
}
