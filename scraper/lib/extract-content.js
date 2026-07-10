import * as cheerio from 'cheerio';
import TurndownService from 'turndown';

const turndown = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced',
  emDelimiter: '*',
  bulletListMarker: '-',
});

// Preserve links
turndown.addRule('preserveLinks', {
  filter: 'a',
  replacement: (content, node) => {
    const href = node.getAttribute('href');
    if (!href) return content;
    return `[${content}](${href})`;
  },
});

/**
 * Sanitize a string for use as a filename.
 * Replaces characters invalid on Windows.
 */
function sanitizeFilename(name) {
  return name
    .replace(/[<>:"/\\|?*]/g, '_')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
    .substring(0, 200);
}

/**
 * Extract the page filename from a URL path for saving.
 */
export function getOutputFilename(path) {
  let filename = path.replace(/^\//, '').replace(/\.php$/i, '');
  if (filename === '' || filename === 'index') filename = 'index';
  filename = filename.replace(/\//g, '-'); // flatten subdirectory paths into single filename
  return sanitizeFilename(filename) || 'index';
}

/**
 * Extract and convert HTML content to Markdown with frontmatter.
 *
 * @param {string} html - Raw HTML
 * @param {string} url - Full URL of the page
 * @param {string} category - Category folder name
 * @returns {string|null} Markdown string or null if no content
 */
export function extractContent(html, url, category) {
  const $ = cheerio.load(html);

  // Remove unwanted elements
  $('script, style, nav, header, footer, aside, noscript, iframe, svg, form, input, button, select, textarea').remove();
  $('[role="navigation"], [role="banner"], [role="contentinfo"], .nav, .navbar, .menu, .footer, .header, .sidebar').remove();

  // Extract title
  let title = $('title').first().text().trim();
  if (!title) {
    title = $('h1').first().text().trim();
  }
  if (!title) {
    title = new URL(url).pathname.replace(/^\//, '').replace(/\.php$/i, '').replace(/[-_]/g, ' ');
  }

  // Find the main content area
  // Try common content selectors
  let contentElem = $('article').first();
  if (!contentElem.length) contentElem = $('[role="main"]').first();
  if (!contentElem.length) contentElem = $('#content, #main, .content, .main, .post, .entry').first();
  if (!contentElem.length) contentElem = $('body');

  // Get the HTML of the content area
  let contentHtml = contentElem.html() || '';

  if (!contentHtml.trim()) {
    console.warn(`[extract-content] No content found for ${url}`);
    return null;
  }

  // Convert to Markdown
  let markdown = turndown.turndown(contentHtml);

  // Clean up: remove excessive blank lines
  markdown = markdown
    .replace(/\n{4,}/g, '\n\n\n')
    .replace(/^\s+/, '')
    .trim();

  if (!markdown) {
    console.warn(`[extract-content] Empty markdown after conversion for ${url}`);
    return null;
  }

  // Build YAML frontmatter
  const date = new Date().toISOString().split('T')[0];
  const frontmatter = [
    '---',
    `title: "${title.replace(/"/g, '\\"')}"`,
    `source: ${url}`,
    `category: ${category}`,
    `retrieved: ${date}`,
    '---',
    '',
  ].join('\n');

  return frontmatter + markdown;
}
