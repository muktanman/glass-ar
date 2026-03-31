"use client";

import { useEffect, useRef } from "react";
import { useCamera } from "@/hooks/useCamera";
import { useARScene } from "@/hooks/useARScene";
import { Product } from "@/data/products";

interface ARViewerProps {
  selectedProduct: Product | null;
}

export default function ARViewer({ selectedProduct }: ARViewerProps) {
  const { videoRef, isActive, error, startCamera, stopCamera } = useCamera();
  const { canvasRef, init, loadGlasses, startLoop, stopLoop } = useARScene();
  const initialized = useRef(false);

  // Initialize Three.js scene once canvas is mounted
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || initialized.current) return;
    initialized.current = true;
    init(canvas);

    return () => {
      stopLoop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Start render loop once camera is active
  useEffect(() => {
    const video = videoRef.current;
    if (!isActive || !video) return;
    startLoop(video);
    return () => stopLoop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive]);

  // Switch glasses model when selection changes
  useEffect(() => {
    if (selectedProduct) {
      loadGlasses(selectedProduct.modelUrl);
    }
  }, [selectedProduct, loadGlasses]);

  return (
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
        style={{ mixBlendMode: "normal" }}
      />

      {/* Start / stop button */}
      {!isActive ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-gray-900/80">
          {error && (
            <p className="text-red-400 text-sm text-center px-6">{error}</p>
          )}
          <button
            onClick={startCamera}
            className="px-6 py-3 bg-white text-gray-900 font-semibold rounded-full shadow-lg hover:bg-gray-100 transition"
          >
            Enable Camera
          </button>
        </div>
      ) : (
        <button
          onClick={stopCamera}
          className="absolute top-3 right-3 px-3 py-1.5 bg-black/50 text-white text-xs rounded-full hover:bg-black/70 transition"
        >
          Stop Camera
        </button>
      )}
    </div>
  );
}
