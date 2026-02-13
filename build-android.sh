#!/bin/bash

# Loveworld Translators Virtual Studio - Quick Build Script
# Version 1.0.0

set -e  # Exit on error

echo "=================================================="
echo "Loveworld Translators Virtual Studio v1.0.0"
echo "Android Build Script"
echo "=================================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Navigate to project directory
cd "$(dirname "$0")"

echo -e "${BLUE}Step 1:${NC} Installing dependencies..."
npm install

echo ""
echo -e "${BLUE}Step 2:${NC} Building React application..."
npm run build

echo ""
echo -e "${BLUE}Step 3:${NC} Syncing with Android project..."
npx cap sync android

echo ""
echo -e "${BLUE}Step 4:${NC} Building Android APK..."
cd android
./gradlew assembleDebug

echo ""
echo -e "${BLUE}Step 5:${NC} Copying APK to release folder..."
cd ..
mkdir -p release
cp android/app/build/outputs/apk/debug/app-debug.apk \
   release/LoveworldTranslatorsVirtualStudio-v1.0.0-debug.apk

echo ""
echo -e "${GREEN}✓ Build completed successfully!${NC}"
echo ""
echo "APK Location: release/LoveworldTranslatorsVirtualStudio-v1.0.0-debug.apk"
echo "APK Size: $(du -h release/LoveworldTranslatorsVirtualStudio-v1.0.0-debug.apk | cut -f1)"
echo ""
echo "To install on device:"
echo "  adb install release/LoveworldTranslatorsVirtualStudio-v1.0.0-debug.apk"
echo ""
echo "To open in Android Studio:"
echo "  npm run android:studio"
echo ""
echo "=================================================="
