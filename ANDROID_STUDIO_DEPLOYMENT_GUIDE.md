# 🚀 Loveworld Translators Virtual Studio v1.0.0
## Complete Android Studio Deployment Guide

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [System Requirements](#system-requirements)
3. [Installation Steps](#installation-steps)
4. [Building the APK](#building-the-apk)
5. [Opening in Android Studio](#opening-in-android-studio)
6. [Testing on Device/Emulator](#testing-on-deviceemulator)
7. [Creating Release APK](#creating-release-apk)
8. [Troubleshooting](#troubleshooting)

---

## 📦 Prerequisites

### Required Software

1. **Node.js** (v16 or higher)
   - Download from: https://nodejs.org/
   - Verify installation: `node --version` and `npm --version`

2. **Java Development Kit (JDK)** - Version 17
   - Download from: https://adoptium.net/
   - Or install via package manager:
     ```bash
     # Ubuntu/Debian
     sudo apt install openjdk-17-jdk
     
     # macOS (using Homebrew)
     brew install openjdk@17
     
     # Windows (using Chocolatey)
     choco install openjdk17
     ```
   - Set JAVA_HOME environment variable:
     ```bash
     # Linux/macOS - Add to ~/.bashrc or ~/.zshrc
     export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64
     export PATH=$JAVA_HOME/bin:$PATH
     
     # Windows - System Environment Variables
     JAVA_HOME=C:\Program Files\Java\jdk-17
     ```

3. **Android Studio** (Latest version - Hedgehog or later)
   - Download from: https://developer.android.com/studio
   - Includes Android SDK, SDK Platform-Tools, and Build-Tools

4. **Android SDK**
   - Installed automatically with Android Studio
   - Required components:
     - Android SDK Platform 35 (Android 15)
     - Android SDK Build-Tools 34.0.0+
     - Android SDK Platform-Tools
     - Android Emulator (optional, for testing)

---

## 💻 System Requirements

### Minimum Requirements
- **OS:** Windows 10/11, macOS 10.14+, Linux (Ubuntu 18.04+)
- **RAM:** 8 GB (16 GB recommended)
- **Disk Space:** 10 GB free space
- **Processor:** Intel i5 or equivalent

### Recommended Requirements
- **RAM:** 16 GB+
- **Disk Space:** 20 GB+ free space (including emulator images)
- **Processor:** Intel i7 or equivalent
- **Display:** 1920x1080 or higher

---

## � Getting the Project from Git Repository

### For Local Computer (Windows/macOS/Linux)

The project is hosted on GitHub and can be cloned to your local computer for Android Studio development.

#### Step 1: Install Git

If you don't have Git installed:

**Windows:**
- Download from: https://git-scm.com/download/win
- Or use: `winget install Git.Git`

**macOS:**
```bash
brew install git
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install git
```

#### Step 2: Clone the Repository

Open a terminal (Command Prompt, PowerShell, or Terminal) on your local computer:

```bash
# Navigate to where you want the project
cd ~/Documents  # or C:\Users\YourName\Documents on Windows

# Clone the repository
git clone https://github.com/Firstladydoxa/virtual-translator-studio.git

# Navigate into the project
cd virtual-translator-studio
```

**Repository URL:** `https://github.com/Firstladydoxa/virtual-translator-studio.git`

#### Step 3: Verify Project Structure

After cloning, verify the structure:

```bash
ls -la  # Linux/macOS
dir     # Windows
```

You should see:
```
├── android/                    # Android native project
├── src/                        # React source code
├── public/                     # Static assets
├── package.json                # Dependencies
├── capacitor.config.ts         # Capacitor config
├── ANDROID_STUDIO_DEPLOYMENT_GUIDE.md
└── build-android.sh
```

---

## 🔧 Installation Steps

### Step 1: Navigate to Project Directory

**On Server (if already cloned):**
```bash
cd /home/tniglobal/public_html/webrtc/browser-based-translation/frontend-react
```

**On Local Computer (after cloning from Git):**
```bash
cd ~/Documents/virtual-translator-studio  # Linux/macOS
cd C:\Users\YourName\Documents\virtual-translator-studio  # Windows
```

### Step 2: Install Node Dependencies

```bash
npm install
```

This will install all required dependencies including:
- React and React DOM
- Capacitor (for mobile deployment)
- Socket.io-client (for real-time communication)
- WebRTC and MediaSoup clients
- All other project dependencies

**Expected output:**
```
added 1500+ packages in ~2-3 minutes
```

### Step 3: Verify Capacitor Installation

```bash
npx cap --version
```

Should show Capacitor CLI version (7.4.5 or higher).

### Step 4: Build React Application

```bash
npm run build
```

This creates an optimized production build in the `build/` directory.

**Expected output:**
```
Creating an optimized production build...
Compiled successfully!

File sizes after gzip:
  XX KB  build/static/js/main.xxxxx.js
  X KB   build/static/css/main.xxxxx.css

The build folder is ready to be deployed.
```

### Step 5: Sync with Android Project

```bash
npx cap sync android
```

This command:
- Copies the web build to the Android project
- Updates native plugins
- Syncs configuration changes

**Expected output:**
```
✔ Copying web assets from build to android/app/src/main/assets/public in XX ms
✔ Creating capacitor.config.json in android/app/src/main/assets in X ms
✔ Syncing Gradle in XX ms
✔ copy android in XX ms
✔ Updating Android plugins in XX ms
✔ update android in XX ms
```

---

## 🏗️ Building the APK

### Method 1: Using NPM Scripts (Recommended)

```bash
# Build React app and sync with Android
npm run android:build

# Open in Android Studio
npm run android:studio
```

### Method 2: Using Capacitor CLI

```bash
# Build and sync
npm run build && npx cap sync android

# Open Android Studio
npx cap open android
```

### Method 3: Manual Gradle Build (Advanced)

```bash
cd android

# For Linux/macOS
export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64
./gradlew assembleDebug

# For Windows
set JAVA_HOME=C:\Program Files\Java\jdk-17
gradlew.bat assembleDebug
```

**Output location:** `android/app/build/outputs/apk/debug/app-debug.apk`

---

## 🎨 Opening in Android Studio

### Step 1: Launch Android Studio

Open Android Studio on your local computer.

### Step 2: Open Android Project

**Option A: Using Capacitor CLI (From Terminal)**
```bash
# Navigate to project directory first
cd ~/Documents/virtual-translator-studio  # Your cloned directory

# Then open in Android Studio
npm run cap:open:android
```

**Option B: Manual Open in Android Studio (Recommended for Local)**
1. Launch Android Studio
2. Click **"Open"** (or **File → Open**)
3. Navigate to your cloned project's Android folder:
   - **Windows:** `C:\Users\YourName\Documents\virtual-translator-studio\android`
   - **macOS:** `/Users/YourName/Documents/virtual-translator-studio/android`
   - **Linux:** `/home/YourName/Documents/virtual-translator-studio/android`
4. Select the **`android`** folder (not the root project folder)
5. Click **"OK"**

**Option C: Import from Version Control (Alternative)**
1. In Android Studio: **File → New → Project from Version Control**
2. Enter repository URL: `https://github.com/Firstladydoxa/virtual-translator-studio.git`
3. Choose local directory
4. Click "Clone"
5. After cloning, navigate to the `android` subfolder and open it

**Note for Server Users:**
```bash
# On server
cd /home/tniglobal/public_html/webrtc/browser-based-translation/frontend-react
npm run cap:open:android
```

### Step 3: Wait for Gradle Sync

Android Studio will automatically:
- Download required Gradle wrapper
- Download Android build tools
- Index project files
- Sync Gradle dependencies

**First time setup may take 5-15 minutes.**

### Step 4: Configure SDK

If prompted:
1. Go to **File → Project Structure → SDK Location**
2. Verify Android SDK Location (usually: `~/Android/Sdk` or `C:\Users\YourName\AppData\Local\Android\Sdk`)
3. Verify JDK Location (Java 17)
4. Click "Apply" and "OK"

### Step 5: Verify Project Structure

You should see:
```
android/
├── app/
│   ├── src/
│   │   └── main/
│   │       ├── assets/public/     (Your React build)
│   │       ├── java/              (Android native code)
│   │       ├── res/               (App resources/icons)
│   │       └── AndroidManifest.xml
│   └── build.gradle               (App-level Gradle config)
├── build.gradle                   (Project-level Gradle config)
└── gradle.properties
```

---

## 📱 Testing on Device/Emulator

### Method 1: Testing on Physical Device

#### For Linux/Ubuntu:

1. **Enable USB Debugging on Android Device**
   - Go to Settings → About Phone
   - Tap "Build Number" 7 times to enable Developer Options
   - Go to Settings → Developer Options
   - Enable "USB Debugging"

2. **Connect Device via USB**
   ```bash
   # Verify device is detected
   adb devices
   ```
   
   Should show:
   ```
   List of devices attached
   XXXXXXXXXX      device
   ```

3. **Run from Android Studio**
   - Click the "Run" button (green play icon)
   - Select your device from the dropdown
   - Wait for app to install and launch

4. **Or Run from Terminal**
   ```bash
   npm run android:run
   ```

#### For Windows:

1. Enable USB Debugging (same as Linux)
2. Install USB drivers for your device:
   - **Samsung:** Samsung USB Driver
   - **Google Pixel:** Google USB Driver
   - **Other OEMs:** Check manufacturer website
3. Connect and run (same as Linux)

### Method 2: Testing on Android Emulator

#### Create Virtual Device:

1. In Android Studio: **Tools → Device Manager**
2. Click "Create Device"
3. Select a device definition (e.g., "Pixel 6")
4. Download a system image:
   - Recommended: **Android 13 (API 33)** or **Android 14 (API 34)**
   - Select "x86_64" for faster performance
5. Click "Finish"

#### Run on Emulator:

1. Start the emulator from Device Manager
2. Wait for emulator to boot (~30 seconds)
3. Click "Run" in Android Studio
4. Select the running emulator
5. App will install and launch

---

## 📦 Creating Release APK

### Step 1: Generate Signing Keystore

You already have a keystore at: `virtual-studio-release.keystore`

If you need to create a new one:
```bash
cd /home/tniglobal/public_html/webrtc/browser-based-translation/frontend-react

keytool -genkey -v -keystore virtual-studio-release.keystore \
  -alias virtualstudio -keyalg RSA -keysize 2048 -validity 10000
```

**Important:** Save the keystore password and alias password securely!

### Step 2: Configure Signing in Android Studio

1. Open **Build → Generate Signed Bundle / APK**
2. Select **APK**
3. Click "Next"
4. **Key store path:** Select `virtual-studio-release.keystore`
5. **Key store password:** Enter your keystore password
6. **Key alias:** `virtualstudio`
7. **Key password:** Enter your key password
8. Click "Next"
9. Select **release** build variant
10. Check **V2 (Full APK Signature)**
11. Click "Finish"

### Step 3: Build Release APK via Terminal

```bash
cd android

# Set environment
export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64

# Build release APK (unsigned)
./gradlew assembleRelease

# Or build release with signing (if configured in build.gradle)
./gradlew assembleRelease
```

**Output location:** `android/app/build/outputs/apk/release/app-release.apk`

### Step 4: Sign APK Manually (if needed)

```bash
# Align APK
zipalign -v -p 4 app-release-unsigned.apk app-release-unsigned-aligned.apk

# Sign APK
apksigner sign --ks virtual-studio-release.keystore \
  --ks-key-alias virtualstudio \
  --out app-release-signed.apk \
  app-release-unsigned-aligned.apk

# Verify signature
apksigner verify app-release-signed.apk
```

### Step 5: Copy Release APK

```bash
mkdir -p release
cp android/app/build/outputs/apk/release/app-release.apk \
   release/LoveworldTranslatorsVirtualStudio-v1.0.0.apk
```

---

## 🎯 Quick Start Commands

### Complete Build Process (From Scratch)

```bash
# Navigate to project
cd /home/tniglobal/public_html/webrtc/browser-based-translation/frontend-react

# Install dependencies (first time only)
npm install

# Build and open in Android Studio
npm run android:studio
```

### Rebuild After Code Changes

```bash
# Build React app
npm run build

# Sync with Android
npx cap sync android

# Open in Android Studio
npx cap open android
```

### Build APK from Command Line

```bash
# Build debug APK
cd android
export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64
./gradlew assembleDebug

# APK location: android/app/build/outputs/apk/debug/app-debug.apk
```

---

## 🐛 Troubleshooting

### Issue 1: "JAVA_HOME not set"

**Solution:**
```bash
# Check Java installation
java -version

# Set JAVA_HOME
export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64

# Add to ~/.bashrc for permanent fix
echo 'export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64' >> ~/.bashrc
echo 'export PATH=$JAVA_HOME/bin:$PATH' >> ~/.bashrc
source ~/.bashrc
```

### Issue 2: "Android SDK not found"

**Solution:**
1. Open Android Studio
2. Go to **File → Settings → Appearance & Behavior → System Settings → Android SDK**
3. Note the SDK Location (e.g., `/home/youruser/Android/Sdk`)
4. Set ANDROID_HOME:
   ```bash
   export ANDROID_HOME=$HOME/Android/Sdk
   export PATH=$PATH:$ANDROID_HOME/tools:$ANDROID_HOME/platform-tools
   ```

### Issue 3: "Gradle sync failed"

**Solution:**
```bash
cd android
./gradlew clean
./gradlew --refresh-dependencies
```

Or in Android Studio: **File → Invalidate Caches / Restart**

### Issue 4: "Build failed: Cannot find build-tools"

**Solution:**
1. Open Android Studio
2. Go to **Tools → SDK Manager**
3. Click "SDK Tools" tab
4. Check **Android SDK Build-Tools**
5. Click "Apply" to install

### Issue 5: "Device not detected (adb devices shows nothing)"

**Solution:**
```bash
# Restart ADB server
adb kill-server
adb start-server
adb devices

# On Linux, you may need udev rules
sudo apt install android-sdk-platform-tools-common
```

### Issue 6: "Capacitor: Could not find web assets"

**Solution:**
```bash
# Rebuild React app
npm run build

# Verify build directory exists
ls -la build/

# Sync again
npx cap sync android
```

### Issue 7: "npm ERR! code ENOENT"

**Solution:**
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and package-lock
rm -rf node_modules package-lock.json

# Reinstall
npm install
```

### Issue 8: "Out of memory during build"

**Solution:**

Edit `android/gradle.properties`:
```properties
org.gradle.jvmargs=-Xmx4096m -XX:MaxPermSize=512m -XX:+HeapDumpOnOutOfMemoryError -Dfile.encoding=UTF-8
```

### Issue 9: "Module was compiled with an incompatible version of Kotlin"

**Solution:**

Check `android/build.gradle` and ensure consistent Kotlin version:
```gradle
buildscript {
    ext.kotlin_version = '1.9.0'
    dependencies {
        classpath "org.jetbrains.kotlin:kotlin-gradle-plugin:$kotlin_version"
    }
}
```

---

## 📊 App Information

- **App Name:** Loveworld Translators Virtual Studio
- **Package ID:** org.tniglobal.virtualstudio
- **Version:** 1.0.0
- **Version Code:** 1
- **Min SDK:** Android 6.0 (API 23)
- **Target SDK:** Android 15 (API 35)
- **Compile SDK:** Android 15 (API 35)

---

## 📁 Important Directories

```
frontend-react/
├── src/                          # React source code
├── public/                       # Static assets
├── build/                        # React production build (created after npm run build)
├── android/                      # Android native project
│   ├── app/
│   │   ├── src/main/
│   │   │   ├── assets/public/    # Copied from build/
│   │   │   ├── java/             # Native Java/Kotlin code
│   │   │   ├── res/              # Android resources
│   │   │   └── AndroidManifest.xml
│   │   └── build.gradle          # App-level Gradle config
│   ├── build/                    # Build outputs
│   │   └── outputs/apk/          # APK files
│   └── gradle/                   # Gradle wrapper
├── capacitor.config.ts           # Capacitor configuration
├── package.json                  # Node dependencies and scripts
└── virtual-studio-release.keystore  # Release signing key
```

---

## 🎓 Additional Resources

### Official Documentation
- **Capacitor:** https://capacitorjs.com/docs
- **Android Studio:** https://developer.android.com/studio/intro
- **React:** https://react.dev/

### Useful Commands Reference

```bash
# Capacitor Commands
npx cap init                    # Initialize Capacitor
npx cap add android             # Add Android platform
npx cap sync                    # Sync all platforms
npx cap sync android            # Sync only Android
npx cap copy android            # Copy web assets only
npx cap update android          # Update Android platform
npx cap open android            # Open in Android Studio
npx cap run android             # Run on device/emulator

# Gradle Commands
./gradlew tasks                 # List all available tasks
./gradlew assembleDebug         # Build debug APK
./gradlew assembleRelease       # Build release APK
./gradlew bundleRelease         # Build release AAB
./gradlew clean                 # Clean build
./gradlew --refresh-dependencies # Refresh dependencies

# ADB Commands
adb devices                     # List connected devices
adb install app-debug.apk       # Install APK
adb uninstall org.tniglobal.virtualstudio  # Uninstall app
adb logcat                      # View device logs
adb shell                       # Access device shell
```

---

## ✅ Final Checklist

Before distributing your APK:

- [ ] React app builds successfully (`npm run build`)
- [ ] Capacitor sync completes without errors (`npx cap sync android`)
- [ ] App opens in Android Studio without errors
- [ ] Version number is correct (1.0.0) in `android/app/build.gradle`
- [ ] App icons are properly set in `android/app/src/main/res/mipmap-*/`
- [ ] App installs and runs on physical device
- [ ] All core features work (login, streaming, translation)
- [ ] Network permissions are properly configured in AndroidManifest.xml
- [ ] APK is signed with release keystore (for production)
- [ ] APK size is reasonable (<50 MB)
- [ ] Release APK is copied to `release/` folder with proper naming

---

## 💻 Complete Workflow for Local Computer

This is the complete step-by-step process to get the project from GitHub and open it in Android Studio on your local Windows/macOS/Linux computer:

### 1️⃣ Clone from GitHub

```bash
# Open Terminal (macOS/Linux) or Command Prompt/PowerShell (Windows)
cd ~/Documents  # or wherever you want the project

# Clone the repository
git clone https://github.com/Firstladydoxa/virtual-translator-studio.git

# Navigate into the project
cd virtual-translator-studio
```

### 2️⃣ Install Dependencies

```bash
# Install Node.js dependencies
npm install
```

**Note:** This will take 2-5 minutes depending on your internet speed.

### 3️⃣ Build the React App

```bash
# Create production build
npm run build
```

This creates the `build/` directory with optimized web assets.

### 4️⃣ Sync with Android

```bash
# Copy web assets to Android project
npx cap sync android
```

This copies the build to `android/app/src/main/assets/public/`

### 5️⃣ Open in Android Studio

**Method A: Using npm script (easier)**
```bash
npm run android:studio
```

**Method B: Manual opening**
1. Launch Android Studio
2. Click **File → Open**
3. Navigate to: `~/Documents/virtual-translator-studio/android`
4. Click **OK**

### 6️⃣ Wait for Gradle Sync

Android Studio will download dependencies (first time takes 5-10 minutes).

### 7️⃣ Connect Android Device

1. Enable Developer Options on your Android phone
2. Enable USB Debugging
3. Connect via USB
4. Click the **Run** button (▶️) in Android Studio
5. Select your device
6. App will install and launch!

### 🔄 After Making Code Changes

When you update React code:

```bash
# Rebuild and sync
npm run build
npx cap sync android

# Or use the combined script
npm run android:build
```

Then click **Run** in Android Studio again.

### 📥 Pulling Latest Updates

To get the latest changes from the server:

```bash
cd ~/Documents/virtual-translator-studio
git pull origin main
npm install  # In case dependencies changed
npm run build
npx cap sync android
```

---

## 🎉 Success!

You now have a complete guide to building and deploying the **Loveworld Translators Virtual Studio** mobile app on Android!

### Quick Build Summary

```bash
# Navigate to project
cd /home/tniglobal/public_html/webrtc/browser-based-translation/frontend-react

# Install and build
npm install
npm run android:studio
```

This will:
1. ✅ Install all dependencies
2. ✅ Build the React application
3. ✅ Sync with Android project
4. ✅ Open Android Studio with your project

From there, click the **Run** button (▶️) to test on a device or emulator!

---

**Last Updated:** February 13, 2026  
**Version:** 1.0.0  
**Maintained by:** TNI Global Development Team
