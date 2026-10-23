/**
 * sunflower-art.ts — Engine vẽ hoa hướng dương thủ công trên Canvas.
 *
 * Chuyển thể từ kỹ thuật trong mã nguồn tham khảo (garden-botany.js /
 * garden.html — IdeaToCodee/flowers-20-10, được người dùng cung cấp trực tiếp):
 *  - createSeededRandom: LCG seeded random (s * 16807 % 2147483647) — giữ nguyên.
 *  - Cánh hoa vẽ bằng polar coordinates + bezier, gradient "subsurface scattering"
 *    và bóng ambient-occlusion giống drawCuppedPetal gốc.
 *  - Hoa được pre-render thành nhiều lớp canvas độ phân giải cao (DPR ≤ 2.2)
 *    để unfurl từng lớp khi nở và drawImage 1 lần khi nở hết (openCanvas).
 *  - Nhụy hoa dùng xoắn góc vàng (2.39996 rad) — giống xoắn lõi hoa hồng gốc,
 *    trùng khớp với quy luật phyllotaxis thật của hoa hướng dương.
 *  - Giọt sương (dewdrop) tái sử dụng gần như nguyên văn từ bản gốc.
 *  - Lá gân giữa + gân phụ theo drawBotanicalLeaf gốc, chuyển thành dạng lá
 *    hướng dương rộng.
 *
 * Hình học cánh/tâm được thiết kế lại theo đặc trưng hoa hướng dương:
 * cánh tia (ray petals) nhọn mảnh xếp 2 vòng, đĩa hạt nâu sẫm.
 */

export function createSeededRandom(seed = 1): () => number {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return function () {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export function rgbaStr(hex: string, alpha = 1): string {
  const clean = hex.replace("#", "");
  const num = parseInt(clean, 16);
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/** Bảng màu hoa hướng dương — bám theo palette yêu cầu (#F9C846, #FFE9A8, #4E7B42, #65483A…) */
export const SUNFLOWER_PALETTE = {
  backBase: "#C77F26",
  backMid: "#E8A93A",
  backTip: "#F2C25E",
  frontBase: "#D98F2E",
  frontMid: "#F9C846",
  frontHigh: "#FFDE7A",
  frontTip: "#FFF0B8",
  lip: "#FFF3C4",
  crevice: "rgba(101, 72, 58, 0.30)",
  discCore: "#382517",
  discMid: "#65483A",
  discEdge: "#7A5A38",
  seedDark: "#2E1E12",
  seedLight: "#8A6A45",
  rimPollen: "#E8A93A",
  rimPollenLight: "#F6CE6B",
  sepalDeep: "#35602F",
  sepalMid: "#4E7B42",
  sepalLight: "#6E9A55",
  stemDeep: "#3F6B35",
  stemMid: "#587B42",
  stemLight: "#6E9A55",
} as const;

const TAU = Math.PI * 2;
const clamp01 = (n: number) => Math.max(0, Math.min(1, n));
export const easeOutCubic = (n: number) => 1 - Math.pow(1 - clamp01(n), 3);

export interface SunflowerSprite {
  /** [0] đài hoa xanh, [1] vòng cánh sau, [2] vòng cánh trước, [3] đĩa hạt */
  layers: HTMLCanvasElement[];
  logicalSize: number;
  radius: number;
  openCanvas: HTMLCanvasElement;
}

interface SpriteConfig {
  radius: number;
  seed?: number;
  hasDewdrop?: boolean;
}

interface Layer {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
}

function createLayerCanvas(logicalSize: number): Layer {
  const dpr = Math.min(
    typeof window !== "undefined" ? window.devicePixelRatio || 2 : 2,
    2.2,
  );
  const canvas = document.createElement("canvas");
  canvas.width = Math.ceil(logicalSize * dpr);
  canvas.height = Math.ceil(logicalSize * dpr);
  const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
  ctx.scale(dpr, dpr);
  return { canvas, ctx };
}

/**
 * Vẽ một cánh tia nhọn (ray petal) bằng tọa độ cực quanh tâm (cx, cy) —
 * cùng cách tiếp cận drawCuppedPetal của bản gốc: gradient dọc cánh,
 * bóng AO đổ sang phía sau, viền sáng mỏng ở mép cánh.
 */
function drawRayPetal(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  angle: number,
  innerR: number,
  length: number,
  width: number,
  stops: Array<[number, string]>,
  lip: string,
  lipAlpha: number,
): void {
  const polar = (a: number, r: number): [number, number] => [
    cx + Math.cos(a) * r,
    cy + Math.sin(a) * r,
  ];
  // spread = nửa bề rộng cánh quy đổi sang radian tại khoảng cách vai cánh
  const midR = innerR + length * 0.45;
  const spread = Math.atan2(width * 0.5, midR) * 2.2;

  const [blx, bly] = polar(angle - 0.24, innerR);
  const [brx, bry] = polar(angle + 0.24, innerR);
  const [slx, sly] = polar(angle - spread * 0.52, midR);
  const [srx, sry] = polar(angle + spread * 0.52, midR);
  const [tlx, tly] = polar(angle - spread * 0.2, innerR + length * 0.9);
  const [trx, try_] = polar(angle + spread * 0.2, innerR + length * 0.9);
  const [tipX, tipY] = polar(angle, innerR + length);

  ctx.save();

  ctx.beginPath();
  ctx.moveTo(blx, bly);
  // mép trái phồng ra ngoài
  ctx.quadraticCurveTo(
    ...polar(angle - spread * 0.95, innerR + length * 0.16),
    slx,
    sly,
  );
  // vai trái → gần chóp
  ctx.bezierCurveTo(
    ...polar(angle - spread * 0.42, innerR + length * 0.78),
    tlx,
    tly,
    tipX,
    tipY,
  );
  // chóp nhọn → vai phải
  ctx.bezierCurveTo(
    trx,
    try_,
    ...polar(angle + spread * 0.42, innerR + length * 0.78),
    srx,
    sry,
  );
  // mép phải về gốc cánh
  ctx.quadraticCurveTo(
    ...polar(angle + spread * 0.95, innerR + length * 0.16),
    brx,
    bry,
  );
  // đáy cánh cong nhẹ quanh đĩa
  ctx.quadraticCurveTo(...polar(angle, innerR - width * 0.3), blx, bly);
  ctx.closePath();

  // Bóng ambient-occlusion của cánh này đổ lên lớp dưới (device-space offsets)
  ctx.shadowColor = SUNFLOWER_PALETTE.crevice;
  ctx.shadowBlur = Math.max(3, length * 0.14);
  ctx.shadowOffsetX = Math.cos(angle) * 1.6;
  ctx.shadowOffsetY = Math.sin(angle) * 1.6 + 1.4;

  const [gx0, gy0] = polar(angle, innerR);
  const [gx1, gy1] = polar(angle, innerR + length);
  const grad = ctx.createLinearGradient(gx0, gy0, gx1, gy1);
  stops.forEach(([offset, color]) => grad.addColorStop(offset, color));
  ctx.fillStyle = grad;
  ctx.fill();

  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;

  // Viền sáng mỏng dọc một bên cánh — cánh hứng ánh sáng
  ctx.beginPath();
  ctx.moveTo(slx, sly);
  ctx.bezierCurveTo(
    ...polar(angle - spread * 0.42, innerR + length * 0.78),
    tlx,
    tly,
    tipX,
    tipY,
  );
  ctx.strokeStyle = rgbaStr(lip, lipAlpha);
  ctx.lineWidth = 1.1;
  ctx.lineCap = "round";
  ctx.stroke();

  ctx.restore();
}

/** Đài hoa xanh (sepals) chĩa ra sau cánh — vẽ xuống lớp nền. */
function drawSepals(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  rand: () => number,
): void {
  const count = 7;
  for (let i = 0; i < count; i++) {
    // chĩa đều quanh tâm, hơi cụp xuống dưới cho tự nhiên
    const angle =
      (i / count) * TAU + (rand() - 0.5) * 0.3 + Math.PI * 0.06;
    const len = radius * (0.5 + rand() * 0.12);
    const w = radius * 0.13;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);
    const grad = ctx.createLinearGradient(0, 0, len, 0);
    grad.addColorStop(0, SUNFLOWER_PALETTE.sepalDeep);
    grad.addColorStop(0.6, SUNFLOWER_PALETTE.sepalMid);
    grad.addColorStop(1, SUNFLOWER_PALETTE.sepalLight);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(0, -w * 0.35);
    ctx.quadraticCurveTo(len * 0.55, -w * 0.62, len, 0);
    ctx.quadraticCurveTo(len * 0.55, w * 0.62, 0, w * 0.35);
    ctx.quadraticCurveTo(w * 0.6, 0, 0, -w * 0.35);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
}

/**
 * Đĩa hạt hướng dương: gradient nâu sẫm, vành phấn vàng (hoa chưa nở),
 * xoắn hạt theo góc vàng 2.39996 — quy luật phyllotaxis thật,
 * kế thừa xoắn lõi 2.39996 của hoa hồng trong mã nguồn gốc.
 */
function drawSeedDisc(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  discR: number,
  rand: () => number,
): void {
  ctx.save();

  // Thân đĩa
  const body = ctx.createRadialGradient(
    cx - discR * 0.18,
    cy - discR * 0.22,
    discR * 0.1,
    cx,
    cy,
    discR,
  );
  body.addColorStop(0, SUNFLOWER_PALETTE.discEdge);
  body.addColorStop(0.45, SUNFLOWER_PALETTE.discMid);
  body.addColorStop(1, SUNFLOWER_PALETTE.discCore);
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.ellipse(cx, cy, discR, discR * 0.97, 0, 0, TAU);
  ctx.fill();

  // Vành phấn vàng — các nụ chưa nở ở rìa đĩa
  const rimCount = 26;
  for (let i = 0; i < rimCount; i++) {
    const a = (i / rimCount) * TAU + rand() * 0.1;
    const rr = discR * (0.9 + rand() * 0.06);
    const x = cx + Math.cos(a) * rr;
    const y = cy + Math.sin(a) * rr * 0.97;
    const s = discR * (0.07 + rand() * 0.035);
    const g = ctx.createRadialGradient(x, y, 0, x, y, s);
    g.addColorStop(0, SUNFLOWER_PALETTE.rimPollenLight);
    g.addColorStop(0.6, SUNFLOWER_PALETTE.rimPollen);
    g.addColorStop(1, rgbaStr(SUNFLOWER_PALETTE.discMid, 0.9));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, s, 0, TAU);
    ctx.fill();
  }

  // Xoắn hạt golden-angle
  const n = Math.round(clamp01(discR / 34) * 70 + 70); // ~70–140 hạt
  for (let i = 0; i < n; i++) {
    const t = i / n;
    const rr = discR * 0.86 * Math.sqrt(t);
    const a = i * 2.39996 + rand() * 0.05;
    const x = cx + Math.cos(a) * rr;
    const y = cy + Math.sin(a) * rr * 0.97;
    const s = discR * (0.045 + rand() * 0.028) * (0.75 + t * 0.45);

    const inner = t < 0.82 ? SUNFLOWER_PALETTE.discMid : SUNFLOWER_PALETTE.discEdge;
    const g = ctx.createRadialGradient(x - s * 0.3, y - s * 0.3, 0, x, y, s);
    g.addColorStop(0, SUNFLOWER_PALETTE.seedLight);
    g.addColorStop(0.4, inner);
    g.addColorStop(1, SUNFLOWER_PALETTE.seedDark);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(x, y, s, s * 0.85, a * 0.4, 0, TAU);
    ctx.fill();

    // Chấm sáng nhỏ — hạt bắt ánh sáng
    ctx.fillStyle = rgbaStr("#FFE9A8", 0.16 + rand() * 0.12);
    ctx.beginPath();
    ctx.arc(x - s * 0.28, y - s * 0.3, s * 0.22, 0, TAU);
    ctx.fill();
  }

  // Ánh đèn viền trên-trái cho đĩa có khối
  ctx.beginPath();
  ctx.arc(cx, cy, discR * 0.94, Math.PI * 0.95, Math.PI * 1.55);
  ctx.strokeStyle = rgbaStr(SUNFLOWER_PALETTE.rimPollenLight, 0.28);
  ctx.lineWidth = discR * 0.06;
  ctx.lineCap = "round";
  ctx.stroke();

  ctx.restore();
}

/** Giọt sương trên cánh — tái sử dụng công thức dewdrop của bản gốc. */
function drawDewdrop(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  rand: () => number,
): void {
  const angle = rand() * TAU;
  const dist = radius * (0.6 + rand() * 0.22);
  const dx = cx + Math.cos(angle) * dist;
  const dy = cy + Math.sin(angle) * dist;
  const dr = 2.6 + rand() * 1.6;

  ctx.save();
  ctx.fillStyle = "rgba(120, 80, 20, 0.28)";
  ctx.beginPath();
  ctx.ellipse(dx + 1, dy + 1.6, dr, dr * 0.82, 0.2, 0, TAU);
  ctx.fill();

  const grad = ctx.createRadialGradient(
    dx - dr * 0.3,
    dy - dr * 0.3,
    0.5,
    dx,
    dy,
    dr,
  );
  grad.addColorStop(0, "rgba(255, 255, 255, 0.96)");
  grad.addColorStop(0.45, "rgba(255, 240, 200, 0.55)");
  grad.addColorStop(0.85, "rgba(246, 206, 107, 0.35)");
  grad.addColorStop(1, "rgba(255, 255, 255, 0.78)");
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.ellipse(dx, dy, dr, dr * 0.85, -0.2, 0, TAU);
  ctx.fill();

  ctx.fillStyle = "#FFFFFF";
  ctx.beginPath();
  ctx.arc(dx - dr * 0.35, dy - dr * 0.35, dr * 0.28, 0, TAU);
  ctx.fill();
  ctx.restore();
}

/**
 * Pre-render một bông hướng dương thành 4 lớp canvas độ phân giải cao:
 *  [0] đài xanh   [1] vòng cánh sau   [2] vòng cánh trước   [3] đĩa hạt
 * Đồng thời ghép sẵn openCanvas cho trạng thái nở hết (mỗi frame chỉ 1 drawImage).
 */
export function createSunflowerSprite(config: SpriteConfig): SunflowerSprite {
  const { radius, seed = 2010, hasDewdrop = false } = config;
  const rand = createSeededRandom(seed);
  const logicalSize = Math.ceil(radius * 2.42);
  const cx = logicalSize / 2;
  const cy = logicalSize / 2;

  const sepalLayer = createLayerCanvas(logicalSize);
  const backLayer = createLayerCanvas(logicalSize);
  const frontLayer = createLayerCanvas(logicalSize);
  const discLayer = createLayerCanvas(logicalSize);

  const discR = radius * 0.42;

  // Lớp 0 — đài xanh
  drawSepals(sepalLayer.ctx, cx, cy, radius, rand);

  // Lớp 1 — vòng cánh sau (sẫm hơn, lệch nửa bước so với vòng trước)
  const backStops: Array<[number, string]> = [
    [0, SUNFLOWER_PALETTE.backBase],
    [0.5, SUNFLOWER_PALETTE.backMid],
    [1, SUNFLOWER_PALETTE.backTip],
  ];
  const backCount = 16;
  for (let i = 0; i < backCount; i++) {
    const angle =
      (i / backCount) * TAU + Math.PI / backCount + (rand() - 0.5) * 0.06;
    drawRayPetal(
      backLayer.ctx,
      cx,
      cy,
      angle,
      radius * 0.3,
      radius * (0.6 + rand() * 0.06),
      radius * (0.28 + rand() * 0.05),
      backStops,
      SUNFLOWER_PALETTE.backTip,
      0.5,
    );
  }

  // Lớp 2 — vòng cánh trước (vàng rực, có viền sáng)
  const frontStops: Array<[number, string]> = [
    [0, SUNFLOWER_PALETTE.frontBase],
    [0.35, SUNFLOWER_PALETTE.frontMid],
    [0.75, SUNFLOWER_PALETTE.frontHigh],
    [1, SUNFLOWER_PALETTE.frontTip],
  ];
  const frontCount = 16;
  for (let i = 0; i < frontCount; i++) {
    const angle = (i / frontCount) * TAU + (rand() - 0.5) * 0.07;
    drawRayPetal(
      frontLayer.ctx,
      cx,
      cy,
      angle,
      radius * 0.32,
      radius * (0.66 + rand() * 0.08),
      radius * (0.31 + rand() * 0.06),
      frontStops,
      SUNFLOWER_PALETTE.lip,
      0.75,
    );
  }
  if (hasDewdrop) drawDewdrop(frontLayer.ctx, cx, cy, radius, rand);

  // Lớp 3 — đĩa hạt
  drawSeedDisc(discLayer.ctx, cx, cy, discR, rand);

  const layers = [sepalLayer, backLayer, frontLayer, discLayer].map(
    (l) => l.canvas,
  );

  const openCanvas = document.createElement("canvas");
  openCanvas.width = layers[0].width;
  openCanvas.height = layers[0].height;
  const oCtx = openCanvas.getContext("2d") as CanvasRenderingContext2D;
  layers.forEach((layer) => oCtx.drawImage(layer, 0, 0));

  return { layers, logicalSize, radius, openCanvas };
}

/**
 * Bake soft-focus cho hoa nền (giữ nguyên công thức softenPetals của
 * garden.html: phủ 2 lần chính sprite với blur/brightness khác nhau).
 */
export function softenSprite(
  sprite: SunflowerSprite,
  composited: HTMLCanvasElement,
): HTMLCanvasElement {
  const image = document.createElement("canvas");
  image.width = composited.width;
  image.height = composited.height;
  const c = image.getContext("2d") as CanvasRenderingContext2D;
  const pixelRatio = composited.width / sprite.logicalSize;
  c.globalAlpha = 0.3;
  c.filter = `blur(${1.6 * pixelRatio}px) brightness(1.32)`;
  c.drawImage(composited, 0, 0);
  c.globalAlpha = 1;
  c.filter = `blur(${0.35 * pixelRatio}px) brightness(1.05)`;
  c.drawImage(composited, 0, 0);
  return image;
}

/**
 * Vẽ đầu hoa ở trạng thái nở dần (growth 0→1): từng lớp scale + xoay mở ra
 * theo delay khác nhau — cùng cơ chế whorl unfurl của bản gốc
 * (whorlDelays / closedScales / twistAngles).
 */
export function drawSunflowerHead(
  ctx: CanvasRenderingContext2D,
  sprite: SunflowerSprite,
  x: number,
  y: number,
  growth: number,
  opts: { rotation?: number; breath?: number; tilt?: number; alpha?: number } = {},
): void {
  if (growth <= 0) return;
  const { rotation = 0, breath = 1, tilt = 0.96, alpha = 1 } = opts;
  const size = sprite.logicalSize;

  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.translate(x, y);
  ctx.rotate(rotation);
  ctx.scale(breath, breath * tilt);

  if (growth >= 1) {
    ctx.drawImage(sprite.openCanvas, -size / 2, -size / 2, size, size);
    ctx.restore();
    return;
  }

  // [delay, closedScale, twist]
  const plan: Array<[number, number, number]> = [
    [0.0, 0.5, -0.25], // đài xanh mở trước
    [0.12, 0.32, -0.7], // vòng cánh sau
    [0.3, 0.36, 0.9], // vòng cánh trước
    [0.5, 0.55, 0.3], // đĩa hạt
  ];
  plan.forEach(([delay, closedScale, twist], i) => {
    const open = easeOutCubic((growth - delay) / (1 - delay));
    if (open <= 0) return;
    const scale = closedScale + (1 - closedScale) * open;
    ctx.save();
    ctx.globalAlpha *= i === 3 ? open : 1;
    ctx.rotate((1 - open) * twist);
    ctx.scale(scale, scale * (0.82 + open * 0.18));
    ctx.drawImage(
      sprite.layers[i],
      -size / 2,
      -size / 2,
      size,
      size,
    );
    ctx.restore();
  });

  ctx.restore();
}

/**
 * Lá hướng dương rộng hình trứng với gân giữa + gân phụ — chuyển thể
 * từ drawBotanicalLeaf của bản gốc.
 */
export function drawSunflowerLeaf(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  angle: number,
  length: number,
  width: number,
): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);

  ctx.shadowColor = "rgba(35, 45, 38, 0.22)";
  ctx.shadowBlur = 10;
  ctx.shadowOffsetY = 4;

  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.bezierCurveTo(length * 0.28, -width, length * 0.74, -width * 0.82, length, -width * 0.06);
  ctx.bezierCurveTo(length * 0.72, width * 0.86, length * 0.26, width * 1.02, 0, width * 0.1);
  ctx.closePath();

  const grad = ctx.createLinearGradient(0, -width * 0.6, length, width * 0.6);
  grad.addColorStop(0, SUNFLOWER_PALETTE.sepalDeep);
  grad.addColorStop(0.55, SUNFLOWER_PALETTE.sepalMid);
  grad.addColorStop(1, SUNFLOWER_PALETTE.sepalLight);
  ctx.fillStyle = grad;
  ctx.fill();

  ctx.shadowColor = "transparent";
  ctx.beginPath();
  ctx.moveTo(2, 0);
  ctx.quadraticCurveTo(length * 0.5, -1, length * 0.9, -width * 0.05);
  ctx.strokeStyle = "rgba(185, 215, 175, 0.4)";
  ctx.lineWidth = 1.1;
  ctx.stroke();

  for (let v = 1; v <= 4; v++) {
    const vx = length * v * 0.18;
    const vw = width * (1 - Math.abs(v * 0.18 - 0.45)) * 0.62;
    ctx.beginPath();
    ctx.moveTo(vx, 0);
    ctx.quadraticCurveTo(vx + 6, -vw * 0.5, vx + 12, -vw * 0.8);
    ctx.moveTo(vx, 0);
    ctx.quadraticCurveTo(vx + 6, vw * 0.5, vx + 12, vw * 0.8);
    ctx.lineWidth = 0.7;
    ctx.stroke();
  }

  ctx.restore();
}
