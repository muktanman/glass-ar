import * as THREE from "three";
import { NormalizedLandmark } from "@mediapipe/tasks-vision";

// Key MediaPipe face landmark indices
const NOSE_BRIDGE = 6;
const LEFT_EYE_OUTER = 33;
const RIGHT_EYE_OUTER = 263;
const LEFT_EAR = 234;
const RIGHT_EAR = 454;

export interface GlassesTransform {
  position: THREE.Vector3;
  rotation: THREE.Euler;
  scale: THREE.Vector3;
}

/**
 * Derives position, rotation and scale for the glasses mesh
 * from the raw MediaPipe face landmarks.
 *
 * Coordinate system: MediaPipe returns normalized [0,1] x [0,1] values
 * relative to the video frame. We convert them to Three.js world space
 * before returning.
 */
export function computeGlassesTransform(
  landmarks: NormalizedLandmark[],
  videoWidth: number,
  videoHeight: number
): GlassesTransform {
  const noseBridge = landmarks[NOSE_BRIDGE];
  const leftEye = landmarks[LEFT_EYE_OUTER];
  const rightEye = landmarks[RIGHT_EYE_OUTER];
  const leftEar = landmarks[LEFT_EAR];
  const rightEar = landmarks[RIGHT_EAR];

  // Convert NDC → world space (map [0,1] to [-1,1] for x, flip y)
  const toWorld = (lm: NormalizedLandmark): THREE.Vector3 =>
    new THREE.Vector3(
      (lm.x - 0.5) * 2,
      -(lm.y - 0.5) * 2,
      -lm.z * 2
    );

  const nosePt = toWorld(noseBridge);
  const leftEyePt = toWorld(leftEye);
  const rightEyePt = toWorld(rightEye);
  const leftEarPt = toWorld(leftEar);
  const rightEarPt = toWorld(rightEar);

  // Position: center between eyes, pushed slightly forward
  const center = new THREE.Vector3()
    .addVectors(leftEyePt, rightEyePt)
    .multiplyScalar(0.5);
  center.z += 0.05;

  // Rotation: yaw from left→right ear vector, pitch from nose depth
  const eyeDir = new THREE.Vector3()
    .subVectors(rightEyePt, leftEyePt)
    .normalize();
  const yaw = Math.atan2(eyeDir.y, eyeDir.x);
  const pitch = Math.atan2(nosePt.z - center.z, nosePt.y - center.y);
  const roll = Math.atan2(
    rightEarPt.y - leftEarPt.y,
    rightEarPt.x - leftEarPt.x
  );

  // Scale: proportional to inter-eye distance
  const interEyeDist = leftEyePt.distanceTo(rightEyePt);
  const s = interEyeDist * 1.6;

  return {
    position: center,
    rotation: new THREE.Euler(pitch, yaw, roll, "XYZ"),
    scale: new THREE.Vector3(s, s, s),
  };
}
