# LovingBeats Metronome

A precise and fun rhythm learning app designed specifically for children. Built with Next.js, Tailwind CSS, and Capacitor.

## 🚀 Getting Started (Web Development)

Follow these steps to run the application locally in your browser for development:

### 1. Clone the repository
```bash
git clone <your-repo-url>
cd LovingBeats
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Set up Environment Variables
Create a `.env` file in the root directory and add your Google AI API key for Genkit features:
```env
GOOGLE_GENAI_API_KEY=your_api_key_here
```

### 4. Run the Development Server
```bash
npm run dev
```
Open [http://localhost:9002](http://localhost:9002) in your browser to see the app.

---

## 📱 Android APK Build Guide

To transform this web application into a native Android APK, we use **Capacitor**. This allows the app to run locally on your phone with native performance.

### 1. Prerequisites & Environment Setup

Before building the APK, you must install and configure these tools on your local computer:

#### A. Node.js
- Download and install **Node.js (v18 or higher)** from [nodejs.org](https://nodejs.org/).
- Verify installation by running `node -v` in your terminal.

#### B. Java Development Kit (JDK)
- Install **OpenJDK 17 or 21**. 
- We recommend using [Adoptium (Temurin)](https://adoptium.net/).
- Ensure your `JAVA_HOME` environment variable is set to the JDK installation path.

#### C. Android Studio
1. Download and install **Android Studio** from [developer.android.com](https://developer.android.com/studio).
2. During setup, ensure you install the **Android SDK** and **Android SDK Platform-Tools**.
3. Open Android Studio, go to **Settings > Languages & Frameworks > Android SDK** and ensure at least one SDK platform (e.g., Android 14.0) is installed.
4. Add the Android SDK `platform-tools` folder to your system's `PATH`.

### 2. Build Steps

#### Step A: Build the Static Web Files
Next.js must generate a standalone version of the app.
```bash
npm run static-build
```
This creates an `out/` folder containing the static HTML, CSS, and JS.

#### Step B: Sync with Android Platform
Sync the web assets into the native Android project.
```bash
npm run cap-sync
```
*Note: If this is your first time, run `npm run cap-add-android` before syncing.*

#### Step C: Open in Android Studio
Launch the native project in Android Studio to perform the final build.
```bash
npm run cap-open-android
```

### 3. Creating the APK in Android Studio

1. Wait for Android Studio to finish "Gradle Sync" (check the progress bar at the bottom).
2. In the top menu, go to **Build** > **Build Bundle(s) / APK(s)** > **Build APK(s)**.
3. Once the build completes, click **"locate"** in the notification popup to find your `app-debug.apk`.

### 4. How to Install on your Android Device

#### Method A: Direct Run (Recommended)
1. Connect your Android phone to your computer via USB.
2. Enable **USB Debugging** on your phone (Settings > Developer Options).
3. In Android Studio, select your phone from the device dropdown in the toolbar and click the **Run** button (green play icon).

#### Method B: Manual Sideload
1. Copy the `app-debug.apk` file to your phone's storage.
2. Open a **File Manager** on your phone, find the APK, and tap it to install.
3. If prompted, allow "Install apps from unknown sources".

---
*Designed with ❤️ for little musicians by LovingBeats.*
