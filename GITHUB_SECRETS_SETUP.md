# GitHub Secrets Configuration Guide

**Required for GitHub Actions workflow to publish to TNI App Store**

## 📋 Required Secrets

Configure these 6 secrets in your GitHub repository:  
**Settings → Secrets and variables → Actions → New repository secret**

---

### 1. APPSTORE_API_KEY
**Description:** Authentication key for TNI App Store API  
**Value:** Get from TNI App Store admin dashboard  
**How to obtain:** Contact TNI App Store administrator or check admin panel

```
Example: tni_app_store_api_key_1234567890abcdef
```

---

### 2. APPSTORE_API_URL
**Description:** TNI App Store API endpoint  
**Value:** 
```
https://standardapi.tniglobal.org/api/v1
```

---

### 3. KEYSTORE_FILE
**Description:** Base64-encoded production signing keystore  
**Value location:** `/home/tniglobal/public_html/webrtc/browser-based-translation/frontend-react/keystore-base64.txt`

**To get the value:**
```bash
cat /home/tniglobal/public_html/webrtc/browser-based-translation/frontend-react/keystore-base64.txt
```

Copy the entire base64 string (3,720 characters) and paste as secret value.

---

### 4. KEYSTORE_PASSWORD
**Description:** Password for the keystore file  
**Value:**
```
TNIVirtualStudio2026!
```

---

### 5. KEY_ALIAS
**Description:** Alias of the signing key in the keystore  
**Value:**
```
virtualstudio
```

---

### 6. KEY_PASSWORD
**Description:** Password for the signing key  
**Value:**
```
TNIVirtualStudio2026!
```

---

## 🔧 Step-by-Step Setup

1. **Open GitHub Repository Settings**
   - Navigate to your repository
   - Click **Settings** tab
   - Go to **Secrets and variables** → **Actions**

2. **Add Each Secret**
   - Click **New repository secret**
   - Enter the name exactly as shown above
   - Paste the corresponding value
   - Click **Add secret**
   - Repeat for all 6 secrets

3. **Verify All Secrets Added**
   You should see all 6 secrets listed:
   - ✅ APPSTORE_API_KEY
   - ✅ APPSTORE_API_URL
   - ✅ KEYSTORE_FILE
   - ✅ KEYSTORE_PASSWORD
   - ✅ KEY_ALIAS
   - ✅ KEY_PASSWORD

---

## 🔐 Security Notes

**IMPORTANT:**
- Never commit the keystore file to git
- Never commit passwords to git
- Keep keystore-base64.txt secure (add to .gitignore)
- Backup the keystore file securely (losing it means you can't update the app)
- GitHub secrets are encrypted and only accessible to workflows

**Backup Checklist:**
- [ ] Save `virtual-studio-release.keystore` to secure location
- [ ] Save keystore password in password manager
- [ ] Document key alias in secure location
- [ ] Store backup copy offline

---

## ✅ Verification

After adding all secrets, test the workflow:

```bash
cd /home/tniglobal/public_html/webrtc/browser-based-translation/frontend-react
git tag v1.0.0
git push origin v1.0.0
```

Then check:
- GitHub Actions workflow runs successfully
- APK is signed and uploaded to TNI App Store
- GitHub Release is created with APK attached

---

## 📞 Need Help?

**Missing APPSTORE_API_KEY?**
Contact TNI App Store administrator at: appstore-admin@tniglobal.org

**Keystore Issues?**
Regenerate keystore:
```bash
cd /home/tniglobal/public_html/webrtc/browser-based-translation/frontend-react
keytool -genkey -v -keystore virtual-studio-release.keystore \
  -alias virtualstudio -keyalg RSA -keysize 2048 -validity 10000
```

**GitHub Actions Failing?**
Check workflow logs: Repository → Actions → select workflow run → view logs

---

**Last Updated:** January 15, 2026  
**Keystore Created:** January 15, 2026  
**Validity:** Until November 2053 (27+ years)
