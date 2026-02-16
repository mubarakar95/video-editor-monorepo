# Tauri App Icons

This directory should contain application icons for all platforms.

## Required Icons

Generate icons using the Tauri CLI:
```bash
npm run tauri icon /path/to/source-icon.png
```

Or create icons manually:

### Windows
- `icon.ico` - Multi-resolution ICO file (256x256 recommended)

### macOS
- `icon.icns` - ICNS file with multiple resolutions

### Linux
- `32x32.png`
- `128x128.png`
- `128x128@2x.png` (256x256)

## Source Icon Requirements

- Source image should be at least 1024x1024 pixels
- PNG format with transparency support
- Square aspect ratio

## Placeholder

Until proper icons are created, the app will use default Tauri icons.
