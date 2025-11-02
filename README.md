# Breath

A minimalist browser-based breathing visualization tool that displays a responsive white orb tracking your chest movements through your device's camera.

## Overview
Breath creates a real-time visualization where a glowing orb follows your breathing pattern using pose detection technology. The application runs entirely in your browser with no data collection.

## Quick Start
1. Start a local server:
   ```bash
   # Using Node.js
   npx http-server -p 5500
   ```
2. Visit http://127.0.0.1:5500 or another available address
3. Click "Start" and allow camera access

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
