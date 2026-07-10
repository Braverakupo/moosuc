import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SITEMAP_PATH = resolve(__dirname, '..', '..', '6611407_525.xml');

/**
 * Parse the XML sitemap and extract all URLs.
 * Filters out search.php and search_ai.php (no substantive content).
 *
 * @returns {Array<{ url: string, path: string }>}
 */
export function parseSitemap() {
  const xml = readFileSync(SITEMAP_PATH, 'utf-8');

  // Extract all <loc> values between the tags
  const locRegex = /<loc>([^<]+)<\/loc>/g;
  const entries = [];
  let match;

  while ((match = locRegex.exec(xml)) !== null) {
    const url = match[1].trim();
    entries.push({ url });
  }

  console.log(`[parse-sitemap] Found ${entries.length} total URLs in sitemap`);

  // Filter out search pages
  const filtered = entries.filter(({ url }) => {
    const filename = url.replace(/https?:\/\/[^\/]+/, '');
    if (filename.includes('search.php') || filename.includes('search_ai.php')) {
      return false;
    }
    return true;
  });

  // Extract relative path for each URL
  const result = filtered.map(({ url }) => {
    const parsed = new URL(url);
    let path = parsed.pathname; // e.g. "/Zeus.php" or "/doctrines/The_Havamal.php"
    if (path === '/' || path === '') path = '/index.php';
    if (path.endsWith('/')) path += 'index.php';
    return { url, path };
  });

  console.log(`[parse-sitemap] ${result.length} URLs after filtering search pages`);
  return result;
}
