#!/bin/bash

# Loveworld Translators Virtual Studio - GitHub Repository Setup Script
# This script initializes the GitHub repository and prepares for first deployment

set -e  # Exit on error

echo "🚀 Loveworld Translators Virtual Studio - GitHub Setup"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: Must run from frontend-react directory${NC}"
    exit 1
fi

echo -e "${BLUE}📋 Step 1: Verify Git Repository${NC}"
if [ ! -d ".git" ]; then
    echo -e "${RED}❌ Not a git repository${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Git repository exists${NC}"
echo ""

echo -e "${BLUE}🔍 Step 2: Check Current Remote${NC}"
CURRENT_REMOTE=$(git remote get-url origin 2>/dev/null || echo "none")
if [ "$CURRENT_REMOTE" != "none" ]; then
    echo -e "${YELLOW}⚠️  Remote 'origin' already exists: $CURRENT_REMOTE${NC}"
    read -p "Do you want to remove it and add GitHub remote? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git remote remove origin
        echo -e "${GREEN}✅ Removed existing remote${NC}"
    else
        echo -e "${YELLOW}⚠️  Keeping existing remote${NC}"
    fi
else
    echo -e "${GREEN}✅ No remote configured${NC}"
fi
echo ""

echo -e "${BLUE}🔗 Step 3: Add GitHub Remote${NC}"
if git remote get-url origin >/dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Remote 'origin' already configured${NC}"
else
    echo ""
    echo "Enter your GitHub repository URL:"
    echo "Examples:"
    echo "  SSH: git@github.com:YOUR_USERNAME/virtual-translator-studio.git"
    echo "  HTTPS: https://github.com/YOUR_USERNAME/virtual-translator-studio.git"
    echo ""
    read -p "GitHub URL: " GITHUB_URL
    
    if [ -z "$GITHUB_URL" ]; then
        echo -e "${RED}❌ No URL provided${NC}"
        exit 1
    fi
    
    git remote add origin "$GITHUB_URL"
    echo -e "${GREEN}✅ Added GitHub remote: $GITHUB_URL${NC}"
fi
echo ""

echo -e "${BLUE}🔐 Step 4: Verify Keystore Files${NC}"
if [ ! -f "virtual-studio-release.keystore" ]; then
    echo -e "${RED}❌ Keystore file not found: virtual-studio-release.keystore${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Keystore file exists${NC}"

if [ ! -f "keystore-base64.txt" ]; then
    echo -e "${YELLOW}⚠️  Base64 keystore not found, generating...${NC}"
    base64 -w 0 virtual-studio-release.keystore > keystore-base64.txt
    echo -e "${GREEN}✅ Generated keystore-base64.txt${NC}"
else
    echo -e "${GREEN}✅ Base64 keystore exists${NC}"
fi

KEYSTORE_SIZE=$(wc -c < keystore-base64.txt)
echo -e "${GREEN}   Keystore size: $KEYSTORE_SIZE characters${NC}"
echo ""

echo -e "${BLUE}📝 Step 5: Display GitHub Secrets${NC}"
echo ""
echo "Copy these values to GitHub:"
echo "Repository → Settings → Secrets and variables → Actions → New repository secret"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo -e "${YELLOW}1. APPSTORE_API_KEY${NC}"
echo "   Value: [Contact TNI App Store admin for API key]"
echo ""
echo -e "${YELLOW}2. APPSTORE_API_URL${NC}"
echo "   Value: https://standardapi.tniglobal.org/api/v1"
echo ""
echo -e "${YELLOW}3. KEYSTORE_FILE${NC}"
echo "   Preview: $(head -c 80 keystore-base64.txt)..."
echo "   Full value location: $(pwd)/keystore-base64.txt"
echo "   To copy: cat $(pwd)/keystore-base64.txt | xclip -selection clipboard"
echo ""
echo -e "${YELLOW}4. KEYSTORE_PASSWORD${NC}"
echo "   Value: TNIVirtualStudio2026!"
echo ""
echo -e "${YELLOW}5. KEY_ALIAS${NC}"
echo "   Value: virtualstudio"
echo ""
echo -e "${YELLOW}6. KEY_PASSWORD${NC}"
echo "   Value: TNIVirtualStudio2026!"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

read -p "Have you configured all 6 GitHub secrets? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}⚠️  Please configure GitHub secrets before continuing${NC}"
    echo "   See: GITHUB_SECRETS_SETUP.md for detailed instructions"
    exit 0
fi
echo ""

echo -e "${BLUE}📦 Step 6: Check Git Status${NC}"
if [ -n "$(git status --porcelain)" ]; then
    echo -e "${YELLOW}⚠️  You have uncommitted changes${NC}"
    git status --short
    echo ""
    read -p "Do you want to commit these changes? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git add .
        git commit -m "feat: prepare for GitHub deployment

- Add GitHub Actions workflow for TNI App Store
- Configure production signing keystore
- Add comprehensive documentation
- Package: org.tniglobal.virtualstudio
- Version: 1.0.0"
        echo -e "${GREEN}✅ Changes committed${NC}"
    fi
else
    echo -e "${GREEN}✅ Working directory clean${NC}"
fi
echo ""

echo -e "${BLUE}🏷️  Step 7: Create Version Tag${NC}"
if git rev-parse v1.0.0 >/dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Tag v1.0.0 already exists${NC}"
else
    git tag -a v1.0.0 -m "Release v1.0.0 - Virtual Translator Studio

Initial production release with:
- Real-time translation for 100+ language pairs
- Live streaming translation with WebRTC
- Push notifications via OneSignal
- Collaborative translation workflow
- Professional project management
- Mobile-optimized interface

Package: org.tniglobal.virtualstudio
Target SDK: 35 (Android 14)
Min SDK: 23 (Android 6.0)"
    echo -e "${GREEN}✅ Created tag v1.0.0${NC}"
fi
echo ""

echo -e "${BLUE}🚀 Step 8: Push to GitHub${NC}"
echo ""
echo "Ready to push code and tag to GitHub?"
echo "This will trigger the GitHub Actions workflow to:"
echo "  1. Build the React app"
echo "  2. Create signed APK"
echo "  3. Upload to TNI App Store"
echo "  4. Create GitHub Release"
echo ""
read -p "Push to GitHub now? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo "Pushing main branch..."
    git push -u origin main
    echo -e "${GREEN}✅ Pushed main branch${NC}"
    echo ""
    
    echo "Pushing tag v1.0.0..."
    git push origin v1.0.0
    echo -e "${GREEN}✅ Pushed tag v1.0.0${NC}"
    echo ""
    
    GITHUB_URL=$(git remote get-url origin)
    REPO_PATH=$(echo "$GITHUB_URL" | sed 's/.*github.com[:/]\(.*\)\.git/\1/' | sed 's/.*github.com[:/]\(.*\)/\1/')
    
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}🎉 Successfully pushed to GitHub!${NC}"
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo "📊 Monitor deployment:"
    echo "   GitHub Actions: https://github.com/$REPO_PATH/actions"
    echo ""
    echo "📱 Check app store:"
    echo "   TNI App Store: https://appstore.tniglobal.org/apps/org.tniglobal.virtualstudio"
    echo ""
    echo "📦 Download release:"
    echo "   GitHub Releases: https://github.com/$REPO_PATH/releases"
    echo ""
else
    echo ""
    echo -e "${YELLOW}⚠️  Push cancelled${NC}"
    echo ""
    echo "To push manually later, run:"
    echo "  git push -u origin main"
    echo "  git push origin v1.0.0"
    echo ""
fi

echo ""
echo -e "${GREEN}✅ Setup complete!${NC}"
echo ""
echo "📚 Documentation:"
echo "   - GO_LIVE_INSTRUCTIONS.md - Deployment guide"
echo "   - GITHUB_SECRETS_SETUP.md - Secrets configuration"
echo "   - APP_STORE_METADATA.md - App information"
echo "   - MOBILE_APP_RELEASE.md - Release checklist"
echo ""
