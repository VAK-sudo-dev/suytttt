"use client";

import { motion } from "framer-motion";
import { X } from "lucide-react";
import { greetingConfig } from "@/config/greeting";
import { useModalA11y } from "@/hooks/useModalA11y";
import { playTick } from "@/lib/sounds";
import LetterSprig from "./LetterSprig";

interface LetterModalProps {
  onClose: () => void;
}

/**
 * LetterModal — chế độ đọc thư đầy đủ:
 *  - Nội dung là HTML thật (không phải chữ trong ảnh), font serif,
 *    giãn dòng 1.95, tương phản đạt chuẩn.
 *  - Cuộn được trên điện thoại (max-height 86svh, scrollbar mảnh).
 *  - Đóng bằng nút X, Escape; trả focus về nơi đã mở.
 */
export default function LetterModal({ onClose }: LetterModalProps) {
  const { closeButtonRef, panelRef } = useModalA11y(onClose);
  const titleId = "letter-modal-title";

  return (
    <motion.div
      className="modal-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <motion.div
        className="letter-modal-panel"
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        initial={{ opacity: 0, y: 34, scale: 0.94, rotate: -1 }}
        animate={{ opacity: 1, y: 0, scale: 1, rotate: 0 }}
        exit={{ opacity: 0, y: 22, scale: 0.95 }}
        transition={{ duration: 0.45, ease: [0.2, 0.8, 0.2, 1] }}
      >
        <button
          type="button"
          ref={closeButtonRef}
          className="modal-close"
          onClick={() => {
            playTick();
            onClose();
          }}
          aria-label="Đóng lá thư"
        >
          <X size={22} aria-hidden="true" />
        </button>

        <p className="letter-date">
          20<span className="divider" aria-hidden="true" />
          10
        </p>
        <LetterSprig className="letter-sprig" />
        <p className="letter-recipient">
          Gửi <strong>{greetingConfig.recipient}</strong>,
        </p>
        <h2 className="letter-title" id={titleId}>
          {greetingConfig.title}
        </h2>

        <div className="letter-body">
          {greetingConfig.message.map((paragraph, index) => (
            <p className="message" key={index}>
              {paragraph}
            </p>
          ))}
        </div>

        <p className="letter-modal-sign">{greetingConfig.signature}</p>
        <p className="letter-modal-sub">{greetingConfig.subtitle}</p>
      </motion.div>
    </motion.div>
  );
}
