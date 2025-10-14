/**
 * Generate a URL-friendly slug from a title
 * @param title - The title to convert to a slug
 * @param maxLength - Maximum length of the slug (default: 60)
 * @returns URL-friendly slug
 */
export function generateSlug(title: string, maxLength: number = 60): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9가-힣]+/g, '-') // Allow Korean characters
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, maxLength);
}

/**
 * Generate a unique slug by appending a suffix if needed
 * @param baseSlug - The base slug to make unique
 * @param checkExists - Async function to check if a slug exists
 * @returns A unique slug
 */
export async function generateUniqueSlug(
  baseSlug: string,
  checkExists: (slug: string) => Promise<boolean>
): Promise<string> {
  let slug = baseSlug;
  let counter = 1;

  while (await checkExists(slug)) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return slug;
}

/**
 * Generate a unique slug with timestamp and random number
 * @param title - The title to convert to a slug
 * @param maxLength - Maximum length before adding suffix (default: 50)
 * @returns A unique slug with timestamp and random suffix
 */
export function generateUniqueSlugWithTimestamp(title: string, maxLength: number = 50): string {
  const baseSlug = generateSlug(title, maxLength);
  const timestamp = Date.now();
  const randomNum = Math.floor(Math.random() * 1000);

  return `${baseSlug}-${timestamp}-${randomNum}`;
}
