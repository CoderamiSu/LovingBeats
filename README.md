# SimpleBeats Metronome

A precise, playful, and tactile rhythm learning app designed specifically for children. Built with Next.js, Tailwind CSS, and Capacitor.

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

To transform this web application into a native Android APK, follow these steps.

### 1. Prerequisites (Linux/Ubuntu)

Ensure you have Android Studio installed. If you installed it via Snap, you must set the following environment variable in your terminal:

```bash
export CAPACITOR_ANDROID_STUDIO_PATH="/snap/bin/android-studio"
```

### 2. Build Steps

#### Step A: Build the Static Web Files
```bash
npm run static-build
```
This creates the required `out/` folder.

#### Step B: Add Android Platform (First Time Only)
```bash
npm run cap-add-android
```

#### Step C: Sync Assets
```bash
npm run cap-sync
```

#### Step D: Open in Android Studio
```bash
npm run cap-open-android
```

---

### 🎨 How to apply the Android App Icon

To use the cute metronome image as your actual app icon:

1. **Save the image:** Save the high-resolution square icon image as `assets/logo.png` in the project root.
2. **Generate Assets:** Run the following command to automatically generate all required Android icon sizes:
   ```bash
   npx @capacitor/assets generate --android
   ```
3. **Sync again:** Run `npm run cap-sync` to ensure the new icons are copied to the Android project.

---

### 📦 Creating the APK

1. In Android Studio, wait for Gradle Sync to finish.
2. Go to **Build** > **Build Bundle(s) / APK(s)** > **Build APK(s)**.
3. Locate the `app-debug.apk` and copy it to your phone for installation.

*Designed with ❤️ for little musicians by SimpleBeats.*