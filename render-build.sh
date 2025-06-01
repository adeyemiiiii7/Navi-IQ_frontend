#!/bin/bash

# Exit on error
set -e

# Build the app
npm run build

# Ensure all SPA routing files exist
if [ -f "dist/index.html" ]; then
  echo "Creating SPA routing files..."
  
  # Create 200.html for SPA routing
  cp dist/index.html dist/200.html
  echo "Created 200.html successfully!"
  
  # Also create 404.html that redirects back to index
  cp dist/index.html dist/404.html
  echo "Created 404.html successfully!"
  
  # Copy spa-fallback.html if it exists
  if [ -f "public/spa-fallback.html" ]; then
    cp public/spa-fallback.html dist/
    echo "Copied spa-fallback.html successfully!"
  fi
else
  echo "Error: dist/index.html not found. Build may have failed."
  exit 1
fi

# Copy important configuration files to dist
for file in _redirects _headers staticwebapp.config.json; do
  if [ -f "public/$file" ]; then
    echo "Copying $file to dist..."
    cp "public/$file" "dist/"
  fi
done

# Create a simple .htaccess file for additional server configuration
cat > dist/.htaccess << EOL
# Enable rewrite engine
RewriteEngine On

# If the requested resource doesn't exist as a file or directory
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d

# Rewrite all requests to the root index.html
RewriteRule ^(.*)$ index.html [QSA,L]
EOL

echo "Created .htaccess file for SPA routing"
echo "Build process completed successfully!"
