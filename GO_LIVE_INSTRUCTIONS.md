# 🚀 Virtual Translator Studio - Go Live Instructions

**Status:** Ready to deploy to TNI App Store  
**Version:** 1.0.0  
**Package:** org.tniglobal.virtualstudio  
**Date:** January 15, 2026

---

## ✅ Completed Steps

1. ✅ **Production Keystore Generated**
   - File: `virtual-studio-release.keystore`
   - Alias: `virtualstudio`
   - Password: `TNIVirtualStudio2026!`
   - Validity: 27+ years (until November 2053)
   - Base64 encoded: `keystore-base64.txt` (3,720 characters)

2. ✅ **Security Configured**
   - Keystore files added to `.gitignore`
   - Passwords documented in `GITHUB_SECRETS_SETUP.md`
   - Backup instructions provided

3. ✅ **Code Committed**
   - 109 files committed to git
   - Commit hash: `be7ac10`
   - Message: "feat: Virtual Translator Studio v1.0.0 - Mobile App Release"

4. ✅ **Version Tagged**
   - Tag: `v1.0.0`
   - Annotated with release notes
   - Ready to push

---

## 🔐 REQUIRED: Configure GitHub Secrets

**Before pushing the tag, configure these 6 secrets in GitHub:**

Navigate to: **Repository → Settings → Secrets and variables → Actions → New repository secret**

### Copy These Values:

1. **APPSTORE_API_KEY**
   ```
   [GET FROM TNI APP STORE ADMIN - Contact: appstore-admin@tniglobal.org]
   ```

2. **APPSTORE_API_URL**
   ```
   https://standardapi.tniglobal.org/api/v1
   ```

3. **KEYSTORE_FILE**
   ```bash
   # Copy the entire content from this file:
   cat /home/tniglobal/public_html/webrtc/browser-based-translation/frontend-react/keystore-base64.txt
   ```

4. **KEYSTORE_PASSWORD**
   ```
   TNIVirtualStudio2026!
   ```

5. **KEY_ALIAS**
   ```
   virtualstudio
   ```

6. **KEY_PASSWORD**
   ```
   TNIVirtualStudio2026!
   ```

**See [GITHUB_SECRETS_SETUP.md](GITHUB_SECRETS_SETUP.md) for detailed instructions.**

---

## 🚀 Deploy to TNI App Store

### Step 1: Create GitHub Repository

1. **Go to GitHub:** https://github.com/new
2. **Repository details:**
   - Name: `virtual-translator-studio`
   - Description: `Professional real-time translation studio with live streaming support`
   - Visibility: Private (recommended) or Public
   - **Do NOT initialize** with README, .gitignore, or license (we have these already)
3. **Click:** Create repository

### Step 2: Configure GitHub Remote

```bash
cd /home/tniglobal/public_html/webrtc/browser-based-translation/frontend-react

# Add GitHub remote (replace YOUR_USERNAME with your GitHub username or org)
git remote add origin git@github.com:YOUR_USERNAME/virtual-translator-studio.git

# Or use HTTPS if you don't have SSH keys set up:
git remote add origin https://github.com/YOUR_USERNAME/virtual-translator-studio.git

# Verify remote
git remote -v
```

### Step 3: Push Code and Tag

```bash
# Push main branch
git push -u origin main

# Push the version tag (this triggers GitHub Actions!)
git push origin v1.0.0
```

### Step 4: Monitor Deployment

1. **Watch GitHub Actions:**
   - Go to: https://github.com/YOUR_USERNAME/virtual-translator-studio/actions
   - Click on the running workflow: "Publish to TNI App Store"
   - Monitor each step:
     - ✓ Checkout code
     - ✓ Setup Node.js 20
     - ✓ Setup Java 21
     - ✓ npm ci
     - ✓ npm run build
     - ✓ npx cap sync android
     - ✓ Decode keystore
     - ✓ Build release APK
     - ✓ Extract version info
     - ✓ Upload to TNI App Store
     - ✓ Create GitHub Release

2. **Check TNI App Store:**
   - URL: https://appstore.tniglobal.org/apps/org.tniglobal.virtualstudio
   - Verify app appears in store
   - Check metadata is correct
   - Test download link

3. **Verify GitHub Release:**
   - Go to: https://github.com/YOUR_USERNAME/virtual-translator-studio/releases
   - Check v1.0.0 release is created with APK attached
   - Download APK and verify it's the signed version

---

## 📱 Test the Published APK

### Download from TNI App Store:
```bash
# Download the published APK
wget https://appstore.tniglobal.org/download/org.tniglobal.virtualstudio/latest -O VirtualStudio-v1.0.0.apk

# Or from GitHub Release
wget https://github.com/YOUR_USERNAME/virtual-translator-studio/releases/download/v1.0.0/app-release.apk
```

### Install on Android Device:
```bash
# Via ADB
adb install VirtualStudio-v1.0.0.apk

# Or transfer to device and install manually
# (Enable "Install from unknown sources" in Settings)
```

### Testing Checklist:
- [ ] App installs successfully
- [ ] App icon displays correctly
- [ ] Login works
- [ ] Dashboard loads
- [ ] Translation features work
- [ ] Push notifications work
- [ ] Live streaming works
- [ ] All permissions granted correctly
- [ ] No crashes or errors
- [ ] Performance is smooth

---

## 🔄 Future Updates

### To Release v1.0.1:

1. **Update version in `android/app/build.gradle`:**
   ```gradle
   versionCode 2
   versionName "1.0.1"
   ```

2. **Update `APP_STORE_METADATA.md`:**
   - Add to version history table
   - Update current version
   - Add changelog entry

3. **Commit and tag:**
   ```bash
   cd /home/tniglobal/public_html/webrtc/browser-based-translation/frontend-react
   git add .
   git commit -m "chore: bump version to 1.0.1"
   git tag -a v1.0.1 -m "Release v1.0.1 - Bug fixes and improvements"
   git push origin main
   git push origin v1.0.1
   ```

4. **GitHub Actions automatically:**
   - Builds signed APK
   - Uploads to TNI App Store
   - Creates GitHub Release with APK attached

---

## 🆘 Troubleshooting

### Workflow Fails: "Keystore decode error"
**Solution:** Re-encode and update GitHub secret
```bash
cd /home/tniglobal/public_html/webrtc/browser-based-translation/frontend-react
base64 -w 0 virtual-studio-release.keystore > keystore-base64.txt
# Copy content and update KEYSTORE_FILE secret in GitHub (Settings → Secrets → Actions)
```

### Workflow Fails: "Signing failed"
**Solution:** Verify keystore passwords match in GitHub secrets
- Check KEYSTORE_PASSWORD secret
- Check KEY_PASSWORD secret
- Ensure they match `TNIVirtualStudio2026!`

### Workflow Fails: "TNI App Store upload failed"
**Solution:** Check API credentials in GitHub secrets
- Verify APPSTORE_API_KEY is correct
- Verify APPSTORE_API_URL is correct
- Contact TNI App Store admin if needed

### Build Fails: "Java version"
**Solution:** Workflow uses Java 21 automatically
- GitHub Actions handles Java setup
- No local action needed

### Workflow Not Triggering
**Solution:** Check workflow file and tag format
- Verify `.github/workflows/publish-to-appstore.yml` exists
- Check tag format matches `v*.*.*` pattern (e.g., v1.0.0)
- View Actions tab to see if workflows are enabled

---

## 📊 Monitoring

### Key Metrics to Track:

1. **TNI App Store:**
   - Total downloads
   - Active users
   - Update rate
   - Ratings/reviews

2. **GitHub Actions:**
   - Build success rate
   - Build duration
   - Workflow runs count
   - Actions minutes usage

3. **App Performance:**
   - Crash-free rate
   - App startup time
   - Translation response time
   - Push notification delivery rate

---

## 📞 Support Contacts

**TNI App Store Admin:**
- Email: appstore-admin@tniglobal.org
- For: API keys, store issues, metadata updates

**Technical Support:**
- Email: support@tniglobal.org
- For: App bugs, feature requests, user issues

**Development Team:**
- For: Code issues, build problems, deployment questions

---

## 📝 Important Files Reference

| File | Purpose | Location |
|------|---------|----------|
| Keystore | Production signing | `virtual-studio-release.keystore` |
| Keystore Base64 | GitHub secret value | `keystore-base64.txt` |
| Workflow | CI/CD automation | `.github/workflows/publish-to-appstore.yml` |
| Metadata | App store info | `APP_STORE_METADATA.md` |
| Secrets Guide | GitHub setup | `GITHUB_SECRETS_SETUP.md` |
| Release Guide | Deployment docs | `MOBILE_APP_RELEASE.md` |
| This File | Go-live checklist | `GO_LIVE_INSTRUCTIONS.md` |

---

## 🎉 Success Indicators

You'll know the deployment succeeded when:

✅ GitHub Actions workflow completes with green checkmark  
✅ APK appears in TNI App Store at specified URL  
✅ GitHub Release v1.0.0 is created with APK attached  
✅ App can be downloaded and installed on Android devices  
✅ All features work correctly in production APK  
✅ Push notifications are received  

---

**Ready to Go Live!** 🚀

Push the tag when GitHub secrets are configured:
```bash
cd /home/tniglobal/public_html/webrtc/browser-based-translation/frontend-react
git push origin v1.0.0
```

---

**Last Updated:** January 15, 2026  
**Next Review:** After first successful deployment
