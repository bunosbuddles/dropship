#!/bin/bash

# Fix case sensitivity issues with model imports
# This script ensures all imports use lowercase model filenames

# Make git recognize case changes
echo "Fixing case-sensitive imports for Product model..."
git mv models/Product.js models/product.js.temp 2>/dev/null || true
git mv models/product.js.temp models/product.js 2>/dev/null || true

echo "Fixing case-sensitive imports for Goal model..."
git mv models/Goal.js models/goal.js.temp 2>/dev/null || true
git mv models/goal.js.temp models/goal.js 2>/dev/null || true

echo "Fixing case-sensitive imports for CalendarEntry model..."
git mv models/CalendarEntry.js models/calendarEntry.js.temp 2>/dev/null || true
git mv models/calendarEntry.js.temp models/calendarEntry.js 2>/dev/null || true

echo "Fixing case-sensitive imports for User model..."
git mv models/User.js models/user.js.temp 2>/dev/null || true
git mv models/user.js.temp models/user.js 2>/dev/null || true

echo "Fixing case-sensitive imports for ContentIdea model..."
git mv models/ContentIdea.js models/contentIdea.js.temp 2>/dev/null || true
git mv models/contentIdea.js.temp models/contentIdea.js 2>/dev/null || true

# Update import paths in all files
echo "Updating import paths in files..."
find routes -name "*.js" -exec sed -i '' 's/models\/Product/models\/product/g' {} \;
find routes -name "*.js" -exec sed -i '' 's/models\/Goal/models\/goal/g' {} \;
find routes -name "*.js" -exec sed -i '' 's/models\/CalendarEntry/models\/calendarEntry/g' {} \;
find routes -name "*.js" -exec sed -i '' 's/models\/User/models\/user/g' {} \;
find routes -name "*.js" -exec sed -i '' 's/models\/ContentIdea/models\/contentIdea/g' {} \;

echo "Done! Make sure to commit these changes before deploying to Render." 