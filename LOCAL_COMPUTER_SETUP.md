# 🖥️ Local Computer Quick Start Guide
## Loveworld Translators Virtual Studio - Android Development

---

## 📋 For Your Local Windows/macOS/Linux Computer

This guide shows you how to get the project from GitHub onto your local computer and open it in Android Studio.

---

## ✅ Prerequisites (Install These First)

Before starting, ensure you have:

1. ✅ **Git** - https://git-scm.com/downloads
2. ✅ **Node.js (v16+)** - https://nodejs.org/
3. ✅ **Java JDK 17 or 21** - https://adoptium.net/
4. ✅ **Android Studio** - https://developer.android.com/studio

---

## 🚀 Step-by-Step Instructions

### Step 1: Open Terminal/Command Prompt

**Windows:** 
- Press `Win + R`, type `cmd`, press Enter
- Or use PowerShell or Windows Terminal

**macOS:** 
- Press `Cmd + Space`, type `Terminal`, press Enter

**Linux:** 
- Press `Ctrl + Alt + T`

### Step 2: Navigate to Your Projects Folder

```bash
# Choose where you want the project
cd Documents

# Or create a dedicated folder
mkdir Projects
cd Projects
```

### Step 3: Clone the Repository

```bash
git clone https://github.com/Firstladydoxa/virtual-translator-studio.git
```

**What you'll see:**
```
Cloning into 'virtual-translator-studio'...
remote: Enumerating objects: XXX, done.
remote: Counting objects: 100% (XXX/XXX), done.
Receiving objects: 100% (XXX/XXX), XX.XX MiB | X.XX MiB/s, done.
```

### Step 4: Navigate into the Project

```bash
cd virtual-translator-studio
```

### Step 5: Install Dependencies

```bash
npm install
```

**Wait time:** ~2-5 minutes (downloads ~1500 packages)

**What you'll see:**
```
added 1500+ packages in XXs
```

### Step 6: Build the React Application

```bash
npm run build
```

**Wait time:** ~1-2 minutes

**What you'll see:**
```
Creating an optimized production build...
Compiled successfully!
```

### Step 7: Sync with Android

```bash
npx cap sync android
```

**Wait time:** ~10-30 seconds

**What you'll see:**
```
✔ Copying web assets from build to android/app/src/main/assets/public
✔ Syncing finished
```

### Step 8: Open in Android Studio

**Option A: Using Command (Recommended)**
```bash
npm run cap:open:android
```

This will automatically launch Android Studio with the project.

**Option B: Open Manually**
1. Launch Android Studio
2. Click **"Open"** or **File → Open**
3. Navigate to: `Documents/virtual-translator-studio/android`
4. Click **OK**

### Step 9: Wait for Initial Setup (First Time Only)

Android Studio will:
- ✅ Download Gradle wrapper (~5 minutes)
- ✅ Download Android build tools (~5-10 minutes)
- ✅ Sync Gradle dependencies (~2-5 minutes)
- ✅ Index project files (~2-3 minutes)

**Total first-time wait: 15-25 minutes**

You'll see progress at the bottom of Android Studio.

### Step 10: Connect Your Android Device

#### Enable Developer Mode on Phone:
1. Go to **Settings → About Phone**
2. Tap **Build Number** 7 times
3. Go back to **Settings → Developer Options**
4. Enable **USB Debugging**

#### Connect and Run:
1. Connect your phone via USB
2. Allow USB Debugging when prompted on phone
3. In Android Studio, click the **Run** button (▶️ green play icon)
4. Select your device from the dropdown
5. Click **OK**

**Wait time:** ~1-2 minutes for first install

### Step 11: Success! 🎉

The Loveworld Translators Virtual Studio app should now install and launch on your Android device!

---

## 🔄 Making Changes and Rebuilding

Whenever you modify the React code:

```bash
# Step 1: Rebuild React app
npm run build

# Step 2: Sync with Android
npx cap sync android

# Step 3: In Android Studio, click Run (▶️)
```

Or use the combined command:
```bash
npm run android:build
```

---

## 📥 Getting Updates from Server

To pull the latest changes:

```bash
# Navigate to project
cd Documents/virtual-translator-studio

# Pull latest changes
git pull origin main

# Reinstall dependencies (if package.json changed)
npm install

# Rebuild
npm run build
npx cap sync android
```

---

## 🆘 Troubleshooting

### Problem: "git: command not found"
**Solution:** Install Git from https://git-scm.com/downloads

### Problem: "npm: command not found"
**Solution:** Install Node.js from https://nodejs.org/

### Problem: "JAVA_HOME not set"
**Solution:**

**Windows:**
1. Install JDK from https://adoptium.net/
2. Set environment variable:
   - Search "Environment Variables"
   - Add `JAVA_HOME` = `C:\Program Files\Java\jdk-17`
   - Add to PATH: `%JAVA_HOME%\bin`

**macOS/Linux:**
```bash
export JAVA_HOME=/Library/Java/JavaVirtualMachines/jdk-17.jdk/Contents/Home
export PATH=$JAVA_HOME/bin:$PATH
```

### Problem: "Device not detected"
**Solution:**
```bash
# Check if device is connected
adb devices

# If empty, restart ADB
adb kill-server
adb start-server

# Check again
adb devices
```

### Problem: "Gradle sync failed"
**Solution:**
1. In Android Studio: **File → Invalidate Caches / Restart**
2. Or in terminal:
   ```bash
   cd android
   ./gradlew clean  # macOS/Linux
   gradlew.bat clean  # Windows
   ```

---

## 📊 Project Information

- **Repository:** https://github.com/Firstladydoxa/virtual-translator-studio.git
- **App Name:** Loveworld Translators Virtual Studio
- **Version:** 1.0.0
- **Package ID:** org.tniglobal.virtualstudio
- **Min Android:** 6.0 (API 23)
- **Target Android:** 15 (API 35)

---

## 📁 Important Project Structure

After cloning, your folder structure will be:

```
virtual-translator-studio/
├── android/                              ← Open THIS in Android Studio
│   ├── app/
│   │   └── build/outputs/apk/           ← Built APK files
│   └── build.gradle
├── src/                                  ← React source code
├── public/                               ← Static assets
├── build/                                ← React production build (after npm run build)
├── package.json                          ← Dependencies
├── capacitor.config.ts                   ← Capacitor configuration
├── ANDROID_STUDIO_DEPLOYMENT_GUIDE.md   ← Full documentation
└── build-android.sh                      ← Build script
```

---

## ⚡ Quick Command Reference

```bash
# Clone from GitHub
git clone https://github.com/Firstladydoxa/virtual-translator-studio.git
cd virtual-translator-studio

# Install and build
npm install
npm run build
npx cap sync android

# Open in Android Studio
npm run cap:open:android

# Or do everything at once
npm run android:studio

# Pull updates
git pull origin main

# Check connected devices
adb devices

# Install APK manually
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

---

## 🎯 Summary - Complete Process

| Step | Command | Wait Time |
|------|---------|-----------|
| 1. Clone | `git clone https://github.com/Firstladydoxa/virtual-translator-studio.git` | 30s |
| 2. Navigate | `cd virtual-translator-studio` | Instant |
| 3. Install | `npm install` | 2-5 min |
| 4. Build | `npm run build` | 1-2 min |
| 5. Sync | `npx cap sync android` | 10-30s |
| 6. Open | `npm run cap:open:android` | 15-25 min (first time) |
| 7. Run | Click ▶️ in Android Studio | 1-2 min |

**Total time (first run):** ~20-35 minutes  
**Total time (subsequent runs):** ~5 minutes

---

## ✅ Final Checklist

Before you start:
- [ ] Git installed and working (`git --version`)
- [ ] Node.js installed and working (`node --version`)
- [ ] Java JDK installed (`java -version`)
- [ ] Android Studio installed
- [ ] Android device in Developer Mode
- [ ] USB Debugging enabled on device
- [ ] USB cable ready

During setup:
- [ ] Repository cloned successfully
- [ ] Dependencies installed (`node_modules/` folder exists)
- [ ] React app built (`build/` folder exists)
- [ ] Android synced (no errors)
- [ ] Android Studio opened without errors
- [ ] Gradle sync completed
- [ ] Device detected in Android Studio

---

## 📞 Need Help?

1. **Check the full guide:** `ANDROID_STUDIO_DEPLOYMENT_GUIDE.md`
2. **Common issues:** See troubleshooting section above
3. **Git repository:** https://github.com/Firstladydoxa/virtual-translator-studio

---

**Last Updated:** February 13, 2026  
**Version:** 1.0.0  
**Quick Start Guide for Local Computer Development**
