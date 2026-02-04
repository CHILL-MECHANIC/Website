import fs from 'fs';
import path from 'path';

const distDir = './dist';
const servicesDir = './dist/services';

const indexPath = path.join(distDir, 'index.html');
if (!fs.existsSync(indexPath)) {
  console.error(`Asset injection failed: missing ${indexPath}. Run the build first.`);
  process.exit(1);
}

if (!fs.existsSync(servicesDir)) {
  console.warn(`Asset injection skipped: missing ${servicesDir}.`);
  process.exit(0);
}

// Read built index.html to get asset tags
const indexHtml = fs.readFileSync(indexPath, 'utf-8');

// Extract <script> and <link> tags from <head> and <body>
const headMatch = indexHtml.match(/<link[^>]+href="\/assets[^>]+>/g) || [];
const scriptMatch = indexHtml.match(/<script[^>]+src="\/assets[^>]+><\/script>/g) || [];

const assetTags = [...headMatch, ...scriptMatch].join('\n    ');

// Get all service HTML files
const serviceFiles = fs.readdirSync(servicesDir).filter(f => f.endsWith('.html'));

serviceFiles.forEach(file => {
  const filePath = path.join(servicesDir, file);
  let content = fs.readFileSync(filePath, 'utf-8');
  
  // Remove old script tag
  content = content.replace(/<script\b[^>]*\bsrc\s*=\s*(['"])\/src\/main\.tsx\1[^>]*>\s*<\/script>/gi, '');
  
  // Inject assets before </head> and </body>
  content = content.replace('</head>', `    ${headMatch.join('\n    ')}\n  </head>`);
  content = content.replace('</body>', `    ${scriptMatch.join('\n    ')}\n  </body>`);
  
  fs.writeFileSync(filePath, content);
  console.log(`Updated: ${file}`);
});

console.log('Asset injection complete!');
