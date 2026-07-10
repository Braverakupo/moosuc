/**
 * Fetch a page with rate limiting, retries, and error handling.
 */

const DELAY_MS = 350; // delay between requests (respect the server)
let lastFetchTime = 0;

/**
 * Wait for the next allowed fetch time (rate limiting).
 */
async function rateLimit() {
  const now = Date.now();
  const elapsed = now - lastFetchTime;
  if (elapsed < DELAY_MS) {
    await new Promise((r) => setTimeout(r, DELAY_MS - elapsed));
  }
  lastFetchTime = Date.now();
}

/**
 * Fetch a URL with retry logic.
 *
 * @param {string} url
 * @returns {Promise<string|null>} HTML string or null on failure
 */
export async function fetchPage(url) {
  const MAX_RETRIES = 3;
  const TIMEOUT_MS = 20000;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      await rateLimit();

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) TempleOfZeus-Archiver/1.0',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const html = await response.text();
      return html;

    } catch (err) {
      const isLastAttempt = attempt === MAX_RETRIES;
      const delay = Math.pow(3, attempt) * 1000; // exponential backoff: 3s, 9s, 27s

      if (isLastAttempt) {
        console.error(`[fetch-page] FAILED (${attempt}/${MAX_RETRIES}): ${url} — ${err.message}`);
        return null;
      }

      console.warn(`[fetch-page] Retry ${attempt}/${MAX_RETRIES} for ${url} after ${delay}ms — ${err.message}`);
      await new Promise((r) => setTimeout(r, delay));
    }
  }

  return null;
}
