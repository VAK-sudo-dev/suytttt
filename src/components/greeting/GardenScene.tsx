"use client";

import { useEffect, useRef, useState } from "react";
import { greetingConfig } from "@/config/greeting";
import {
  startGardenScene,
  heroRadiusFor,
  type GardenSceneHandle,
} from "@/lib/garden-scene";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

interface GardenSceneProps {
  onFlowerClick: () => void;
}

/**
 * GardenScene — cảnh hoa hướng dương vẽ bằng canvas (chuyển thể từ
 * garden.html) + nút trong suốt đặt đúng tâm bông hoa để chạm/bấm.
 * Vòng lặp animation được dọn dẹp triệt để khi unmount.
 */
export default function GardenScene({ onFlowerClick }: GardenSceneProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const sceneRef = useRef<GardenSceneHandle | null>(null);
  const reducedMotion = usePrefersReducedMotion();
  const [flowerSize, setFlowerSize] = useState(230);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const handle = startGardenScene(canvas, { reducedMotion });
    sceneRef.current = handle;
    return () => {
      handle.destroy();
      sceneRef.current = null;
    };
  }, []);

  useEffect(() => {
    sceneRef.current?.setReducedMotion(reducedMotion);
  }, [reducedMotion]);

  useEffect(() => {
    const update = () =>
      setFlowerSize(heroRadiusFor(window.innerWidth, window.innerHeight) * 2.42);
    update();
    window.addEventListener("resize", update, { passive: true });
    return () => window.removeEventListener("resize", update);
  }, []);

  const handleClick = () => {
    sceneRef.current?.burst();
    onFlowerClick();
  };

  return (
    <>
      <div className="garden-scene" aria-hidden="true">
        <canvas ref={canvasRef} />
      </div>
      <button
        type="button"
        className="flower-button"
        style={{ ["--flower-size" as string]: `${flowerSize}px` }}
        onClick={handleClick}
        aria-label={greetingConfig.flowerHint}
      />
    </>
  );
}
