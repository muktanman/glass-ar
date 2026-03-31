import * as THREE from "three";
import { NormalizedLandmark } from "@mediapipe/tasks-vision";

// Key MediaPipe face landmark indices
const LEFT_EYE_OUTER  = 33;
const RIGHT_EYE_OUTER = 263;
const LEFT_EAR        = 234;
const RIGHT_EAR       = 454;
const FOREHEAD        = 10;   // top of head, used as up-vector reference
const CHIN            = 152;  // bottom of face

export interface GlassesTransform {
  position: THREE.Vector3;
  rotation: THREE.Euler;
  scale: THREE.Vector3;
}

/**
 * Computes the world-space transform for the glasses group using a proper
 * orthonormal face coordinate system built from MediaPipe landmarks.
 *
 * Face axes (in Three.js world space after mirror correction):
 *   right   = left-ear → right-ear
 *   up      = chin → forehead, orthogonalised against right
 *   forward = right × up  (points toward the camera)
 *
 * The rotation matrix is built from these axes so glasses track every
 * head movement — yaw, pitch and roll — without guessing Euler angles.
 */
export function computeGlassesTransform(
  landmarks: NormalizedLandmark[],
  // videoWidth / videoHeight kept for future use (e.g. aspect correction)
  _videoWidth: number,
  _videoHeight: number
): GlassesTransform {
  // Convert MediaPipe NDC [0,1] → Three.js world space.
  // X is negated to match the CSS scale-x-[-1] mirror on the video element.
  const toWorld = (lm: NormalizedLandmark): THREE.Vector3 =>
    new THREE.Vector3(
      -(lm.x - 0.5) * 2,
      -(lm.y - 0.5) * 2,
      -lm.z * 2
    );

  const leftEye  = toWorld(landmarks[LEFT_EYE_OUTER]);
  const rightEye = toWorld(landmarks[RIGHT_EYE_OUTER]);
  const leftEar  = toWorld(landmarks[LEFT_EAR]);
  const rightEar = toWorld(landmarks[RIGHT_EAR]);
  const forehead = toWorld(landmarks[FOREHEAD]);
  const chin     = toWorld(landmarks[CHIN]);

  // ── Position ─────────────────────────────────────────────────────────────
  // Centre of the eye line, pushed 4 % of ear-spread forward so glasses
  // sit in front of the face rather than inside it.
  const eyeMid = new THREE.Vector3()
    .addVectors(leftEye, rightEye)
    .multiplyScalar(0.5);

  const earSpread = leftEar.distanceTo(rightEar);
  const position = eyeMid.clone();
  position.z += earSpread * 0.04;

  // ── Rotation (proper orthonormal face basis) ──────────────────────────────
  // 1. Right axis: ear-to-ear direction
  const rightVec = new THREE.Vector3()
    .subVectors(rightEar, leftEar)
    .normalize();

  // 2. Raw up axis: chin → forehead
  const rawUp = new THREE.Vector3()
    .subVectors(forehead, chin)
    .normalize();

  // 3. Forward axis: right × rawUp  (points toward camera because
  //    rightVec is in +X and rawUp is in +Y when face is neutral)
  const forwardVec = new THREE.Vector3()
    .crossVectors(rightVec, rawUp)
    .normalize();

  // 4. Re-orthogonalise up so all three axes are truly perpendicular
  const upVec = new THREE.Vector3()
    .crossVectors(forwardVec, rightVec)
    .normalize();

  // Build a rotation matrix whose columns are [right, up, forward]
  const rotMatrix = new THREE.Matrix4().makeBasis(rightVec, upVec, forwardVec);
  const rotation  = new THREE.Euler().setFromRotationMatrix(rotMatrix, "XYZ");

  // ── Scale ─────────────────────────────────────────────────────────────────
  // Model is normalised to 1 unit wide; scale it to 85 % of ear spread
  // so the frame spans from temple to temple without overhanging.
  const s = earSpread * 1.4;

  return {
    position,
    rotation,
    scale: new THREE.Vector3(s, s, s),
  };
}
