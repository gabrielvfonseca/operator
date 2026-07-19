// Normalizes config version metadata and compatibility comparisons.
import { parse as parseSemver, type SemVer } from "semver";
import {
  compareOperatorSemver,
  isOperatorCorrectionSemver,
  normalizeLegacyDotBetaVersion,
} from "../infra/semver.js";

/** Parses stable, prerelease, and legacy dot-beta Operator versions. */
function parseOperatorVersion(raw: string | null | undefined): SemVer | null {
  if (!raw) {
    return null;
  }
  const normalized = normalizeLegacyDotBetaVersion(raw.trim());
  return parseSemver(normalized);
}

export function normalizeOperatorVersionBase(raw: string | null | undefined): string | null {
  const parsed = parseOperatorVersion(raw);
  if (!parsed) {
    return null;
  }
  return `${parsed.major}.${parsed.minor}.${parsed.patch}`;
}

export function compareOperatorVersions(
  a: string | null | undefined,
  b: string | null | undefined,
): number | null {
  const parsedA = parseOperatorVersion(a);
  const parsedB = parseOperatorVersion(b);
  if (!parsedA || !parsedB) {
    return null;
  }
  return compareOperatorSemver(parsedA, parsedB);
}

export function shouldWarnOnTouchedVersion(
  current: string | null | undefined,
  touched: string | null | undefined,
): boolean {
  const parsedCurrent = parseOperatorVersion(current);
  const parsedTouched = parseOperatorVersion(touched);
  if (parsedCurrent && parsedTouched && parsedCurrent.compareMain(parsedTouched) === 0) {
    if (parsedTouched.prerelease.length === 0 || isOperatorCorrectionSemver(parsedTouched)) {
      return false;
    }
  }
  return parsedCurrent !== null && parsedTouched !== null
    ? compareOperatorSemver(parsedCurrent, parsedTouched) < 0
    : false;
}
