# 🌻 Cả một vườn thương · 20/10

Website trải nghiệm tương tác chúc mừng ngày Phụ nữ Việt Nam 20/10 — phong cách
botanical romantic, cinematic. Người dùng chạm vào **bông hoa hướng dương** để
đánh thức khu vườn, mở **phong bì thư**, đẩy **lá thư và bức ảnh** ra khỏi phong bì,
rồi phóng to từng vật thể để đọc và ngắm.

> Hiệu ứng hoa chuyển thể từ kỹ thuật vẽ canvas botanical trong mã nguồn tham khảo
> `garden.html` + `garden-botany.js` (repo `IdeaToCodee/flowers-20-10`, do người dùng
> cung cấp trực tiếp; repo không kèm file LICENSE). Kỹ thuật giữ nguyên: seeded random
> LCG, cánh hoa gradient + bóng ambient-occlusion, unfurl từng lớp, gió uốn thân bezier,
> xoắn hạt góc vàng 2.39996, bake soft-focus, `prefers-reduced-motion`.

---

## 1. Công nghệ

| Thư viện | Vai trò |
| --- | --- |
| **React 19 + TypeScript 5** | Component architecture, kiểm soát kiểu chặt |
| **Next.js 16 (App Router)** | Khung ứng dụng & dev server của môi trường sandbox (thay cho Vite — mọi component đều là React thuần, port sang Vite chỉ cần đổi entry) |
| **Framer Motion (`motion/react` qua package `motion`)** | Chuyển cảnh giai đoạn, choreography lá thư/ảnh, modal, `AnimatePresence` |
| **CSS3 thuần** | Hình khối phong bì/thư/ảnh, keyframes nhẹ (bob, mote, sparkle) |
| **Canvas 2D** | Vẽ hoa hướng dương thủ công, mây, bụi sáng, cánh hoa rơi |
| **Lucide React** | Icon tối giản (đóng modal, âm thanh, trái tim con dấu) |
| **WebAudio API** | Âm thanh tổng hợp rất khẽ (không tải file ngoài) |
| **next/font + Google Fonts** | Playfair Display (serif) · Be Vietnam Pro (sans) · Dancing Script (chữ ký) — đều có subset tiếng Việt và font dự phòng |

**Vì sao không dùng Vite?** Môi trường chạy preview chỉ serve Next.js trên port 3000.
Toàn bộ mã nguồn là React + TypeScript thuần không phụ thuộc Next (trừ `layout.tsx`
để nạp font) — muốn chuyển sang Vite, chỉ cần tạo `index.html` + `main.tsx` trỏ vào
`<GreetingExperience />` và khai báo font Google tương ứng.

**GSAP không sử dụng** — mọi timeline trong trải nghiệm chỉ có 2–3 bước nối tiếp,
Framer Motion (variants + delay) đã đủ và tránh chồng chéo thư viện animation.

## 2. Kiến trúc & luồng trạng thái

```
GreetingStage: 'flower' → 'envelope' → 'revealed'     (useGreetingFlow — state machine)
photoOpen / letterOpen: boolean                        (2 modal độc lập ở giai đoạn 4)
isTransitioning: boolean                               (khóa thao tác trong chuyển cảnh)
```

```
src/
├── app/
│   ├── layout.tsx                 # font tiếng Việt + metadata
│   ├── page.tsx                   # route "/" → GreetingExperience
│   └── globals.css                # Tailwind nền khung (template)
├── components/greeting/
│   ├── GreetingExperience.tsx     # dàn dựng tổng, hint, sparks, âm thanh
│   ├── GardenScene.tsx            # canvas khu vườn + nút chạm hoa
│   ├── Envelope.tsx               # phong bì HTML/CSS: nắp lật 3D, con dấu
│   ├── Letter.tsx                 # lá thư (ẩn → hé lộ → trượt ra)
│   ├── PhotoReveal.tsx            # ảnh polaroid (trượt ra sau lá thư)
│   ├── ImageLightbox.tsx          # phóng to ảnh (giữ tỷ lệ, Escape/nền đóng)
│   ├── LetterModal.tsx            # đọc thư đầy đủ (cuộn được, HTML thật)
│   ├── BackgroundEffects.tsx      # bụi sáng + parallax nhẹ theo chuột
│   ├── SoundToggle.tsx            # nút bật/tắt âm thanh
│   └── LetterSprig.tsx            # SVG nhánh hoa (giữ từ bản gốc)
├── config/greeting.ts             # ⭐ TOÀN BỘ NỘI DUNG THIỆP
├── hooks/
│   ├── useGreetingFlow.ts         # state machine + khóa chuyển cảnh
│   ├── usePrefersReducedMotion.ts # tiếp cận: giảm chuyển động
│   ├── useViewportSize.ts         # bố cục theo màn hình
│   └── useModalA11y.ts            # Escape, focus trap, trả focus
├── lib/
│   ├── sunflower-art.ts           # engine vẽ hoa (chuyển thể garden-botany.js)
│   ├── garden-scene.ts            # vòng lặp cảnh (gió, mây, hạt, hoa nền)
│   ├── greeting-layout.ts         # toạ độ vật thể theo viewport
│   └── sounds.ts                  # WebAudio tổng hợp
├── styles/
│   ├── global.css                 # biến màu, nền sân khấu, hint, header
│   ├── sunflower.css              # cảnh hoa + nút chạm
│   ├── envelope.css               # phong bì, thư, ảnh, modal
│   └── animations.css             # keyframes bob/mote/sparkle
public/images/
├── greeting-photo.png             # ⭐ ẢNH THẬT BÊN TRONG PHONG BÌ
└── greeting-photo-fallback.svg    # ảnh dự phòng tự động nếu ảnh chính lỗi
```

**Tricks z-index quan trọng** (lá thư thực sự nằm TRONG phong bì):
- Trong phong bì: thân sau (z1) → ảnh (z7) → thư (z8) → túi trước (z14) → nắp (z16→2 khi lật).
- Sau khi đẩy ra: thư (z20), ảnh (z15 desktop / 21 mobile đè mép thư) — tất cả đều trên túi phong bì.
- Ảnh/thư ẩn trong phong bì có `pointer-events: none` để nhấn vào phong bì không bao giờ
  vô tình mở lightbox (sự kiện chỉ thuộc về phong bì).

## 3. Chạy dự án

```bash
bun install        # cài dependency
bun run dev        # dev server → http://localhost:3000
bun run lint       # kiểm tra ESLint
bunx tsc --noEmit  # kiểm tra TypeScript
```

## 4. Đổi nội dung thiệp (không đụng logic animation)

Mở **`src/config/greeting.ts`** — mọi thứ nằm ở đây:

| Muốn đổi | Trường |
| --- | --- |
| Lời chúc (mỗi phần tử mảng = 1 đoạn) | `message: string[]` |
| Người nhận / chữ ký / tiêu đề | `recipient` · `signature` · `title` |
| Ảnh trong phong bì | Thay file tại `public/images/greeting-photo.png` (khuyến nghị tỉ lệ 3:4) hoặc sửa `photo` thành đường dẫn mới |
| Các dòng gợi ý | `flowerHint` · `envelopeHint` · `letterPeekHint` · `letterHint` · `photoHint` |
| Chú thích ảnh polaroid | `photoCaption` |

Ảnh chính lỗi sẽ **tự động** thay bằng `greeting-photo-fallback.svg` — không bao giờ
gây vỡ giao diện. Không có nhạc nền file ngoài; âm thanh tổng hợp bằng WebAudio và
luôn có nút bật/tắt ở góc phải dưới.

## 5. Kết quả kiểm thử thực tế (Agent Browser)

Đã chạy trên 1366×768, 1920×1080, 768×1024, 390×844:

- [x] Cảnh hoa render (canvas): hoa chính + hoa nền soft-focus + mây + bụi sáng
- [x] Nhấn hoa → phong bì xuất hiện → nắp tự lật 3D → thư hé lộ → đổi dòng gợi ý
- [x] Nhấn phong bì → thư trượt hẳn ra, ảnh trượt theo quỹ đạo riêng, lấp lánh
- [x] Lỗi click-through (nhấn phong bì mở luôn lightbox) **đã phát hiện và sửa**
      bằng `pointer-events` theo giai đoạn — xác minh lại: 1 nhấn = 1 hành động
- [x] Nhấn thư → modal đọc thư (HTML thật, cuộn được); nhấn ảnh → lightbox giữ tỷ lệ
- [x] Đóng bằng nút X, phím Escape, nhấn nền — focus được trả về đúng nút vừa mở
- [x] Bàn phím: Tab + Enter đi được toàn bộ luồng hoa → phong bì → thư
- [x] Nhấn đúp/nhanh liên tiếp không gây chuyển cảnh lặp (`isTransitioning` + guard)
- [x] Không có scroll ngang (scrollWidth == innerWidth ở cả 4 kích thước)
- [x] `bun run lint`: 0 lỗi · `tsc --noEmit`: 0 lỗi src · dev.log: không có runtime error
