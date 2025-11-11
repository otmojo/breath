# Breath

https://breathotmojo.netlify.app/ or https://breath-omega.vercel.app/

Breath Mirror turns your camera into a soft, meditative breathing space.
It detects your body using MediaPipe and visualizes a glowing breathing aura on your chest.

No instructions. No voice. Minimal stimulation.
Just your breath and light. ✨

## Overview
Breath creates a real-time visualization where a glowing orb follows your breathing pattern using pose detection technology. The application runs entirely in your browser with no data collection.

## Technical Details
- Pose Detection: Uses MediaPipe Tasks Vision Pose Landmarker
- Breath Tracking: Normalizes chest width measurements to [0,1] range
- Rendering: Mirror-style camera feed with dynamic radial gradient orb

## Troubleshooting
- Camera Issues: Ensure you're using http/https protocol, not file://
- Model Loading Errors: Check network connection or use local models
- Performance: Adjust camera resolution in `startCamera()` if needed

## Privacy
The application processes all camera data locally in your browser. No data is transmitted externally.

## License
Released under the MIT License. See `breath-mirror/LICENSE` for details.
