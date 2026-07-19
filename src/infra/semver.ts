import { compareBuild, parse, type SemVer } from "semver";

export function compareValidSemver(left: string, right: string): number | null {
  const parsedLeft = parse(left);
  const parsedRight = parse(right);
  return parsedLeft && parsedRight ? parsedLeft.compare(parsedRight) : null;
}

export function isOperatorCorrectionSemver(version: SemVer): boolean {
  return version.prerelease.length === 1 && typeof version.prerelease[0] === "number";
}

function toOperatorComparableVersion(version: SemVer): string {
  if (isOperatorCorrectionSemver(version)) {
    return `${version.major}.${version.minor}.${version.patch}+${version.prerelease[0]}`;
  }
  // SemVer.version excludes build metadata, which remains precedence-neutral.
  return version.version;
}

/** Compares prereleases, stable releases, then Operator numeric corrections. */
export function compareOperatorSemver(left: SemVer, right: SemVer): number {
  return compareBuild(toOperatorComparableVersion(left), toOperatorComparableVersion(right));
}

/** Converts legacy Operator `1.2.3.beta.N` tags into valid SemVer prereleases. */
export function normalizeLegacyDotBetaVersion(version: string): string {
  const trimmed = version.trim();
  const dotBetaMatch = /^([vV]?[0-9]+\.[0-9]+\.[0-9]+)\.beta(?:\.([0-9A-Za-z.-]+))?$/.exec(trimmed);
  if (!dotBetaMatch) {
    return trimmed;
  }
  const base = dotBetaMatch[1];
  const suffix = dotBetaMatch[2];
  return suffix ? `${base}-beta.${suffix}` : `${base}-beta`;
}
