"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { greetingConfig } from "@/config/greeting";
import type { GreetingStage } from "@/hooks/useGreetingFlow";
import type { GreetingLayout } from "@/lib/greeting-layout";

interface PhotoRevealProps {
  stage: Exclude<GreetingStage, "flower">;
  layout: GreetingLayout;
  onClick: () => void;
  disabled: boolean;
}

/**
 * PhotoReveal — bức ảnh polaroid bên trong phong bì:
 *  - Ẩn sau lá thư khi còn trong phong bì (z thấp hơn lá thư).
 *  - Ở giai đoạn revealed, trượt ra theo quỹ đạo/thời gian riêng
 *    (trễ hơn lá thư → cảm giác vật lý tách lớp).
 *  - Trên bố cục dọc (mobile/tablet), ảnh đè nhẹ lên mép thư như
 *    polaroid đặt chồng — khi đó z cao hơn lá thư.
 *  - Ảnh lỗi tự động chuyển sang ảnh dự phòng (SVG minh họa).
 */
export default function PhotoReveal({
  stage,
  layout,
  onClick,
  disabled,
}: PhotoRevealProps) {
  // Ảnh nguồn là dữ liệu tĩnh trong config; nếu ảnh chính lỗi thì hiển thị
  // ảnh dự phòng SVG minh họa (không bao giờ để khung ảnh vỡ).
  const [currentSrc, setCurrentSrc] = useState(greetingConfig.photo);

  const photoH = (layout.photoW - 20) * (4 / 3) + 56;
  const initX = (layout.envW - layout.photoW) / 2;
  const initY = (layout.envH - photoH) / 2 + layout.envH * 0.1;
  const innerScale = (layout.envW * 0.62) / layout.photoW;
  const targetX = initX + (layout.photoCx - layout.envCx);
  const targetY = initY + (layout.photoCy - layout.envCy);
  const revealed = stage === "revealed";

  const variants = {
    hidden: {
      x: initX,
      y: initY,
      scale: innerScale,
      opacity: 0,
      rotate: 2,
    },
    out: {
      x: targetX,
      y: targetY,
      scale: 1,
      opacity: 1,
      rotate: layout.side ? 2.5 : -3,
      transition: { delay: 0.42, duration: 0.9, ease: [0.22, 0.9, 0.3, 1] as const },
    },
  };

  return (
    <motion.button
      type="button"
      className="photo-card"
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: layout.photoW,
        // Trong phong bì: sau lá thư (z7 < 8). Đẩy ra:
        //  - side: trên túi phong bì (15 > 14) nhưng dưới lá thư.
        //  - stacked: đè lên mép lá thư kiểu polaroid (21 > 20).
        zIndex: revealed ? (layout.side ? 15 : 21) : 7,
        // Ảnh ẩn trong phong bì KHÔNG được nhận click (tránh click xuyên
        // qua vùng khoét chữ V của túi phong bì gây mở nhầm lightbox).
        pointerEvents: revealed ? "auto" : "none",
      }}
      variants={variants}
      initial="hidden"
      animate={revealed ? "out" : "hidden"}
      onClick={onClick}
      disabled={disabled}
      aria-label="Xem bức ảnh lớn"
    >
      <span className="photo-frame">
        <img
          src={currentSrc}
          alt={greetingConfig.photoCaption}
          loading="eager"
          decoding="async"
          onError={() => setCurrentSrc(greetingConfig.photoFallback)}
        />
      </span>
      <span className="photo-caption">{greetingConfig.photoCaption}</span>
    </motion.button>
  );
}
