const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const overlay = document.getElementById("overlay");
const startBtn = document.getElementById("startBtn");
const toastEl = document.getElementById("toast");

const toggleVideoEl = document.getElementById("toggleVideo");
const bgOpacityEl = document.getElementById("bgOpacity");
const videoScaleEl = document.getElementById("videoScale");
const particleEl = document.getElementById("particle");
const pauseBtn = document.getElementById("pauseBtn");
const hideUiBtn = document.getElementById("hideUiBtn");
const showUiBtn = document.getElementById("showUiBtn");
const uiPanel = document.getElementById("ui");

let poseLandmarker;
let runningMode = "VIDEO";
let lastVideoTime = -1;

let t = 0;
let smoothChest = 0;
let lastChest = 0;
let breathSpeed = 0;
let breathStability = 0;

let auras = [];

let showVideo = true;
let bgOpacity = 1.0;
let videoScale = 1.0;
let particleIntensity = 0.0;
let isPaused = false;
let rafId = null;

let chestLo = Number.POSITIVE_INFINITY;
let chestHi = Number.NEGATIVE_INFINITY;

// Scale the displayed person a bit smaller (1.0 = full cover)
const personScale = 0.85;

function showToast(msg, duration = 1800) {
  if (!toastEl) return;
  toastEl.textContent = msg;
  toastEl.classList.add("show");
  setTimeout(() => toastEl.classList.remove("show"), duration);
}

async function initAndStart() {
  try {
    const visionLib = await import("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0");
    const vision = await visionLib.FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
    );

    const modelCandidates = [
      // Known good lite model
      "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task",
      // Alternative full model (older version)
      "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/1/pose_landmarker_full.task"
    ];

    let lastErr;
    for (const url of modelCandidates) {
      try {
        poseLandmarker = await visionLib.PoseLandmarker.createFromOptions(vision, {
          baseOptions: { modelAssetPath: url },
          runningMode,
          numPoses: 1,
        });
        break;
      } catch (err) {
        lastErr = err;
        console.warn("Model load failed, trying next:", url, err);
      }
    }
    if (!poseLandmarker) throw lastErr || new Error("No model could be loaded");
    await startCamera();
    overlay.style.display = "none";
    if (uiPanel) uiPanel.style.display = "none";
    if (showUiBtn) showUiBtn.style.display = "none";
  } catch (e) {
    showToast("Initialization failed. Check network and try again.");
    console.error(e);
  }
}

// ----------------- CAMERA -----------------
async function startCamera() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: 1920 },
        height: { ideal: 1080 },
        facingMode: "user",
        frameRate: { ideal: 30 }
      },
      audio: false
    });
    video.srcObject = stream;
    await video.play();

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(window.innerWidth * dpr);
      canvas.height = Math.floor(window.innerHeight * dpr);
      canvas.style.width = window.innerWidth + 'px';
      canvas.style.height = window.innerHeight + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    window.addEventListener("resize", resize);

    if (rafId == null) renderLoop();
  } catch (err) {
    showToast("Cannot access camera. Please check permission settings.");
    console.error(err);
    throw err;
  }
}

// ----------------- AURA PARTICLES -----------------
function spawnAura(x, y, hue) {
  auras.push({
    x, y,
    r: 8,
    alpha: 0.9,
    hue
  });
}

function drawAuras() {
  auras.forEach((a, i) => {
    a.r += 1.4;
    a.alpha -= 0.013 + (1 - breathStability) * 0.02; // unstable rhythm fades faster

    if (a.alpha <= 0) {
      auras.splice(i, 1);
      return;
    }

    ctx.beginPath();
    let grad = ctx.createRadialGradient(a.x, a.y, a.r * 0.2, a.x, a.y, a.r);
    grad.addColorStop(0, `hsla(${a.hue}, 90%, 70%, ${a.alpha})`);
    grad.addColorStop(1, `hsla(${a.hue}, 90%, 70%, 0)`);
    ctx.fillStyle = grad;
    ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
    ctx.fill();
  });
}

// ----------------- RENDER LOOP -----------------
async function renderLoop() {
  if (isPaused) { rafId = null; return; }
  const cw = window.innerWidth;
  const ch = window.innerHeight;
  ctx.clearRect(0, 0, cw, ch);

  // Aspect-correct draw (cover)
  const vw = video.videoWidth || 640;
  const vh = video.videoHeight || 480;
  const s = Math.max(cw / vw, ch / vh) * personScale;
  const drawW = vw * s;
  const drawH = vh * s;
  const offsetX = (cw - drawW) / 2;
  const offsetY = (ch - drawH) / 2;

  if (showVideo) {
    const prev = ctx.globalAlpha;
    ctx.globalAlpha = 1.0;
    ctx.save();
    ctx.translate(cw, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, offsetX, offsetY, drawW, drawH);
    ctx.restore();
    ctx.globalAlpha = prev;
  }

  if (video.currentTime !== lastVideoTime && poseLandmarker) {
    lastVideoTime = video.currentTime;
    const results = await poseLandmarker.detectForVideo(video, performance.now());
    if (results.landmarks && results.landmarks.length > 0) {
      const p = results.landmarks[0];
      const L = p[11];
      const R = p[12];
      if (L && R) {
        const chest = Math.hypot(L.x - R.x, L.y - R.y);
        // More responsive smoothing to emphasize breathing changes
        smoothChest = smoothChest * 0.7 + chest * 0.3;
        breathSpeed = Math.abs(smoothChest - lastChest) * 120;
        lastChest = smoothChest;
        breathStability = Math.max(0.02, Math.min(1, 1 - Math.abs(breathSpeed - 1.1)));

        const cx_video = (L.x + R.x) / 2; // normalized [0,1]
        const cy_video = (L.y + R.y) / 2;
        const cx_disp = offsetX + cx_video * drawW;
        const cy = offsetY + cy_video * drawH;
        const cx = cw - cx_disp; // mirror horizontally to match video

        if (chestLo === Number.POSITIVE_INFINITY) {
          chestLo = chest;
          chestHi = chest;
        }
        if (chest < chestLo) chestLo = chest; else chestLo += 0.002 * (chest - chestLo);
        if (chest > chestHi) chestHi = chest; else chestHi += 0.002 * (chest - chestHi);
        const range = Math.max(1e-5, chestHi - chestLo);
        let breathNorm = Math.max(0, Math.min(1, (smoothChest - chestLo) / range));
        // Ease to boost contrast (larger changes near inhale)
        const breathEased = Math.pow(breathNorm, 0.65);

        // Fixed white light
        drawBreathingOrb(cx, cy, breathEased);
        
      }
    }
  }

  // t is not used for driving breath anymore
  rafId = requestAnimationFrame(renderLoop);
}

// ----------------- ORB CORE -----------------
function drawBreathingOrb(x, y, breath) {
  const r = 20 + breath * 60;

  ctx.beginPath();
  let g = ctx.createRadialGradient(x, y, r * 0.2, x, y, r);
  g.addColorStop(0, `rgba(255,255,255,0.95)`);
  g.addColorStop(1, `rgba(255,255,255,0.20)`);
  ctx.fillStyle = g;

  ctx.shadowColor = `rgba(255,255,255,0.95)`;
  ctx.shadowBlur = 50 + breath * 110;

  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
}

startBtn?.addEventListener("click", () => {
  initAndStart();
});

toggleVideoEl?.addEventListener("change", (e) => {
  showVideo = !!e.target.checked;
});

bgOpacityEl?.addEventListener("input", (e) => {
  bgOpacity = parseFloat(e.target.value);
});

videoScaleEl?.addEventListener("input", (e) => {
  videoScale = parseFloat(e.target.value);
});

particleEl?.addEventListener("input", (e) => {
  particleIntensity = parseFloat(e.target.value);
});

pauseBtn?.addEventListener("click", () => {
  if (!isPaused) {
    isPaused = true;
    pauseBtn.textContent = "继续";
  } else {
    isPaused = false;
    pauseBtn.textContent = "暂停";
    if (rafId == null) renderLoop();
  }
});

hideUiBtn?.addEventListener("click", () => {
  uiPanel.style.display = "none";
});

showUiBtn?.addEventListener("click", () => {
  uiPanel.style.display = "block";
});
