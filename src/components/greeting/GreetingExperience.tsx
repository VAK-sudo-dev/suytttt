"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, MotionConfig, motion } from "framer-motion";
import { greetingConfig } from "@/config/greeting";
import { useGreetingFlow } from "@/hooks/useGreetingFlow";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { useViewportSize } from "@/hooks/useViewportSize";
import { computeLayout } from "@/lib/greeting-layout";
import {
  playBloom,
  playFlap,
  playReveal,
  playTick,
  setMuted,
} from "@/lib/sounds";
import BackgroundEffects from "./BackgroundEffects";
import Envelope from "./Envelope";
import GardenScene from "./GardenScene";
import ImageLightbox from "./ImageLightbox";
import Letter from "./Letter";
import LetterModal from "./LetterModal";
import PhotoReveal from "./PhotoReveal";
import SoundToggle from "./SoundToggle";

/**
 * GreetingExperience — dàn dựng toàn bộ trải nghiệm 4 giai đoạn:
 *   1. Hoa hướng dương (canvas) → 2. Phong bì + nắp mở, thư hé lộ
 *   → 3. Thư + ảnh trượt ra khỏi phong bì → 4. Phóng to ảnh / đọc thư.
 * Chuyển cảnh dùng AnimatePresence; thao tác bị khóa trong thời gian
 * chuyển để tránh kích hoạt lặp.
 */
export default function GreetingExperience() {
  const {
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
  } = useGreetingFlow();
  const reducedMotion = usePrefersReducedMotion();
  const viewport = useViewportSize();
  const layout = useMemo(() => computeLayout(viewport), [viewport]);

  const letterButtonRef = useRef<HTMLButtonElement | null>(null);
  const [muted, setMutedState] = useState(false);
  const [peekHint, setPeekHint] = useState(false);
  const revealSoundTimer = useRef<number | null>(null);

  // Dọn dẹp timer âm thanh khi unmount
  useEffect(() => {
    return () => {
      if (revealSoundTimer.current !== null) {
        window.clearTimeout(revealSoundTimer.current);
      }
    };
  }, []);

  // Dòng gợi ý đổi sau khi lá thư trồi lên một phần (stage chỉ đi tới)
  useEffect(() => {
    if (stage !== "envelope") return;
    const timer = window.setTimeout(() => setPeekHint(true), 1900);
    return () => window.clearTimeout(timer);
  }, [stage]);

  // Sau khi thư hiện ra, chuyển focus sang lá thư cho luồng bàn phím
  useEffect(() => {
    if (stage !== "revealed") return;
    const timer = window.setTimeout(() => {
      letterButtonRef.current?.focus({ preventScroll: true });
    }, 1500);
    return () => window.clearTimeout(timer);
  }, [stage]);

  const handleFlowerClick = () => {
    playBloom();
    goToEnvelope();
  };

  const handleEnvelopeActivate = () => {
    if (isTransitioning) return;
    playFlap();
    if (revealSoundTimer.current !== null) window.clearTimeout(revealSoundTimer.current);
    revealSoundTimer.current = window.setTimeout(playReveal, 420);
    revealLetter();
  };

  const handleOpenPhoto = () => {
    if (isTransitioning) return;
    playTick();
    openPhoto();
  };

  const handleOpenLetter = () => {
    if (isTransitioning) return;
    playTick();
    openLetter();
  };

  const handleToggleSound = () => {
    const next = !muted;
    setMuted(next);
    setMutedState(next);
    if (!next) playTick();
  };

  const hintText =
    stage === "flower"
      ? greetingConfig.flowerHint
      : stage === "envelope"
        ? peekHint
          ? greetingConfig.letterPeekHint
          : greetingConfig.envelopeHint
        : layout.side
          ? `${greetingConfig.letterHint} · ${greetingConfig.photoHint}`
          : "";

  const sparkDots = useMemo(() => {
    const rand = (n: number) => {
      const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
      return x - Math.floor(x);
    };
    return Array.from({ length: 12 }, (_, i) => ({
      id: i,
      left: 44 + rand(i + 1) * 12,
      top: 40 + rand(i + 21) * 12,
      dx: (rand(i + 41) - 0.5) * 220,
      dy: -60 - rand(i + 61) * 140,
      size: 6 + rand(i + 81) * 7,
      duration: 0.9 + rand(i + 101) * 0.7,
      delay: rand(i + 121) * 0.35,
    }));
  }, []);

  return (
    <MotionConfig reducedMotion="user">
      <div className="stage">
        {/* Nền: ánh vàng, bụi sáng (chỉ ở giai đoạn sau hoa) */}
        {stage !== "flower" && <BackgroundEffects />}

        <header className="page-header">
          <p className="dedication">{greetingConfig.dedication}</p>
          <p className="date-block">
            <span>20 / 10</span>
            Ngày Phụ nữ Việt Nam
          </p>
        </header>

        {/* Giai đoạn 1 — khu vườn hướng dương */}
        <AnimatePresence>
          {stage === "flower" && (
            <motion.div
              key="garden"
              className="garden-wrap"
              style={{ position: "absolute", inset: 0, zIndex: 10 }}
              exit={{ opacity: 0, scale: 0.92 }}
              transition={{ duration: 0.6, ease: "easeInOut" }}
            >
              <GardenScene onFlowerClick={handleFlowerClick} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Giai đoạn 2 & 3 — phong bì, lá thư, ảnh */}
        <AnimatePresence>
          {stage !== "flower" && (
            <motion.div
              key="envelope-scene"
              className="object-layer"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.35 }}
            >
              {/* Lấp lánh khi lá thư được đẩy ra (animation chạy 1 lần khi mount,
                  kết thúc ở opacity 0 nên không cần unmount) */}
              {stage === "revealed" && !reducedMotion && (
                <div
                  aria-hidden="true"
                  style={{
                    position: "absolute",
                    inset: 0,
                    zIndex: 26,
                    pointerEvents: "none",
                  }}
                >
                  {sparkDots.map((spark) => (
                    <span
                      key={spark.id}
                      className="spark-dot"
                      style={{
                        ["--spark-left" as string]: `${spark.left}%`,
                        ["--spark-top" as string]: `${spark.top}%`,
                        ["--spark-dx" as string]: `${spark.dx}px`,
                        ["--spark-dy" as string]: `${spark.dy}px`,
                        ["--spark-size" as string]: `${spark.size}px`,
                        ["--spark-dur" as string]: `${spark.duration}s`,
                        ["--spark-delay" as string]: `${spark.delay}s`,
                      }}
                    />
                  ))}
                </div>
              )}

              {/* Vỏ định vị phong bì (căn giữa bằng margin, không transform
                  để Framer Motion tự do điều khiển transform bên trong) */}
              <div
                style={{
                  position: "absolute",
                  left: layout.envCx,
                  top: layout.envCy,
                  width: layout.envW,
                  height: layout.envH,
                  marginLeft: -layout.envW / 2,
                  marginTop: -layout.envH / 2,
                }}
              >
                <Envelope
                  stage={stage}
                  interactive={!isTransitioning}
                  onActivate={handleEnvelopeActivate}
                >
                  <PhotoReveal
                    stage={stage}
                    layout={layout}
                    onClick={handleOpenPhoto}
                    disabled={isTransitioning}
                  />
                  <Letter
                    stage={stage}
                    layout={layout}
                    onClick={handleOpenLetter}
                    disabled={isTransitioning}
                    buttonRef={letterButtonRef}
                  />
                </Envelope>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Dòng gợi ý */}
        <p className="hint-line" aria-live="polite">
          <AnimatePresence mode="wait">
            {hintText ? (
              <motion.span
                key={hintText}
                style={{ display: "inline-block" }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.35 }}
              >
                {hintText}
              </motion.span>
            ) : null}
          </AnimatePresence>
        </p>

        {/* Giai đoạn 4 — hai modal phóng to */}
        <AnimatePresence>
          {photoOpen && <ImageLightbox key="photo-lightbox" onClose={closePhoto} />}
          {letterOpen && <LetterModal key="letter-modal" onClose={closeLetter} />}
        </AnimatePresence>

        <SoundToggle muted={muted} onToggle={handleToggleSound} />
      </div>
    </MotionConfig>
  );
}
