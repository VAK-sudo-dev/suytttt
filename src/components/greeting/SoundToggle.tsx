"use client";

import { Volume2, VolumeX } from "lucide-react";

interface SoundToggleProps {
  muted: boolean;
  onToggle: () => void;
}

/** Nút bật/tắt âm thanh — mục tiêu chạm ≥44px, nhãn truy cập rõ ràng. */
export default function SoundToggle({ muted, onToggle }: SoundToggleProps) {
  return (
    <button
      type="button"
      className="sound-toggle"
      onClick={onToggle}
      aria-label={muted ? "Bật âm thanh" : "Tắt âm thanh"}
      aria-pressed={!muted}
    >
      {muted ? <VolumeX size={20} aria-hidden="true" /> : <Volume2 size={20} aria-hidden="true" />}
    </button>
  );
}
