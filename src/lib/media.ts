const CLOUDINARY_PREFIX = 'https://res.cloudinary.com/';

/**
 * Normalize media URLs received from legacy approval-sync records.
 *
 * Some records contain a complete Cloudinary URL embedded inside another
 * Cloudinary URL. The final occurrence is the original, browser-loadable URL.
 */
export function normalizeMediaUrl(url?: string | null): string {
  const value = typeof url === 'string' ? url.trim() : '';
  if (!value) return '';

  const lastCloudinaryPrefix = value.lastIndexOf(CLOUDINARY_PREFIX);
  if (lastCloudinaryPrefix > 0) {
    return value.slice(lastCloudinaryPrefix);
  }

  return value;
}

export function normalizeMediaItem<
  T extends {
    file_url?: string;
    image?: string;
    image_url?: string;
  },
>(item: T): T {
  return {
    ...item,
    ...(item.file_url !== undefined
      ? { file_url: normalizeMediaUrl(item.file_url) }
      : {}),
    ...(item.image !== undefined ? { image: normalizeMediaUrl(item.image) } : {}),
    ...(item.image_url !== undefined
      ? { image_url: normalizeMediaUrl(item.image_url) }
      : {}),
  };
}
