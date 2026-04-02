"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { useCamera } from "@/hooks/useCamera";
import { useARScene } from "@/hooks/useARScene";
import { useFaceCalibration } from "@/hooks/useFaceCalibration";
import FaceScanOverlay from "@/components/FaceScanOverlay";
import { Product } from "@/data/products";

interface ARViewerProps {
  selectedProduct: Product | null;
}

export default function ARViewer({ selectedProduct }: ARViewerProps) {
  const { videoRef, isActive, error, startCamera, stopCamera } = useCamera();
  const { canvasRef, init, loadGlasses, startLoop, stopLoop } = useARScene();
  const { state: scanState, progress, calibration, addSample, startScan, resetScan } =
    useFaceCalibration();

  const initialized      = useRef(false);
  const calibrationRef   = useRef(calibration);
  const canvasAspectRef  = useRef(1);
  const [faceDetected, setFaceDetected] = useState(false);

  // Keep calibrationRef in sync so the loop closure can read the latest value.
  useEffect(() => { calibrationRef.current = calibration; }, [calibration]);

  // Initialize Three.js scene once canvas is mounted.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || initialized.current) return;
    initialized.current = true;
    init(canvas);
    return () => stopLoop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Per-frame callback: feed landmarks into the calibration hook if scanning.
  const handleFrame = useCallback(
    (result: ReturnType<typeof import("@/lib/faceTracking").detectFace>) => {
      const landmarks = result?.faceLandmarks?.[0];
      setFaceDetected(!!landmarks);
      if (landmarks && scanState === "scanning") {
        const aspect = canvasAspectRef.current;
        addSample(landmarks, aspect);
      }
    },
    [scanState, addSample]
  );

  // Start render loop once camera is active.
  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!isActive || !video || !canvas) return;

    canvasAspectRef.current = canvas.clientWidth / canvas.clientHeight;

    startLoop(
      video,
      () => calibrationRef.current,
      handleFrame
    );
    return () => stopLoop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive, handleFrame]);

  // Load/switch glasses model when product selection changes.
  useEffect(() => {
    if (selectedProduct) loadGlasses(selectedProduct.modelUrl);
  }, [selectedProduct, loadGlasses]);

  // When camera stops, reset the scan so the user scans again next time.
  const handleStop = useCallback(() => {
    stopCamera();
    resetScan();
  }, [stopCamera, resetScan]);

  const showScanOverlay = isActive && scanState !== "done";

  return (
    <div className="flex flex-col gap-3">
      <div className="relative w-full aspect-[4/3] md:aspect-video rounded-2xl overflow-hidden bg-black shadow-2xl">
        {/* Camera feed */}
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover scale-x-[-1]"
          playsInline
          muted
        />

        {/* Three.js overlay */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full"
        />

        {/* Face scan overlay (shown after camera starts, until scan completes) */}
        {showScanOverlay && (
          <FaceScanOverlay
            state={scanState}
            progress={progress}
            faceDetected={faceDetected}
            onStartScan={startScan}
            onRescan={resetScan}
          />
        )}

        {/* Camera off state */}
        {!isActive && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-gray-900/90">
            {error && (
              <p className="text-red-400 text-sm text-center px-6">{error}</p>
            )}
            <div className="text-center px-6">
              <p className="text-white font-semibold mb-1">Try on sunglasses</p>
              <p className="text-gray-400 text-sm">We&apos;ll scan your face for a perfect fit</p>
            </div>
            <button
              onClick={startCamera}
              className="px-6 py-3 bg-white text-gray-900 font-semibold rounded-full shadow-lg hover:bg-gray-100 transition"
            >
              Enable Camera
            </button>
          </div>
        )}

        {/* Top-right controls when active */}
        {isActive && (
          <div className="absolute top-3 right-3 flex gap-2">
            {scanState === "done" && (
              <button
                onClick={resetScan}
                className="px-3 py-1.5 bg-black/50 text-white text-xs rounded-full hover:bg-black/70 transition"
              >
                Rescan
              </button>
            )}
            <button
              onClick={handleStop}
              className="px-3 py-1.5 bg-black/50 text-white text-xs rounded-full hover:bg-black/70 transition"
            >
              Stop
            </button>
          </div>
        )}
      </div>

      {/* Status bar below viewer */}
      {isActive && scanState === "done" && calibration && (
        <p className="text-xs text-gray-400 text-center">
          Face scanned · temple span {(calibration.templeSpread * 100).toFixed(1)} units · select a style below
        </p>
      )}
    </div>
  );
}
