const DEFAULT_BASE_PATH = "/school-staff-training-center";

export function getBasePath() {
  const configuredBasePath = process.env.NEXT_PUBLIC_BASE_PATH || DEFAULT_BASE_PATH;
  const normalized = configuredBasePath.trim().replace(/\/+$/, "");

  return normalized === "/" ? "" : normalized;
}

export function getAssetPath(path: string) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${getBasePath()}${normalizedPath}`;
}
