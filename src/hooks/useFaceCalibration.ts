"use client";

import { useRef, useState, useCallback } from "react";
import { NormalizedLandmark } from "@mediapipe/tasks-vision";

// Landmarks used for glasses-fit measurements
const LEFT_TEMPLE  = 127;  // left zygomatic arch — where glasses frame ends
const RIGHT_TEMPLE = 356;  // right zygomatic arch
const LEFT_EYE_C   = 468;  // left eye centre (iris landmark, most stable)
const RIGHT_EYE_C  = 473;  // right eye centre
const NOSE_BRIDGE  = 6;    // top of nose bridge — where pads rest

const FRAMES_NEEDED = 45;  // ~1.5 s at 30 fps

export interface FaceCalibration {
  /** Temple-to-temple distance in Three.js world units (aspect-corrected). */
  templeSpread: number;
  /** Vertical (Y) world position of the eye midpoint. */
  eyeMidY: number;
  /** Depth (Z) world position of the nose bridge. */
  noseBridgeZ: number;
}

export type CalibrationState = "idle" | "scanning" | "done";

export function useFaceCalibration() {
  const [state, setState]       = useState<CalibrationState>("idle");
  const [progress, setProgress] = useState(0); // 0 → 1
  const [calibration, setCalibration] = useState<FaceCalibration | null>(null);

  const spreadSamples    = useRef<number[]>([]);
  const eyeMidYSamples   = useRef<number[]>([]);
  const noseBridgeZSamples = useRef<number[]>([]);

  /**
   * Call this every frame during "scanning" state.
   * canvasAspect = canvas.width / canvas.height (for correct horizontal projection).
   */
  const addSample = useCallback(
    (landmarks: NormalizedLandmark[], canvasAspect: number) => {
      if (landmarks.length < 478) return; // needs full mesh

      const toWorld = (lm: NormalizedLandmark) => ({
        x: -(lm.x - 0.5) * 2 * canvasAspect,
        y: -(lm.y - 0.5) * 2,
        z: -lm.z * 2,
      });

      const lt = toWorld(landmarks[LEFT_TEMPLE]);
      const rt = toWorld(landmarks[RIGHT_TEMPLE]);
      const le = toWorld(landmarks[LEFT_EYE_C]);
      const re = toWorld(landmarks[RIGHT_EYE_C]);
      const nb = toWorld(landmarks[NOSE_BRIDGE]);

      const spread = Math.sqrt((lt.x - rt.x) ** 2 + (lt.y - rt.y) ** 2);
      const eyeMidY = (le.y + re.y) / 2;

      spreadSamples.current.push(spread);
      eyeMidYSamples.current.push(eyeMidY);
      noseBridgeZSamples.current.push(nb.z);

      const newProgress = spreadSamples.current.length / FRAMES_NEEDED;
      setProgress(Math.min(newProgress, 1));

      if (spreadSamples.current.length >= FRAMES_NEEDED) {
        const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;
        setCalibration({
          templeSpread:  avg(spreadSamples.current),
          eyeMidY:       avg(eyeMidYSamples.current),
          noseBridgeZ:   avg(noseBridgeZSamples.current),
        });
        setState("done");
      }
    },
    []
  );

  const startScan = useCallback(() => {
    spreadSamples.current    = [];
    eyeMidYSamples.current   = [];
    noseBridgeZSamples.current = [];
    setProgress(0);
    setCalibration(null);
    setState("scanning");
  }, []);

  const resetScan = useCallback(() => {
    spreadSamples.current    = [];
    eyeMidYSamples.current   = [];
    noseBridgeZSamples.current = [];
    setProgress(0);
    setCalibration(null);
    setState("idle");
  }, []);

  return { state, progress, calibration, addSample, startScan, resetScan };
}
