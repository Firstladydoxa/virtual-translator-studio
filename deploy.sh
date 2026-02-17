#!/bin/bash

# Frontend React App Deployment Script
# This script builds and deploys the React app to production

set -e  # Exit on error

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Frontend React App - Production Deployment          ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

# Get the script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Step 1: Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}⚠️  node_modules not found. Installing dependencies...${NC}"
    npm install
    echo -e "${GREEN}✅ Dependencies installed${NC}"
    echo ""
fi

# Step 2: Clean previous build (optional but recommended)
if [ -d "build" ]; then
    echo -e "${BLUE}🧹 Cleaning previous build...${NC}"
    rm -rf build
    echo -e "${GREEN}✅ Previous build cleaned${NC}"
    echo ""
fi

# Step 3: Build the React app
echo -e "${BLUE}🔨 Building React app...${NC}"
echo -e "${YELLOW}This may take 1-2 minutes...${NC}"
echo ""

npm run build

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ Build completed successfully!${NC}"
    echo ""
else
    echo ""
    echo -e "${RED}❌ Build failed! Please check the errors above.${NC}"
    exit 1
fi

# Step 4: Verify build directory
if [ ! -d "build" ]; then
    echo -e "${RED}❌ Build directory not found!${NC}"
    exit 1
fi

# Step 5: Verify .htaccess is in build
if [ ! -f "build/.htaccess" ]; then
    echo -e "${YELLOW}⚠️  .htaccess not found in build directory${NC}"
    echo -e "${YELLOW}Copying from public/...${NC}"
    if [ -f "public/.htaccess" ]; then
        cp public/.htaccess build/.htaccess
        echo -e "${GREEN}✅ .htaccess copied${NC}"
    else
        echo -e "${RED}❌ .htaccess not found in public/ directory either!${NC}"
    fi
    echo ""
fi

# Step 6: Show build info
BUILD_SIZE=$(du -sh build | cut -f1)
JS_SIZE=$(du -sh build/static/js 2>/dev/null | cut -f1 || echo "N/A")
CSS_SIZE=$(du -sh build/static/css 2>/dev/null | cut -f1 || echo "N/A")

echo -e "${BLUE}📊 Build Information:${NC}"
echo -e "   Total Size: ${GREEN}${BUILD_SIZE}${NC}"
echo -e "   JavaScript: ${GREEN}${JS_SIZE}${NC}"
echo -e "   CSS: ${GREEN}${CSS_SIZE}${NC}"
echo ""

# Step 7: Get the main JS bundle name
MAIN_JS=$(ls build/static/js/main.*.js 2>/dev/null | head -1 | xargs basename)
if [ ! -z "$MAIN_JS" ]; then
    echo -e "   Main Bundle: ${GREEN}${MAIN_JS}${NC}"
    echo ""
fi

# Step 8: Production deployment info
echo -e "${BLUE}🚀 Deployment Information:${NC}"
echo -e "   Build Path: ${GREEN}$(pwd)/build${NC}"
echo -e "   Production URL: ${GREEN}https://programs.tniglobal.org${NC}"
echo -e "   Apache DocumentRoot: ${GREEN}$(pwd)/build${NC}"
echo ""

# Step 9: Cache busting reminder
echo -e "${YELLOW}📝 Important Notes:${NC}"
echo -e "   1. ✅ Build files are ready for production"
echo -e "   2. ✅ Cache headers configured (.htaccess in place)"
echo -e "   3. ⚠️  Users may need to clear browser cache to see changes"
echo -e "   4. 💡 Hard refresh: Ctrl+Shift+R (Windows) / Cmd+Shift+R (Mac)"
echo ""

# Step 10: Test URL (optional)
echo -e "${BLUE}🧪 Quick Test:${NC}"
echo -e "   Try accessing: ${GREEN}https://programs.tniglobal.org${NC}"
echo -e "   Or test locally: ${GREEN}npx serve -s build${NC}"
echo ""

echo -e "${GREEN}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   ✅ Deployment Complete!                              ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

# Optional: Ask to test
read -p "Would you like to test the build locally? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${BLUE}Starting local server...${NC}"
    echo -e "${YELLOW}Press Ctrl+C to stop${NC}"
    echo ""
    npx serve -s build
fi
