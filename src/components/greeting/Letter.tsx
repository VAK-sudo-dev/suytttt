"use client";

import { motion } from "framer-motion";
import type { RefObject } from "react";
import { greetingConfig } from "@/config/greeting";
import type { GreetingStage } from "@/hooks/useGreetingFlow";
import type { GreetingLayout } from "@/lib/greeting-layout";
import LetterSprig from "./LetterSprig";

interface LetterProps {
  stage: Exclude<GreetingStage, "flower">;
  layout: GreetingLayout;
  onClick: () => void;
  disabled: boolean;
  buttonRef?: RefObject<HTMLButtonElement | null>;
}

/**
 * Letter — tờ thư ở cấp vật thể, là con trực tiếp của phong bì:
 *  - "hidden": nằm gọn trong phong bì (che bởi túi trước, opacity 0).
 *  - "peek" (giai đoạn envelope): trồi lên một phần sau khi nắp mở,
 *    mời người dùng chạm.
 *  - "out" (giai đoạn revealed): trượt hẳn ra khỏi phong bì, phóng to
 *    đến vị trí dễ đọc. transform/opacity only — mượt trên GPU.
 */
export default function Letter({
  stage,
  layout,
  onClick,
  disabled,
  buttonRef,
}: LetterProps) {
  const letterH = layout.letterW * 0.72;
  const initX = (layout.envW - layout.letterW) / 2;
  const initY = (layout.envH - letterH) / 2 + 4;
  const innerScale = (layout.envW * 0.82) / layout.letterW;
  const peekY = initY - layout.envH * 0.36;
  const targetX = initX + (layout.letterCx - layout.envCx);
  const targetY = initY + (layout.letterCy - layout.envCy);

  const variants = {
    hidden: { x: initX, y: initY, scale: innerScale, opacity: 0, rotate: 0 },
    peek: {
      x: initX,
      y: peekY,
      scale: innerScale,
      opacity: 1,
      rotate: -2,
      transition: { delay: 1.55, duration: 0.75, ease: [0.22, 0.9, 0.3, 1] as const },
    },
    out: {
      x: targetX,
      y: targetY,
      scale: 1,
      opacity: 1,
      rotate: 0,
      transition: { delay: 0.12, duration: 0.95, ease: [0.22, 0.9, 0.3, 1] as const },
    },
  };

  return (
    <motion.button
      ref={buttonRef}
      type="button"
      className="letter-card"
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: layout.letterW,
        // Trong phong bì: dưới túi trước (z14). Sau khi đẩy ra: trên tất cả
        // các lớp phong bì để không bị túi che góc dưới.
        zIndex: stage === "revealed" ? 20 : 8,
        // Khi còn trong phong bì (cả lúc hé lộ), nhấn vào thư phải là hành
        // động MỞ PHONG BÌ (do phong bì xử lý) — tuyệt đối không mở modal.
        pointerEvents: stage === "revealed" ? "auto" : "none",
      }}
      variants={variants}
      initial="hidden"
      animate={stage === "envelope" ? "peek" : "out"}
      onClick={onClick}
      disabled={disabled}
      aria-label={`Đọc ${greetingConfig.title}`}
    >
      <p className="letter-date">
        20<span className="divider" aria-hidden="true" />
        10
      </p>
      <LetterSprig className="letter-sprig" />
      <p className="letter-recipient">
        Gửi <strong>{greetingConfig.recipient}</strong>,
      </p>
      <p className="letter-preview">{greetingConfig.message[0]}</p>
      <p className="letter-sign mini">{greetingConfig.signature}</p>
    </motion.button>
  );
}
