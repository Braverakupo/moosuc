#!/usr/bin/env node

/**
 * Temple of Zeus — Website Content Scraper
 *
 * Parses the XML sitemap, categorizes URLs, fetches each page,
 * extracts text content as Markdown, and saves to organized folders.
 */

import { parseSitemap } from './lib/parse-sitemap.js';
import { categorize } from './lib/categorize.js';
import { fetchPage } from './lib/fetch-page.js';
import { extractContent, getOutputFilename } from './lib/extract-content.js';
import { saveFile, saveIndex } from './lib/save-file.js';

async function main() {
  console.log('='.repeat(60));
  console.log('  Temple of Zeus — Website Content Scraper');
  console.log('='.repeat(60));
  console.log('');

  // Step 1: Parse sitemap
  console.log('[1/4] Parsing sitemap...');
  const entries = parseSitemap();
  console.log(`       → ${entries.length} URLs to process`);
  console.log('');

  // Step 2: Categorize each URL
  console.log('[2/4] Categorizing URLs...');
  const categorized = entries.map((entry) => ({
    ...entry,
    category: categorize(entry.path),
  }));

  // Show category breakdown
  const catCounts = {};
  for (const c of categorized) {
    catCounts[c.category] = (catCounts[c.category] || 0) + 1;
  }
  for (const [cat, count] of Object.entries(catCounts).sort()) {
    console.log(`       ${cat}: ${count} pages`);
  }
  console.log('');

  // Step 3: Fetch and extract each page
  console.log('[3/4] Fetching pages and extracting content...');
  const results = [];
  let completed = 0;
  const total = categorized.length;

  for (const entry of categorized) {
    const { url, path, category } = entry;
    const filename = getOutputFilename(path);

    process.stdout.write(`       [${++completed}/${total}] ${filename}... `);

    const html = await fetchPage(url);

    if (!html) {
      process.stdout.write('❌ FAILED\n');
      results.push({ url, path, category, filename, status: 'fail' });
      continue;
    }

    const markdown = extractContent(html, url, category);

    if (!markdown) {
      process.stdout.write('⚠️  NO CONTENT\n');
      results.push({ url, path, category, filename, status: 'no-content' });
      continue;
    }

    const outputPath = saveFile(filename, category, markdown);
    process.stdout.write('✅\n');
    results.push({ url, path, category, filename, status: 'ok' });
  }

  console.log('');

  // Step 4: Generate summary index
  console.log('[4/4] Generating summary index...');
  const indexPath = saveIndex(results);
  console.log(`       → ${indexPath}`);

  // Summary
  console.log('');
  console.log('='.repeat(60));
  const ok = results.filter((r) => r.status === 'ok').length;
  const fail = results.filter((r) => r.status === 'fail').length;
  const noContent = results.filter((r) => r.status === 'no-content').length;
  console.log(`  Complete: ${ok} succeeded, ${fail} failed, ${noContent} empty`);
  console.log(`  Output: scraper/output/temple-of-zeus-content/`);
  console.log('='.repeat(60));
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
