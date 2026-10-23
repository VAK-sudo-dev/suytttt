"use client";

import type { ViewportSize } from "@/hooks/useViewportSize";

/**
 * Bố cục các vật thể (phong bì, lá thư, ảnh) theo kích thước màn hình.
 * - side (≥900px): lá thư bên trái, ảnh bên phải, phong bì ở dưới trung tâm.
 * - stacked (<900px): lá thư trên, ảnh hơi đè mép dưới thư (kiểu polaroid
 *   xếp chồng), phong bì dưới cùng.
 * Vị trí tính theo tâm từng vật thể, đơn vị px theo viewport.
 */
export interface GreetingLayout {
  side: boolean;
  envW: number;
  envH: number;
  envCx: number;
  envCy: number;
  letterW: number;
  letterCx: number;
  letterCy: number;
  photoW: number;
  photoCx: number;
  photoCy: number;
}

export function computeLayout({ width: w, height: h }: ViewportSize): GreetingLayout {
  const side = w >= 900;

  const envW = side ? Math.min(w * 0.3, 380) : Math.min(w * 0.86, 360);
  const envH = envW * 0.66;
  const letterW = side ? 352 : Math.min(w * 0.84, 340);
  const photoW = side ? 232 : Math.min(w * 0.56, 240);
  // Ước lượng chiều cao để căn giữa vật thể trong phong bì / trên màn hình
  const letterH = letterW * 0.72;
  const photoH = (photoW - 20) * (4 / 3) + 56;

  if (side) {
    return {
      side,
      envW,
      envH,
      envCx: w / 2,
      envCy: h * 0.7,
      letterW,
      letterCx: w / 2 - 250,
      letterCy: h * 0.4,
      photoW,
      photoCx: w / 2 + 245,
      photoCy: h * 0.46,
    };
  }

  return {
    side,
    envW,
    envH,
    envCx: w / 2,
    envCy: Math.min(h * 0.78, h - envH / 2 - 70),
    letterW,
    letterCx: w / 2,
    letterCy: h * 0.25,
    photoW,
    photoCx: w / 2,
    photoCy: h * 0.49,
  };
}
