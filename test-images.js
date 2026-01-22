// Script to test if images exist in uploads directory
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadsDir = path.join(__dirname, 'uploads', 'products');

console.log('📁 Checking uploads directory:', uploadsDir);
console.log('📁 Directory exists:', fs.existsSync(uploadsDir));

if (fs.existsSync(uploadsDir)) {
  const files = fs.readdirSync(uploadsDir);
  console.log(`📸 Found ${files.length} files in products directory:`);
  files.forEach((file, index) => {
    const filePath = path.join(uploadsDir, file);
    const stats = fs.statSync(filePath);
    console.log(`  ${index + 1}. ${file} (${(stats.size / 1024).toFixed(2)} KB)`);
  });
} else {
  console.log('❌ Directory does not exist!');
}
