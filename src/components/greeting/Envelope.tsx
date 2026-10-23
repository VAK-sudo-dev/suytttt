"use client";

import { useEffect, useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import { Heart } from "lucide-react";
import type { GreetingStage } from "@/hooks/useGreetingFlow";

interface EnvelopeProps {
  stage: Exclude<GreetingStage, "flower">;
  /** Thời điểm phong bì được phép tương tác (khóa trong chuyển cảnh) */
  interactive: boolean;
  onActivate: () => void;
  children: ReactNode;
}

/**
 * Envelope — phong bì thư dựng hoàn toàn bằng HTML/CSS:
 *  - Thân sau (z1) → lá thư & ảnh (children, z7–8) → túi trước (z14)
 *    → nắp (z16, lật rotateX quanh cạnh trên) → con dấu sáp (z18).
 *  - Nhờ children nằm GIỮA thân sau và túi trước, lá thư thực sự
 *    trượt ra từ trong phong bì (đúng thứ tự lớp), không phải hiệu ứng
 *    đổi trang.
 *  - Nắp mở: rotateX 0→180, đổi z-index ở giữa vòng lật (16→2) để nắp
 *    nằm ra sau thân phong bì như vật thật.
 */
export default function Envelope({ stage, interactive, onActivate, children }: EnvelopeProps) {
  const [flapOpen, setFlapOpen] = useState(false);
  const revealed = stage === "revealed";

  // Nắp tự mở sau khi phong bì đã vào vị trí (khoảng 0.75s sau mount)
  useEffect(() => {
    const timer = window.setTimeout(() => setFlapOpen(true), 900);
    return () => window.clearTimeout(timer);
  }, []);

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (!interactive) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onActivate();
    }
  };

  return (
    <motion.div
      className="envelope"
      role={revealed ? undefined : "button"}
      tabIndex={revealed || !interactive ? -1 : 0}
      aria-label={revealed ? undefined : "Mở phong bì thư chúc mừng"}
      aria-expanded={revealed ? undefined : flapOpen}
      onClick={revealed ? undefined : () => interactive && onActivate()}
      onKeyDown={revealed ? undefined : handleKeyDown}
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: "100%",
        height: "100%",
        pointerEvents: revealed ? "none" : "auto",
        zIndex: 10,
      }}
      initial={{ opacity: 0, scale: 0.55, y: -70, rotate: -5 }}
      animate={{
        opacity: 1,
        scale: revealed ? 0.985 : 1,
        y: revealed ? 8 : 0,
        rotate: revealed ? 0.6 : 0,
      }}
      transition={
        revealed
          ? { duration: 0.6, ease: [0.22, 0.9, 0.3, 1] }
          : { duration: 0.8, ease: [0.2, 0.8, 0.2, 1] }
      }
    >
      {/* Thân sau */}
      <div className="env-back" aria-hidden="true" />

      {/* Lá thư + ảnh — nằm giữa thân sau và túi trước */}
      {children}

      {/* Túi trước */}
      <div className="env-pocket" aria-hidden="true" />

      {/* Nắp phong bì — hai mặt, lật 3D */}
      <motion.div
        className="env-flap"
        aria-hidden="true"
        initial={false}
        animate={
          flapOpen
            ? { rotateX: [0, 180], zIndex: [16, 16, 2] }
            : { rotateX: 0, zIndex: 16 }
        }
        transition={
          flapOpen
            ? {
                rotateX: { duration: 0.9, ease: [0.2, 0.8, 0.2, 1] },
                zIndex: { duration: 0.9, times: [0, 0.48, 0.52] },
              }
            : { duration: 0 }
        }
        style={{ transformOrigin: "top center" }}
      >
        <div className="env-flap-face env-flap-front" />
        <div className="env-flap-face env-flap-back" />
      </motion.div>

      {/* Con dấu sáp trái tim */}
      <motion.div
        className="env-seal"
        aria-hidden="true"
        initial={false}
        animate={
          flapOpen
            ? { opacity: 0, scale: 0.4, rotate: -22 }
            : { opacity: 1, scale: 1, rotate: 0 }
        }
        transition={{ duration: 0.32, ease: "easeOut" }}
      >
        <Heart size={24} fill="currentColor" strokeWidth={0} />
      </motion.div>

      {/* Nhãn trạng thái cho trình đọc màn hình khi nắp mở */}
      <span className="sr-only" aria-live="polite">
        {flapOpen ? "Phong bì đã mở" : ""}
      </span>
    </motion.div>
  );
}
