const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

const targetDir = path.join(process.cwd(), 'src', 'app', 'instructor');

let count = 0;
walkDir(targetDir, (filePath) => {
  if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
    let content = fs.readFileSync(filePath, 'utf-8');
    if (content.includes('/admin')) {
      // We replace both /admin and /admin/ with /instructor and /instructor/
      // Need to be careful with imports. But wait, our imports use `@/app/...` or `../actions`.
      // We are only concerned with string literals that contain '/admin'.
      content = content.replace(/\/admin\b/g, '/instructor');
      fs.writeFileSync(filePath, content, 'utf-8');
      count++;
      console.log('Updated:', filePath);
    }
  }
});

console.log(`\nUpdated ${count} files.`);
