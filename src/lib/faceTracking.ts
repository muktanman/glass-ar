import {
  FaceLandmarker,
  FilesetResolver,
  FaceLandmarkerResult,
} from "@mediapipe/tasks-vision";

let faceLandmarker: FaceLandmarker | null = null;
let lastVideoTime = -1;

export async function initFaceLandmarker(): Promise<void> {
  const filesetResolver = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
  );

  faceLandmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
    baseOptions: {
      modelAssetPath:
        "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
      delegate: "GPU",
    },
    outputFaceBlendshapes: true,
    runningMode: "VIDEO",
    numFaces: 1,
  });
}

export function detectFace(video: HTMLVideoElement): FaceLandmarkerResult | null {
  if (!faceLandmarker || video.readyState < 2) return null;

  const nowMs = performance.now();
  if (lastVideoTime === video.currentTime) return null;
  lastVideoTime = video.currentTime;

  return faceLandmarker.detectForVideo(video, nowMs);
}

export function disposeFaceLandmarker(): void {
  faceLandmarker?.close();
  faceLandmarker = null;
}
