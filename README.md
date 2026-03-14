# SimpleBeats Metronome

A precise and fun rhythm learning app designed specifically for children. Built with Next.js, Tailwind CSS, and Capacitor.

## 🚀 Getting Started (Web Development)

Follow these steps to run the application locally in your browser for development:

### 1. Clone the repository
```bash
git clone https://github.com/CoderamiSu/SimpleBeats.git
cd SimpleBeats
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

To transform this web application into a native Android APK, we use **Capacitor**.

### 1. Prerequisites & Environment Setup

Before building the APK, you must install and configure these tools on your local computer:

#### A. Node.js
- Download and install **Node.js (v18 or higher)**.

#### B. Java Development Kit (JDK)
- Install **OpenJDK 17 or 21**. 
- Ensure your `JAVA_HOME` environment variable is set.

#### C. Android Studio
1. Download and install **Android Studio**.
2. Install the **Android SDK** and **Platform-Tools**.
3. Add the Android SDK `platform-tools` folder to your system's `PATH`.

---

### 2. Build Steps

#### Step A: Build the Static Web Files
Next.js must generate a standalone version of the app.
```bash
npm run static-build
```
This creates an `out/` folder.

#### Step B: Sync with Android Platform
If this is your first time:
```bash
npm run cap-add-android
```
Then sync the assets:
```bash
npm run cap-sync
```

#### Step C: Open in Android Studio
```bash
npm run cap-open-android
```

---

### 🎨 How to create an Android Icon

To create the native app icon:
1. Prepare a high-resolution square image (1024x1024px).
2. Install `@capacitor/assets`:
   ```bash
   npm install @capacitor/assets --save-dev
   ```
3. Place your image as `assets/logo.png`.
4. Run the generation tool:
   ```bash
   npx capacitor-assets generate --android
   ```
This will automatically generate and place all required icon sizes in the `android/app/src/main/res` directory.

---

### 4. Creating and Installing the APK

1. In Android Studio, wait for Gradle Sync to finish.
2. Go to **Build** > **Build Bundle(s) / APK(s)** > **Build APK(s)**.
3. Locate the `app-debug.apk` and copy it to your phone.
4. Enable **USB Debugging** on your phone and run directly from Android Studio, or manually install the APK file.

*Designed with ❤️ for little musicians by SimpleBeats.*