# 📦 Loveworld Translators Virtual Studio - Release Builds

## Version 1.0.0

This directory contains the compiled Android APK files for the Loveworld Translators Virtual Studio mobile application.

---

## 📱 Current Release

### Debug Build (Testing)
- **File:** `LoveworldTranslatorsVirtualStudio-v1.0.0-debug.apk`
- **Version:** 1.0.0 (Build 1)
- **Size:** ~6.7 MB
- **Package ID:** org.tniglobal.virtualstudio
- **Signed:** Debug signature (not for production)
- **Use Case:** Development, testing, internal distribution

### Installation

#### On Physical Device (via USB):
```bash
adb install LoveworldTranslatorsVirtualStudio-v1.0.0-debug.apk
```

#### On Physical Device (via File Transfer):
1. Copy APK to device
2. Open file manager on device
3. Tap the APK file
4. Allow "Install from Unknown Sources" if prompted
5. Tap "Install"

---

## 🚀 Building Release APK (Production)

For production deployment to Google Play Store or direct distribution:

### Option 1: Using Android Studio

1. Open project in Android Studio
   ```bash
   npm run android:studio
   ```

2. **Build → Generate Signed Bundle / APK**
3. Select **APK**
4. Choose keystore: `../virtual-studio-release.keystore`
5. Enter credentials
6. Select **release** variant
7. Click **Finish**

Output: `android/app/build/outputs/apk/release/app-release.apk`

### Option 2: Using Gradle Command Line

```bash
cd android
export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64
./gradlew assembleRelease
```

Then sign manually:
```bash
jarsigner -verbose -sigalg SHA256withRSA -digestalg SHA-256 \
  -keystore ../virtual-studio-release.keystore \
  android/app/build/outputs/apk/release/app-release-unsigned.apk \
  virtualstudio

zipalign -v 4 \
  android/app/build/outputs/apk/release/app-release-unsigned.apk \
  release/LoveworldTranslatorsVirtualStudio-v1.0.0-release.apk
```

---

## 📝 Version History

### v1.0.0 (February 13, 2026)
- ✅ Initial release
- ✅ Real-time translation studio interface
- ✅ WebRTC-based streaming
- ✅ Translator authentication system
- ✅ Live translation management
- ✅ Push notifications support (OneSignal)
- ✅ Multi-language support

---

## 🔐 Security Notes

### Debug APK
- **NOT secure** for production use
- Uses debug signing certificate
- Allows debugging and profiling
- Can be installed alongside other debug builds
- **Do not distribute publicly**

### Release APK
- Signed with production keystore
- Cannot be debugged
- Optimized and minified
- Required for Google Play Store
- Should be distributed through official channels only

---

## 📊 APK Information

- **App Name:** Loveworld Translators Virtual Studio
- **Package ID:** org.tniglobal.virtualstudio
- **Min SDK:** Android 6.0 (API 23)
- **Target SDK:** Android 15 (API 35)
- **Permissions:**
  - Internet access
  - Camera (for future features)
  - Microphone (for future features)
  - Network state
  - Wake lock
  - Notifications

---

## 🔄 Update Instructions

To release a new version:

1. **Update version in package.json:**
   ```json
   "version": "1.1.0"
   ```

2. **Update Android version:**
   Edit `android/app/build.gradle`:
   ```gradle
   versionCode 2
   versionName "1.1.0"
   ```

3. **Build and release:**
   ```bash
   ./build-android.sh
   ```

4. **Copy to release folder:**
   ```bash
   cp android/app/build/outputs/apk/debug/app-debug.apk \
      release/LoveworldTranslatorsVirtualStudio-v1.1.0-debug.apk
   ```

---

## 📱 Testing Checklist

Before releasing, ensure:

- [ ] App installs successfully
- [ ] Login functionality works
- [ ] Translation interface loads
- [ ] WebRTC streaming connects
- [ ] Real-time updates function
- [ ] Push notifications received
- [ ] Logout works properly
- [ ] App handles network errors gracefully
- [ ] No crashes during normal use
- [ ] Memory usage is reasonable
- [ ] Battery consumption is acceptable

---

## 🆘 Support

For issues or questions:
- Documentation: `/frontend-react/ANDROID_STUDIO_DEPLOYMENT_GUIDE.md`
- Technical Support: TNI Global Development Team
- Date: February 13, 2026

---

**Last Updated:** February 13, 2026  
**Maintained by:** TNI Global Development Team
