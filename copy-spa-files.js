const fs = require('fs');
const path = require('path');

// Create the 200.html file in the dist directory
const indexHtmlPath = path.join(__dirname, 'dist', 'index.html');
const spaHtmlPath = path.join(__dirname, 'dist', '200.html');

// Only proceed if the dist directory and index.html exist
if (fs.existsSync(indexHtmlPath)) {
  console.log('Copying index.html to 200.html for SPA routing on Render...');
  
  // Read the index.html file
  const indexHtml = fs.readFileSync(indexHtmlPath, 'utf8');
  
  // Write the content to 200.html
  fs.writeFileSync(spaHtmlPath, indexHtml);
  
  console.log('Successfully created 200.html for SPA routing!');
} else {
  console.error('Error: dist/index.html not found. Build may have failed.');
  process.exit(1);
}
