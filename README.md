# Breath

A minimalist browser-based breathing visualization tool that displays a responsive white orb tracking your chest movements through your device's camera.

## Overview
Breath creates a real-time visualization where a glowing orb follows your breathing pattern using pose detection technology. The application runs entirely in your browser with no data collection.

## Core Features
- **Minimalist Interface**: Clean, distraction-free design
- **Responsive Tracking**: Uses shoulder landmarks for accurate chest movement detection
- **Adaptive Scaling**: Automatic normalization for consistent response across different distances
- **High Quality**: Optimized for HD cameras and high-DPI displays
- **Zero Setup**: Pure HTML/CSS/JavaScript implementation

## Quick Start
1. Start a local server:
   ```bash
   # Using Node.js
   npx http-server -p 5500
   ```
2. Visit 'http://192.168.0.27:5500' or 'http://127.0.0.1:5500'
3. Click "Start" and allow camera access

## Project Structure
- `index.html` - Main application page
- `style.css` - Core styling
- `script.js` - Main application logic
- `breath-mirror/` - Simplified demo version
  - `index.html` - Demo page
  - `script.js` - Basic implementation
  - `style.css` - Demo styling
- `models/` - Optional local model files

## Technical Details
- **Pose Detection**: Uses MediaPipe Tasks Vision Pose Landmarker
- **Breath Tracking**: Normalizes chest width measurements to [0,1] range
- **Rendering**: Mirror-style camera feed with dynamic radial gradient orb

## Troubleshooting
- **Camera Issues**: Ensure you're using http/https protocol, not file://
- **Model Loading Errors**: Check network connection or use local models
- **Performance**: Adjust camera resolution in `startCamera()` if needed

## Privacy
The application processes all camera data locally in your browser. No data is transmitted externally.

## License
Released under the MIT License. See `breath-mirror/LICENSE` for details.