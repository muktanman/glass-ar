"use client";

import { useEffect, useRef } from "react";
import { CalibrationState } from "@/hooks/useFaceCalibration";

interface FaceScanOverlayProps {
  state: CalibrationState;
  progress: number; // 0 → 1
  faceDetected: boolean;
  onStartScan: () => void;
  onRescan: () => void;
}

const OVAL_RX = 110; // horizontal radius
const OVAL_RY = 140; // vertical radius
const CX = 200;      // svg centre x
const CY = 200;      // svg centre y
const SVG_SIZE = 400;

// Circumference of the ellipse (Ramanujan approximation)
const h = ((OVAL_RX - OVAL_RY) / (OVAL_RX + OVAL_RY)) ** 2;
const ELLIPSE_CIRCUMFERENCE = Math.PI * (OVAL_RX + OVAL_RY) * (1 + (3 * h) / (10 + Math.sqrt(4 - 3 * h)));

export default function FaceScanOverlay({
  state,
  progress,
  faceDetected,
  onStartScan,
  onRescan,
}: FaceScanOverlayProps) {
  const scanLineRef = useRef<HTMLDivElement>(null);

  // Animate scan line while scanning
  useEffect(() => {
    if (state !== "scanning" || !scanLineRef.current) return;
    let raf: number;
    let start: number | null = null;
    const duration = 1200;

    const tick = (ts: number) => {
      if (!start) start = ts;
      const t = ((ts - start) % duration) / duration;
      const y = t * 100;
      if (scanLineRef.current) {
        scanLineRef.current.style.top = `${y}%`;
        scanLineRef.current.style.opacity = t < 0.1 || t > 0.9 ? "0" : "1";
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [state]);

  const dashOffset = ELLIPSE_CIRCUMFERENCE * (1 - progress);
  const isDone = state === "done";
  const isScanning = state === "scanning";

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center z-10 pointer-events-none">
      {/* Dark vignette overlay */}
      <div className="absolute inset-0 bg-black/50" />

      {/* Face oval guide */}
      <div className="relative" style={{ width: SVG_SIZE, height: SVG_SIZE }}>
        <svg
          width={SVG_SIZE}
          height={SVG_SIZE}
          viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}
          className="absolute inset-0"
        >
          {/* Cutout: mask punches the oval out of the overlay */}
          <defs>
            <mask id="oval-mask">
              <rect width={SVG_SIZE} height={SVG_SIZE} fill="white" />
              <ellipse cx={CX} cy={CY} rx={OVAL_RX} ry={OVAL_RY} fill="black" />
            </mask>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Tinted overlay with oval window */}
          <rect
            width={SVG_SIZE}
            height={SVG_SIZE}
            fill="rgba(0,0,0,0.55)"
            mask="url(#oval-mask)"
          />

          {/* Background ring */}
          <ellipse
            cx={CX} cy={CY} rx={OVAL_RX} ry={OVAL_RY}
            fill="none"
            stroke="rgba(255,255,255,0.2)"
            strokeWidth="2"
          />

          {/* Progress ring */}
          <ellipse
            cx={CX} cy={CY} rx={OVAL_RX} ry={OVAL_RY}
            fill="none"
            stroke={isDone ? "#22c55e" : "#ffffff"}
            strokeWidth="3"
            strokeDasharray={ELLIPSE_CIRCUMFERENCE}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            transform={`rotate(-90 ${CX} ${CY})`}
            filter="url(#glow)"
            style={{ transition: "stroke-dashoffset 0.1s linear, stroke 0.3s" }}
          />

          {/* Corner tick marks */}
          {[
            [CX - OVAL_RX, CY], [CX + OVAL_RX, CY],
            [CX, CY - OVAL_RY], [CX, CY + OVAL_RY],
          ].map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r="4"
              fill={isDone ? "#22c55e" : faceDetected ? "#ffffff" : "rgba(255,255,255,0.3)"}
              style={{ transition: "fill 0.3s" }}
            />
          ))}
        </svg>

        {/* Animated scan line inside oval */}
        {isScanning && (
          <div
            ref={scanLineRef}
            className="absolute pointer-events-none"
            style={{
              left: `${((CX - OVAL_RX) / SVG_SIZE) * 100}%`,
              width: `${(OVAL_RX * 2 / SVG_SIZE) * 100}%`,
              height: "1px",
              background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.8), transparent)",
              top: "30%",
              transition: "opacity 0.2s",
            }}
          />
        )}

        {/* Centre status */}
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-6 pointer-events-none">
          {isDone ? (
            <div className="flex items-center gap-2 bg-green-500/90 text-white text-sm font-semibold px-4 py-1.5 rounded-full shadow-lg">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M2 7l4 4 6-6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Face scanned
            </div>
          ) : isScanning ? (
            <div className="text-white text-sm font-medium bg-black/50 px-3 py-1 rounded-full">
              {Math.round(progress * 100)}% — hold still…
            </div>
          ) : (
            <div className="text-white/70 text-xs text-center px-4">
              {faceDetected ? "Face detected" : "Position your face in the oval"}
            </div>
          )}
        </div>
      </div>

      {/* Action buttons (pointer-events enabled) */}
      <div className="relative pointer-events-auto mt-4 flex gap-3">
        {state === "idle" && (
          <button
            onClick={onStartScan}
            disabled={!faceDetected}
            className="px-6 py-2.5 bg-white text-gray-900 font-semibold text-sm rounded-full shadow-lg
                       disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100 transition"
          >
            Scan My Face
          </button>
        )}
        {isDone && (
          <button
            onClick={onRescan}
            className="px-5 py-2 text-white text-sm border border-white/40 rounded-full hover:bg-white/10 transition"
          >
            Rescan
          </button>
        )}
      </div>
    </div>
  );
}
