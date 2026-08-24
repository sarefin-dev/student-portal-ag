const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

// 1. Rename folder
const sourceDir = path.join(process.cwd(), 'src', 'app', 'admin');
const targetDir = path.join(process.cwd(), 'src', 'app', '[portal]');
fs.renameSync(sourceDir, targetDir);

// 2. Find all files in the new directory
let filesToProcess = [];
walkDir(targetDir, (filePath) => {
  if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
    filesToProcess.push(filePath);
  }
});

// We will do manual search and replace using IDE or sed to be safe, 
// let's just log the files that need attention.
let count = 0;
filesToProcess.forEach(file => {
  const content = fs.readFileSync(file, 'utf-8');
  if (content.includes('/admin')) {
    console.log(file);
    count++;
  }
});

console.log(`\nTotal files needing update: ${count}`);
