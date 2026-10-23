"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { X } from "lucide-react";
import { greetingConfig } from "@/config/greeting";
import { useModalA11y } from "@/hooks/useModalA11y";
import { playTick } from "@/lib/sounds";

interface ImageLightboxProps {
  onClose: () => void;
}

/**
 * ImageLightbox — chế độ xem ảnh lớn:
 *  - Phóng to bằng scale + opacity, giữ nguyên tỷ lệ khung hình
 *    (object-fit: contain, không bao giờ méo ảnh).
 *  - Nền tối đi + blur; đóng bằng nút X, phím Escape hoặc nhấn nền.
 */
export default function ImageLightbox({ onClose }: ImageLightboxProps) {
  const { closeButtonRef, panelRef } = useModalA11y(onClose);
  // Modal mount lại mỗi lần mở nên luôn khởi tạo đúng ảnh nguồn trong config;
  // nếu ảnh chính lỗi thì tự chuyển sang ảnh dự phòng SVG.
  const [currentSrc, setCurrentSrc] = useState(greetingConfig.photo);

  return (
    <motion.div
      className="modal-backdrop lightbox"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <motion.div
        className="lightbox-content"
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Ảnh phóng to"
        initial={{ opacity: 0, scale: 0.88 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.92 }}
        transition={{ type: "spring", stiffness: 260, damping: 26 }}
      >
        <motion.figure
          className="lightbox-figure"
          initial={{ rotate: -1.5 }}
          animate={{ rotate: 0 }}
          transition={{ duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }}
        >
          <img
            src={currentSrc}
            alt={greetingConfig.photoCaption}
            decoding="async"
            onError={() => setCurrentSrc(greetingConfig.photoFallback)}
          />
        </motion.figure>
        <p className="lightbox-caption">{greetingConfig.photoCaption}</p>
        <button
          type="button"
          ref={closeButtonRef}
          className="modal-close"
          onClick={() => {
            playTick();
            onClose();
          }}
          aria-label="Đóng ảnh lớn"
        >
          <X size={22} aria-hidden="true" />
        </button>
      </motion.div>
    </motion.div>
  );
}
