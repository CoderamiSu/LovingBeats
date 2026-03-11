# LovingBeats Metronome

A precise and fun rhythm learning app designed specifically for children. Built with Next.js, Tailwind CSS, and Capacitor.

## Android APK Build Guide

To transform this web application into a native Android APK, we use **Capacitor**. This allows the app to run locally on your phone with native performance.

### 1. Prerequisites
Before starting, ensure you have the following installed on your local computer:
- **Node.js** (v18 or higher)
- **Android Studio** (Latest version)
- **Android SDK & Build Tools** (Configure these via Android Studio's SDK Manager)
- **Java JDK 17 or 21**

### 2. Build Steps

Follow these steps in your terminal:

#### A. Build the Static Web Files
Next.js must generate a standalone version of the app.
```bash
npm run static-build
```
This creates an `out/` folder containing the static HTML, CSS, and JS.

#### B. Sync with Android Platform
Sync the web assets into the native Android project.
```bash
npm run cap-sync
```
*Note: If this is your first time, run `npm run cap-add-android` before syncing.*

#### C. Open in Android Studio
Launch the native project in Android Studio to perform the final build.
```bash
npm run cap-open-android
```

### 3. Creating the APK in Android Studio

1. Wait for Android Studio to finish "Gradle Sync" (check the progress bar at the bottom).
2. In the top menu, go to **Build** > **Build Bundle(s) / APK(s)** > **Build APK(s)**.
3. Once the build completes, a notification will appear in the bottom right corner.
4. Click **"locate"** in that notification. This will open a folder containing `app-debug.apk`.

### 4. How to Install on your Android Device

#### Method A: Direct Run (Recommended)
1. Connect your Android phone to your computer via USB.
2. Enable **USB Debugging** on your phone (Settings > Developer Options).
3. In Android Studio, select your phone from the device dropdown menu in the top toolbar.
4. Click the **Run** button (green play icon). The app will build, install, and launch automatically.

#### Method B: Manual Sideload
1. Copy the `app-debug.apk` file from your computer to your phone's storage.
2. On your phone, open a **File Manager** app.
3. Locate the APK and tap it to install.
4. If prompted, allow the file manager to "Install apps from unknown sources".

---
*Designed with ❤️ for little musicians by LovingBeats.*
