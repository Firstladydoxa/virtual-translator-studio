# Loveworld Translators Virtual Studio
## Mobile Application - Version 1.0.0

A real-time translation studio application built with React and Capacitor for Android mobile deployment.

---

## 📱 About This App

The **Loveworld Translators Virtual Studio** is a mobile application that enables translators to:
- 🎙️ Provide real-time translation services
- 📡 Stream translations to viewers
- 🔐 Secure authentication system
- 💬 Real-time WebRTC communication
- 🔔 Push notifications support
- 📊 Translation management dashboard

---

## 🚀 Quick Start Guides

Choose the guide based on where you're working:

### 📥 **For Local Computer (Windows/macOS/Linux)**
**→ [LOCAL_COMPUTER_SETUP.md](LOCAL_COMPUTER_SETUP.md)** ⭐ **START HERE**

Step-by-step guide to:
- Clone from GitHub
- Install dependencies
- Build the app
- Open in Android Studio on your laptop

**This is what you need if you want to develop on your local computer!**

---

### 📖 **Complete Documentation**
**→ [ANDROID_STUDIO_DEPLOYMENT_GUIDE.md](ANDROID_STUDIO_DEPLOYMENT_GUIDE.md)**

Comprehensive guide covering:
- Prerequisites and system requirements
- Detailed installation steps
- Building APK files
- Testing on devices/emulators
- Creating release builds
- Troubleshooting common issues

---

### 📦 **Release Information**
**→ [release/README.md](release/README.md)**

Information about:
- Current release builds
- APK file details
- Version history
- Installation instructions

---

## ⚡ Quick Commands

### For Local Computer Development

\`\`\`bash
# Clone the repository
git clone https://github.com/Firstladydoxa/virtual-translator-studio.git
cd virtual-translator-studio

# Install dependencies
npm install

# Build and open in Android Studio
npm run android:studio
\`\`\`

### For Server Development

\`\`\`bash
# Navigate to project
cd /home/tniglobal/public_html/webrtc/browser-based-translation/frontend-react

# Build and sync
npm run android:build

# Open in Android Studio
npm run cap:open:android
\`\`\`

---

## 📋 Available Scripts

### Mobile Development Scripts

#### \`npm run android:studio\`
Builds the React app, syncs with Android, and opens Android Studio.
**Use this to start developing on Android!**

#### \`npm run android:build\`
Builds the React app and syncs with the Android project.

#### \`npm run android:run\`
Builds, syncs, and runs the app on a connected Android device/emulator.

#### \`npm run cap:sync\`
Copies web assets and syncs Capacitor plugins to all platforms.

#### \`npm run cap:open:android\`
Opens the Android project in Android Studio.

### Standard React Scripts

#### \`npm start\`
Runs the app in development mode.
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

#### \`npm test\`
Launches the test runner in interactive watch mode.

#### \`npm run build\`
Builds the app for production to the \`build/\` folder.
Creates an optimized production build ready for mobile deployment.

**After building, always run \`npm run cap:sync\` to update the mobile project!**

---

## 🏗️ Project Structure

\`\`\`
frontend-react/
├── android/                    # Android native project (open in Android Studio)
├── src/                        # React source code
│   ├── components/            # React components
│   ├── services/              # API and service layers
│   └── stores/                # State management (Zustand)
├── public/                     # Static assets
├── build/                      # Production build output
├── release/                    # Built APK files
├── capacitor.config.ts         # Capacitor configuration
├── package.json                # Dependencies and scripts
├── LOCAL_COMPUTER_SETUP.md     # Quick start for local computer
└── ANDROID_STUDIO_DEPLOYMENT_GUIDE.md  # Full documentation
\`\`\`

---

## 🔧 Technologies Used

- **React 19** - UI framework
- **TypeScript** - Type safety
- **Capacitor 8** - Native mobile wrapper
- **Zustand** - State management
- **Socket.io Client** - Real-time communication
- **MediaSoup Client** - WebRTC for streaming
- **Axios** - HTTP client
- **HLS.js** - Video streaming

---

## 📊 App Details

- **App Name:** Loveworld Translators Virtual Studio
- **Package ID:** org.tniglobal.virtualstudio
- **Version:** 1.0.0
- **Build:** 1
- **Min Android:** 6.0 (API 23)
- **Target Android:** 15 (API 35)

---

## 🔗 Repository

**GitHub:** https://github.com/Firstladydoxa/virtual-translator-studio.git

---

## 📖 Learn More

- [Create React App Documentation](https://facebook.github.io/create-react-app/docs/getting-started)
- [React Documentation](https://react.dev/)
- [Capacitor Documentation](https://capacitorjs.com/docs)
- [Android Studio Guide](https://developer.android.com/studio/intro)

---

**Version:** 1.0.0  
**Last Updated:** February 13, 2026  
**Maintained by:** TNI Global Development Team
