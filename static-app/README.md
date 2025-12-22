# CYBIM Static Signage Player

A fully static HTML web app optimized for Android APK conversion and 100% offline usage.

## Features

- ✅ 100% Offline - No internet required
- ✅ Pure HTML, CSS, JavaScript - No frameworks
- ✅ Image & Video support with auto-play looping
- ✅ Campaign management with scheduling
- ✅ Screen orientation control (Landscape/Portrait)
- ✅ Touch-friendly navigation
- ✅ Android WebView compatible
- ✅ Dual video player for seamless transitions

## Project Structure

```
static-app/
├── index.html          # Main entry point
├── css/
│   └── styles.css      # All styles
├── js/
│   ├── storage.js      # LocalStorage handling
│   ├── player.js       # Media playback
│   └── app.js          # Main application logic
├── images/             # Place your images here
├── videos/             # Place your videos here
├── fonts/              # Place local fonts here (optional)
└── README.md           # This file
```

## How to Use

### 1. Add Your Media

Place your image and video files in the `images/` and `videos/` folders.

Supported formats:
- **Images**: JPG, PNG, GIF, WebP
- **Videos**: MP4, WebM

### 2. Test Locally

Open `index.html` in any modern browser to test.

### 3. Create Android APK

#### Option A: AppCreator24
1. Zip the entire `static-app` folder
2. Go to [AppCreator24](https://www.appcreator24.com/)
3. Create new HTML app
4. Upload the zip file
5. Configure app settings
6. Build APK

#### Option B: Android Studio WebView
1. Create new Android project
2. Add WebView to main activity
3. Copy `static-app` contents to `assets/` folder
4. Load `file:///android_asset/index.html`

## Usage Guide

### Creating Campaigns

1. Tap "Campaigns" from home screen
2. Tap "+ Add" to create new campaign
3. Enter campaign name
4. Add media files using "+ Add Media"
5. Set image duration (for images only)
6. Configure schedule (optional)
7. Tap "Save"

### Playing Campaigns

1. Tap "Play" from home screen - plays all campaigns
2. Or go to Campaigns and tap play on specific campaign
3. Double-tap screen to exit playback

### Settings

- **Orientation**: Rotate app display
- **Default Duration**: Default image display time
- **Auto-start**: Start playback on app launch

## Technical Notes

- Uses `localStorage` for data persistence
- Media files are stored as base64 data URLs
- No network requests - works completely offline
- Supports Android TV remote navigation
- Dual video player system for seamless transitions

## Keyboard Shortcuts

- **Escape / Backspace**: Go back / Exit playback
- **Arrow keys**: Navigate menus (TV remote compatible)
- **Enter**: Select focused item

## Browser Compatibility

- Chrome 60+
- Firefox 55+
- Safari 11+
- Edge 79+
- Android WebView 60+

## License

MIT License - Free for commercial use
