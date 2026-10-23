/**
 * garden-scene.ts — Vòng lặp cảnh khu vườn hướng dương trên một canvas.
 *
 * Chuyển thể logic scene từ garden.html (nguồn do người dùng cung cấp):
 *  - Thân hoa vẽ bằng bezier, gió "traveling breeze" uốn thân:
 *      wind = sin(t*0.00125 + x*4.5)*0.72 + sin(t*0.002 + phase)*0.28
 *    giữ nguyên công thức gốc; lá gắn trên đường cong thân tại tham số t.
 *  - Hoa "thở" (breath) = 1 + sin(t*0.0014 + phase)*0.008 — như bản gốc.
 *  - Pointer proximity: hoa nghiêng nhẹ theo con trỏ với smoothing
 *    1 - exp(-delta/140) — như bản gốc.
 *  - Mây được vẽ một lần vào canvas ẩn rồi drawImage; cánh hoa rơi, bụi vàng.
 *  - Tạm dừng rAF khi tab ẩn (visibilitychange) như bản gốc.
 *  - prefers-reduced-motion: render một frame tĩnh, không vòng lặp.
 */

import {
  createSeededRandom,
  createSunflowerSprite,
  drawSunflowerHead,
  drawSunflowerLeaf,
  easeOutCubic,
  softenSprite,
  SUNFLOWER_PALETTE,
  type SunflowerSprite,
} from "./sunflower-art";

const TAU = Math.PI * 2;
const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

export function heroRadiusFor(width: number, height: number): number {
  return Math.max(56, Math.min(102, Math.min(width, height) * 0.15));
}

export interface GardenSceneHandle {
  /** Bụi sáng vàng bung ra tại bông hoa (khi người dùng chạm hoa). */
  burst: () => void;
  /** Xung scale nhẹ tại bông hoa (phản hồi chạm). */
  pulse: () => void;
  /** Cập nhật lựa chọn giảm chuyển động tại chỗ (không cần tái tạo scene). */
  setReducedMotion: (value: boolean) => void;
  destroy: () => void;
}

interface BgFlower {
  x: number;
  y: number;
  radius: number;
  stem: number;
  bend: number;
  phase: number;
  rotation: number;
  delay: number;
  alpha: number;
  sprite: SunflowerSprite;
  offsetX: number;
  offsetY: number;
  hover: number;
}

interface Mote {
  x: number;
  y: number;
  phase: number;
  size: number;
  speed: number;
  alpha: number;
}

interface FallingPetal {
  x: number;
  y: number;
  phase: number;
  size: number;
  speed: number;
}

interface Spark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  size: number;
  color: string;
}

const SPARK_COLORS = ["#FFE9A8", "#F9C846", "#FFF3C4", "#FFDE7A"];

export function startGardenScene(
  canvas: HTMLCanvasElement,
  options: { reducedMotion: boolean },
): GardenSceneHandle {
  const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
  const rand = createSeededRandom(20102010);
  let reducedMotion = options.reducedMotion;

  let width = 0;
  let height = 0;
  let dpr = 1;
  let heroRadius = 80;
  let heroSprite: SunflowerSprite | null = null;
  let destroyed = false;
  let frame = 0;
  let lastFrame = 0;
  let sceneTime = 0;
  let heroPulse = 0;

  const pointer = { x: -4000, y: -4000 };
  const hero = {
    x: 0.5,
    y: 0.43,
    stem: 0.62,
    bend: 4,
    phase: 0,
    rotation: -0.04,
    offsetX: 0,
    offsetY: 0,
    hover: 0,
  };

  // ---- Bake hoa nền (4 bông, soft-focus như softenPetals của bản gốc) ----
  const bgSprites: SunflowerSprite[] = [11, 37, 53, 79].map((seed) => {
    const sprite = createSunflowerSprite({ radius: 46, seed });
    return sprite; // soften bên dưới sau khi có openCanvas
  });
  bgSprites.forEach((sprite) => {
    const softened = softenSprite(sprite, sprite.openCanvas);
    sprite.openCanvas = softened;
  });

  // ---- Cấu hình hoa nền: nhỏ, nhạt, sâu hơn so với hoa chính ----
  const bgFlowers: BgFlower[] = [
    { x: 0.13, y: 0.66, radius: 0.9, stem: 0.3, bend: -26, delay: 0.9, alpha: 0.55, sprite: 0 },
    { x: 0.87, y: 0.6, radius: 1.05, stem: 0.34, bend: 30, delay: 1.25, alpha: 0.62, sprite: 1 },
    { x: 0.24, y: 0.84, radius: 0.72, stem: 0.24, bend: 18, delay: 1.6, alpha: 0.7, sprite: 2 },
    { x: 0.78, y: 0.88, radius: 0.78, stem: 0.22, bend: -14, delay: 1.95, alpha: 0.72, sprite: 3 },
  ].map((raw, i) => ({
    ...raw,
    radius: 30 + raw.radius * 26,
    phase: rand() * TAU,
    rotation: (rand() - 0.5) * 0.24,
    sprite: bgSprites[raw.sprite] ?? bgSprites[i % bgSprites.length],
    offsetX: 0,
    offsetY: 0,
    hover: 0,
  })) as BgFlower[];

  // ---- Mây: bake 1 lần như cloudCanvas gốc, tông vàng ấm ----
  const cloudCanvas = document.createElement("canvas");
  cloudCanvas.width = 720;
  cloudCanvas.height = 360;
  {
    const cc = cloudCanvas.getContext("2d") as CanvasRenderingContext2D;
    const puffs: Array<[number, number, number, number]> = [
      [125, 164, 92, 0.5],
      [225, 143, 119, 0.64],
      [333, 112, 104, 0.78],
      [420, 141, 111, 0.72],
      [519, 163, 108, 0.58],
      [600, 174, 75, 0.4],
      [340, 183, 219, 0.28],
    ];
    puffs.forEach(([x, y, radius, opacity]) => {
      cc.save();
      cc.translate(x, y);
      cc.scale(1, 0.64);
      const puff = cc.createRadialGradient(0, -radius * 0.12, radius * 0.16, 0, 0, radius);
      puff.addColorStop(0, `rgba(255,248,230,${opacity})`);
      puff.addColorStop(0.48, `rgba(255,246,224,${opacity * 0.85})`);
      puff.addColorStop(0.8, `rgba(255,246,224,${opacity * 0.28})`);
      puff.addColorStop(1, "rgba(255,246,224,0)");
      cc.fillStyle = puff;
      cc.beginPath();
      cc.arc(0, 0, radius, 0, TAU);
      cc.fill();
      cc.restore();
    });
  }
  const clouds = [
    { x: 0.06, y: 0.16, size: 0.4, opacity: 0.8, speed: 2.6 },
    { x: 0.42, y: 0.08, size: 0.3, opacity: 0.62, speed: 3.7 },
    { x: 0.78, y: 0.2, size: 0.42, opacity: 0.74, speed: 2.1 },
  ];

  const motes: Mote[] = Array.from({ length: 16 }, () => ({
    x: rand(),
    y: rand(),
    phase: rand() * TAU,
    size: 1 + rand() * 2,
    speed: 6 + rand() * 10,
    alpha: 0.2 + rand() * 0.35,
  }));

  const fallingPetals: FallingPetal[] = Array.from({ length: 10 }, () => ({
    x: rand(),
    y: rand(),
    phase: rand() * TAU,
    size: 3 + rand() * 3.5,
    speed: 8 + rand() * 11,
  }));

  let sparks: Spark[] = [];

  // ---- Bake sprite hoa chính theo bán kính (rebake khi resize lớn) ----
  function bakeHeroSprite(): void {
    heroSprite = createSunflowerSprite({
      radius: heroRadius,
      seed: 2010,
      hasDewdrop: true,
    });
  }

  function resize(): void {
    const rect = canvas.getBoundingClientRect();
    width = rect.width;
    height = rect.height;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const nextRadius = heroRadiusFor(width, height);
    if (!heroSprite || Math.abs(nextRadius - heroRadius) > 6) {
      heroRadius = nextRadius;
      bakeHeroSprite();
    }
    renderOnce(performance.now());
  }

  function bezierPoint(
    t: number,
    p0: number,
    p1: number,
    p2: number,
    p3: number,
  ): number {
    const u = 1 - t;
    return (
      u * u * u * p0 +
      3 * u * u * t * p1 +
      3 * u * t * t * p2 +
      t * t * t * p3
    );
  }

  function drawStemAndHead(
    fx: number,
    fy: number,
    stemLen: number,
    bend: number,
    phase: number,
    rotation: number,
    growth: number,
    time: number,
    smoothing: number,
    isHero: boolean,
    hoverRef: { offsetX: number; offsetY: number; hover: number },
    sprite: SunflowerSprite,
  ): void {
    if (growth <= 0) return;
    const stemEase = easeOutCubic(clamp01(growth / 0.45));
    const headEase = clamp01((growth - 0.12) / 0.88);

    const x = fx * width;
    const targetY = fy * height;
    const root = Math.max(height * 1.05, targetY + stemLen * height);
    const y = root - (root - targetY) * stemEase;

    const wind = reducedMotion
      ? 0
      : Math.sin(time * 0.00125 + fx * 4.5) * 0.72 +
        Math.sin(time * 0.002 + phase) * 0.28;
    const lean = wind * (isHero ? 0.06 : 0.05);
    const sway = Math.sin(lean) * (root - y) * stemEase;
    const r = (isHero ? heroRadius : sprite.radius) * 1;

    let dx = 0;
    let dy = 0;
    if (isHero && !reducedMotion) {
      dx = x - pointer.x;
      dy = y - pointer.y;
      const distance = Math.hypot(dx, dy);
      const proximity = clamp01(1 - distance / (r * 2.6));
      hoverRef.offsetX +=
        ((dx / (distance || 1)) * proximity * r * 0.1 - hoverRef.offsetX) *
        smoothing;
      hoverRef.offsetY +=
        ((dy / (distance || 1)) * proximity * r * 0.06 - hoverRef.offsetY) *
        smoothing;
      hoverRef.hover += (proximity - hoverRef.hover) * smoothing;
    }

    const headX = x + sway + hoverRef.offsetX;
    const headY = y + (1 - Math.cos(lean)) * (root - y) + hoverRef.offsetY;
    const baseX = x + bend;
    const c1x = x - bend + sway * 0.15;
    const c1y = root - (root - headY) * 0.4;
    const c2x = headX + 8 + sway * 0.12;
    const c2y = headY + (root - headY) * 0.22;

    ctx.save();
    ctx.globalAlpha *= isHero ? 1 : clamp01(growth * 3) * 0.9;

    // Thân
    const stemColor = ctx.createLinearGradient(baseX - 2, root, headX + 2, headY);
    stemColor.addColorStop(0, SUNFLOWER_PALETTE.stemDeep);
    stemColor.addColorStop(0.5, SUNFLOWER_PALETTE.stemMid);
    stemColor.addColorStop(1, SUNFLOWER_PALETTE.stemLight);
    ctx.strokeStyle = stemColor;
    ctx.lineWidth = isHero ? Math.max(2.4, r * 0.035) : Math.max(1.4, r * 0.045);
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(baseX, root);
    ctx.bezierCurveTo(c1x, c1y, c2x, c2y, headX, headY);
    ctx.stroke();

    // Lá gắn trên đường cong thân
    if (growth > 0.25) {
      const leafLen = r * (isHero ? 0.92 : 0.8) * stemEase;
      [0.4, 0.66].forEach((t, i) => {
        const lx = bezierPoint(t, baseX, c1x, c2x, headX);
        const ly = bezierPoint(t, root, c1y, c2y, headY);
        const flutter = reducedMotion ? 0 : wind * 0.085;
        const dir = i === 0 ? 1 : -1;
        const angle = dir === 1 ? -0.52 + flutter : Math.PI + 0.52 - flutter;
        drawSunflowerLeaf(ctx, lx, ly, angle, leafLen * (i ? 0.86 : 1), leafLen * 0.34);
        if (isHero) {
          const angle2 = dir === 1 ? -0.9 + flutter * 1.2 : Math.PI + 0.9 - flutter * 1.2;
          drawSunflowerLeaf(
            ctx,
            lx + dir * 6,
            ly - r * 0.1,
            angle2,
            leafLen * 0.5,
            leafLen * 0.2,
          );
        }
      });
    }

    // Đầu hoa
    const breath = reducedMotion ? 1 : 1 + Math.sin(time * 0.0014 + phase) * 0.008;
    const pulseScale = 1 + heroPulse * 0.08;
    drawSunflowerHead(ctx, sprite, headX, headY, headEase, {
      rotation: rotation + wind * 0.095 + hoverRef.offsetX * 0.003,
      breath: breath * pulseScale,
      tilt: 0.97,
      alpha: isHero ? 1 : 1,
    });

    ctx.restore();
  }

  function drawClouds(time: number): void {
    ctx.save();
    clouds.forEach((cloud) => {
      const cloudWidth = Math.max(240, width * cloud.size);
      const travel = width + cloudWidth * 2;
      const x =
        ((cloud.x * width + time * cloud.speed * 0.001 + cloudWidth) % travel) -
        cloudWidth;
      const y = height * cloud.y;
      ctx.globalAlpha = cloud.opacity;
      ctx.drawImage(
        cloudCanvas,
        x - cloudWidth * 0.5,
        y - cloudWidth * 0.18,
        cloudWidth,
        (cloudWidth * cloudCanvas.height) / cloudCanvas.width,
      );
    });
    ctx.restore();
  }

  function drawGlow(time: number): void {
    const hx = hero.x * width;
    const hy = hero.y * height;
    const radius = heroRadius * (2.5 + heroPulse * 0.8);
    const alpha = reducedMotion
      ? 0.12
      : 0.1 + 0.04 * Math.sin(time * 0.0011) + heroPulse * 0.28;
    const glow = ctx.createRadialGradient(hx, hy, heroRadius * 0.2, hx, hy, radius);
    glow.addColorStop(0, `rgba(255, 208, 110, ${alpha})`);
    glow.addColorStop(0.55, `rgba(255, 214, 130, ${alpha * 0.45})`);
    glow.addColorStop(1, "rgba(255, 214, 130, 0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(hx, hy, radius, 0, TAU);
    ctx.fill();
  }

  function drawMotes(time: number, elapsed: number): void {
    ctx.save();
    motes.forEach((mote) => {
      const drift = reducedMotion ? 0 : (time * mote.speed * 0.001) % (height + 40);
      const y = reducedMotion
        ? mote.y * height
        : (mote.y * height - drift + height + 40) % (height + 40) - 20;
      const x =
        mote.x * width +
        Math.sin(time * 0.0006 + mote.phase) * 22;
      const twinkle = 0.55 + 0.45 * Math.sin(time * 0.0016 + mote.phase);
      ctx.globalAlpha =
        mote.alpha * twinkle * clamp01(elapsed / 2) * (reducedMotion ? 0.7 : 1);
      ctx.fillStyle = "#FFE9A8";
      ctx.beginPath();
      ctx.arc(x, y, mote.size, 0, TAU);
      ctx.fill();
    });
    ctx.restore();
  }

  function drawFallingPetals(time: number, elapsed: number): void {
    ctx.save();
    fallingPetals.forEach((petal) => {
      const x =
        ((petal.x * width + time * 0.008 + Math.sin(time * 0.0006 + petal.phase) * 30) %
          (width + 60)) -
        30;
      const y =
        ((petal.y * height + time * petal.speed * 0.001) % (height + 60)) - 30;
      ctx.globalAlpha = clamp01(elapsed / 3) * 0.4;
      ctx.translate(x, y);
      ctx.rotate(petal.phase + time * 0.0007);
      ctx.scale(
        0.55 + Math.abs(Math.sin(time * 0.001 + petal.phase)) * 0.45,
        1,
      );
      const color = ctx.createLinearGradient(0, -petal.size, 0, petal.size);
      color.addColorStop(0, "#FFF3C4");
      color.addColorStop(1, "#E8A93A");
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(0, -petal.size);
      ctx.bezierCurveTo(
        petal.size * 1.3,
        -petal.size,
        petal.size * 0.8,
        petal.size * 0.8,
        0,
        petal.size,
      );
      ctx.bezierCurveTo(
        -petal.size,
        petal.size * 0.2,
        -petal.size * 0.6,
        -petal.size * 0.9,
        0,
        -petal.size,
      );
      ctx.fill();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    });
    ctx.restore();
  }

  function drawSparks(): void {
    if (sparks.length === 0) return;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    sparks = sparks.filter((spark) => spark.life > 0);
    sparks.forEach((spark) => {
      spark.x += spark.vx;
      spark.y += spark.vy;
      spark.vx *= 0.985;
      spark.vy = spark.vy * 0.985 - 0.02;
      spark.life -= 0.016;
      ctx.globalAlpha = clamp01(spark.life);
      ctx.fillStyle = spark.color;
      ctx.beginPath();
      ctx.arc(spark.x, spark.y, spark.size * spark.life, 0, TAU);
      ctx.fill();
    });
    ctx.restore();
  }

  function draw(time: number): void {
    const delta = lastFrame ? Math.min(50, time - lastFrame) : 16.67;
    lastFrame = time;
    if (!reducedMotion) sceneTime += delta;
    const smoothing = reducedMotion ? 1 : 1 - Math.exp(-delta / 140);

    ctx.clearRect(0, 0, width, height);
    drawClouds(sceneTime);

    const elapsed = sceneTime / 1000;
    const heroGrowth = reducedMotion ? 1 : clamp01(elapsed / 2.2);

    drawGlow(time);
    drawStemAndHead(
      hero.x,
      hero.y,
      hero.stem,
      hero.bend,
      hero.phase,
      hero.rotation,
      heroGrowth,
      sceneTime,
      smoothing,
      true,
      hero,
      heroSprite as SunflowerSprite,
    );

    bgFlowers.forEach((flower) => {
      const growth = reducedMotion ? 1 : clamp01((elapsed - flower.delay) / 1.9);
      drawStemAndHead(
        flower.x,
        flower.y,
        flower.stem,
        flower.bend,
        flower.phase,
        flower.rotation,
        growth,
        sceneTime,
        smoothing,
        false,
        flower,
        flower.sprite,
      );
    });

    drawMotes(sceneTime, elapsed);
    if (!reducedMotion) drawFallingPetals(sceneTime, elapsed);
    drawSparks();

    heroPulse *= 0.94;

    const still = reducedMotion && sparks.length === 0;
    if (!destroyed && !still && !document.hidden) {
      frame = requestAnimationFrame(draw);
    } else {
      lastFrame = 0;
    }
  }

  function renderOnce(time: number): void {
    if (destroyed) return;
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(draw);
    void time;
  }

  // ---- Sự kiện ----
  const onPointerMove = (event: PointerEvent): void => {
    if (event.pointerType !== "mouse" || reducedMotion) return;
    const rect = canvas.getBoundingClientRect();
    pointer.x = event.clientX - rect.left;
    pointer.y = event.clientY - rect.top;
    if (!frame && !document.hidden) renderOnce(performance.now());
  };
  const onPointerLeave = (): void => {
    pointer.x = -4000;
    pointer.y = -4000;
  };
  const onVisibility = (): void => {
    if (document.hidden) {
      cancelAnimationFrame(frame);
      frame = 0;
      lastFrame = 0;
    } else {
      renderOnce(performance.now());
    }
  };
  const onMotionChange = (): void => {
    renderOnce(performance.now());
  };

  window.addEventListener("pointermove", onPointerMove, { passive: true });
  window.addEventListener("pointerleave", onPointerLeave);
  document.addEventListener("visibilitychange", onVisibility);

  const resizeObserver = new ResizeObserver(() => resize());
  resizeObserver.observe(canvas);
  resize();

  return {
    burst(): void {
      if (!heroSprite || reducedMotion) return;
      const hx = hero.x * width;
      const hy = hero.y * height;
      for (let i = 0; i < 26; i++) {
        const angle = rand() * TAU;
        const speed = 1.4 + rand() * 2.6;
        sparks.push({
          x: hx + Math.cos(angle) * heroRadius * 0.3,
          y: hy + Math.sin(angle) * heroRadius * 0.3,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 0.6,
          life: 0.7 + rand() * 0.5,
          size: 1.4 + rand() * 2.2,
          color: SPARK_COLORS[Math.floor(rand() * SPARK_COLORS.length)],
        });
      }
      heroPulse = 1;
      renderOnce(performance.now());
    },
    pulse(): void {
      if (reducedMotion) return;
      heroPulse = 1;
      renderOnce(performance.now());
    },
    setReducedMotion(value: boolean): void {
      reducedMotion = value;
      renderOnce(performance.now());
    },
    destroy(): void {
      destroyed = true;
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerleave", onPointerLeave);
      document.removeEventListener("visibilitychange", onVisibility);
    },
  };
}
