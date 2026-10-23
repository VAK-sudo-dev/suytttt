"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Các giai đoạn của trải nghiệm:
 *  - flower:   cảnh hoa hướng dương (canvas)
 *  - envelope: phong bì xuất hiện, nắp mở, lá thư hé lộ một phần
 *  - revealed: lá thư + ảnh được đẩy ra khỏi phong bì
 */
export type GreetingStage = "flower" | "envelope" | "revealed";

/**
 * Custom hook quản lý toàn bộ luồng tương tác dưới dạng state machine.
 * - `isTransitioning` khóa thao tác trong thời gian chuyển cảnh để tránh
 *   kích hoạt lặp / nhấn trùng.
 * - `photoOpen` / `letterOpen` là hai modal độc lập ở giai đoạn revealed.
 */
export function useGreetingFlow() {
  const [stage, setStage] = useState<GreetingStage>("flower");
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [photoOpen, setPhotoOpen] = useState(false);
  const [letterOpen, setLetterOpen] = useState(false);
  const lockTimer = useRef<number | null>(null);

  const lock = useCallback((ms: number) => {
    setIsTransitioning(true);
    if (lockTimer.current !== null) window.clearTimeout(lockTimer.current);
    lockTimer.current = window.setTimeout(() => setIsTransitioning(false), ms);
  }, []);

  // Dọn dẹp timer khi unmount
  useEffect(() => {
    return () => {
      if (lockTimer.current !== null) window.clearTimeout(lockTimer.current);
    };
  }, []);

  /** Giai đoạn 1 → 2: nhấn vào bông hoa */
  const goToEnvelope = useCallback(() => {
    setStage((current) => {
      if (current !== "flower") return current;
      lock(1500);
      return "envelope";
    });
  }, [lock]);

  /** Giai đoạn 2 → 3: nhấn vào phong bì / lá thư hé lộ */
  const revealLetter = useCallback(() => {
    setStage((current) => {
      if (current !== "envelope") return current;
      lock(1400);
      return "revealed";
    });
  }, [lock]);

  const openPhoto = useCallback(() => {
    setPhotoOpen(true);
  }, []);

  const closePhoto = useCallback(() => {
    setPhotoOpen(false);
  }, []);

  const openLetter = useCallback(() => {
    setLetterOpen(true);
  }, []);

  const closeLetter = useCallback(() => {
    setLetterOpen(false);
  }, []);

  return {
    stage,
    isTransitioning,
    photoOpen,
    letterOpen,
    goToEnvelope,
    revealLetter,
    openPhoto,
    closePhoto,
    openLetter,
    closeLetter,
  };
}
