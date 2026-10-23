"use client";

import { useEffect, useMemo } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";
import { createSeededRandom } from "@/lib/sunflower-art";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

/**
 * BackgroundEffects — hiệu ứng nền cho giai đoạn phong bì/thư:
 *  - Ánh vàng ấm "thở" ở trung tâm.
 *  - ~14 hạt bụi sáng trôi chậm (deterministic bằng seeded random để
 *    không lệch hydration giữa server/client).
 *  - Parallax rất nhẹ theo chuột trên desktop (transform-only, bỏ qua
 *    trên thiết bị cảm ứng và khi giảm chuyển động).
 */
export default function BackgroundEffects() {
  const reducedMotion = usePrefersReducedMotion();
  const parallaxX = useMotionValue(0);
  const parallaxY = useMotionValue(0);
  const springX = useSpring(parallaxX, { stiffness: 40, damping: 18 });
  const springY = useSpring(parallaxY, { stiffness: 40, damping: 18 });

  const motes = useMemo(() => {
    const rand = createSeededRandom(20201020);
    return Array.from({ length: 14 }, (_, i) => ({
      id: i,
      left: 4 + rand() * 92,
      size: 3.5 + rand() * 5.5,
      duration: 11 + rand() * 9,
      delay: -rand() * 14,
      driftX: (rand() - 0.5) * 90,
      alpha: 0.25 + rand() * 0.35,
    }));
  }, []);

  useEffect(() => {
    if (reducedMotion) return;
    const fine = window.matchMedia("(pointer: fine)");
    if (!fine.matches) return;

    const onMove = (event: PointerEvent) => {
      const nx = event.clientX / window.innerWidth - 0.5;
      const ny = event.clientY / window.innerHeight - 0.5;
      parallaxX.set(nx * 18);
      parallaxY.set(ny * 14);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [parallaxX, parallaxY, reducedMotion]);

  return (
    <motion.div
      className="parallax-layer"
      style={{ x: springX, y: springY }}
      aria-hidden="true"
    >
      <div className="stage-sun-glow" />
      {motes.map((mote) => (
        <span
          key={mote.id}
          className="mote-dot"
          style={{
            left: `${mote.left}%`,
            width: `${mote.size}px`,
            height: `${mote.size}px`,
            ["--mote-dur" as string]: `${mote.duration}s`,
            ["--mote-delay" as string]: `${mote.delay}s`,
            ["--mote-x" as string]: `${mote.driftX}px`,
            ["--mote-alpha" as string]: `${mote.alpha}`,
          }}
        />
      ))}
    </motion.div>
  );
}
