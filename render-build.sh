#!/bin/bash

# Exit on error
set -e

# Build the app
npm run build

# Ensure 200.html exists for SPA routing
if [ -f "dist/index.html" ]; then
  echo "Creating 200.html for SPA routing..."
  cp dist/index.html dist/200.html
  echo "Created 200.html successfully!"
else
  echo "Error: dist/index.html not found. Build may have failed."
  exit 1
fi

# Copy _redirects and _headers to dist
if [ -f "public/_redirects" ]; then
  echo "Copying _redirects to dist..."
  cp public/_redirects dist/
fi

if [ -f "public/_headers" ]; then
  echo "Copying _headers to dist..."
  cp public/_headers dist/
fi

echo "Build process completed successfully!"
