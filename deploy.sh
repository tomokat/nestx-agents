#!/bin/bash
set -e

echo "Building UI..."
cd packages/ui
npm install
npm run build
cd ../..

echo "Building Backend..."
cd backend
npm install
npm run build
# Ensure views are copied (already handled by npm run build in package.json but ensuring execution)
# npm run build calls nest build && cp -R views dist/views
cd ..

echo "Preparing Publish Directory..."
rm -rf publish
mkdir -p publish/static

# Copy Stencil output to publish/static so it's available at /static/...
cp -R packages/ui/dist/* publish/static/

echo "Deployment preparation complete."
