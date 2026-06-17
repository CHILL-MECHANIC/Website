const { join } = require('path');

/**
 * Cache Chromium inside node_modules so Vercel's dependency cache persists it
 * between builds (the default ~/.cache/puppeteer is not cached, forcing a
 * re-download every deploy). @see https://pptr.dev/guides/configuration
 */
module.exports = {
  cacheDirectory: join(__dirname, 'node_modules', '.cache', 'puppeteer'),
};
