export const staticMode = process.env.NEXT_PUBLIC_RIGUNO_STATIC === 'true';
export const basePath = process.env.NEXT_PUBLIC_RIGUNO_BASE || '/';
export function assetPath(path: string) {
  return basePath.replace(/\/$/, '') + '/' + path.replace(/^\//, '');
}
