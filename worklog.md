# Worklog

---
Task ID: 1
Agent: main (Z.ai)
Task: Xây dựng website chúc mừng 20/10 với hoa hướng dương, phong bì thư và hiệu ứng animation điện ảnh (React + TS + Framer Motion), tham khảo hiệu ứng từ garden.html / garden-botany.js do người dùng upload.

Work Log:
- Nạp skill fullstack-dev, chạy init script, xác nhận môi trường Next.js 16 + React 19 + TS trên port 3000.
- Kiểm tra repo tham khảo qua WebFetch: KHÔNG có LICENSE, nội dung là HOA HỒNG (roses) chứ không phải hướng dương → báo người dùng, chuyển thể kỹ thuật (không sao chép giao diện).
- Phân tích kỹ mã nguồn upload: LCG seeded random, sprite canvas nhiều lớp + unfurl (whorlDelays/closedScales/twistAngles), polar petals + AO shadow, xoắn lõi 2.39996, bezier stem + công thức gió sin(t*0.00125...), leaf veins, softenPetals bake, visibility pause, DPR≤2.
- Cài `motion` (motion/react). Viết src/lib/sunflower-art.ts (engine hoa hướng dương: 2 vòng cánh tia 16 cánh, đĩa hạt golden-angle, đài xanh, giọt sương) và garden-scene.ts (mây, bụi, cánh rơi, hoa nền, hero + spark burst).
- Viết config/greeting.ts, hooks (useGreetingFlow state machine, usePrefersReducedMotion/useViewportSize dùng useSyncExternalStore, useModalA11y), lib/greeting-layout.ts, lib/sounds.ts (WebAudio).
- Viết 4 file styles + 9 component. Phong bì HTML/CSS: lá thư/ảnh là con của phong bì nằm giữa thân sau và túi trước (z đúng), nắp lật rotateX 0→180 kèm keyframe zIndex 16→16→2, con dấu sáp tim.
- Tạo ảnh thiệp bằng z-ai image gen (864×1152) + SVG fallback.
- Sửa lỗi ESLint React Compiler (setState đồng bộ trong effect → useSyncExternalStore / bỏ state thừa).
- Sửa BUG nghiêm trọng phát hiện qua Agent Browser: nhấn phong bì mở đồng thời lightbox ảnh — nguyên nhân ảnh ẩn (opacity 0, z7) nhận click xuyên vùng khoét chữ V của túi phong bì + bubbling con→cha (console trace: openPhoto 5834.6ms TRƯỚC envelope 5836.4ms). Fix: pointer-events none cho thư/ảnh khi chưa revealed + zIndex động (thư 20, ảnh 15/21 khi revealed). Kiểm chứng lại: 1 nhấn = 1 hành động.
- Kiểm thử E2E Agent Browser: 4 viewport (1366×768, 1920×1080, 768×1024, 390×844), toàn bộ luồng hoa→phong bì→thư→2 modal, Escape/đóng bằng nền/X, keyboard-only flow (Tab+Enter, focus tự chuyển), nhấn đúp 3 lần liên tiếp, scrollWidth==innerWidth, console 0 lỗi.
- lint 0 lỗi, tsc 0 lỗi src, dev.log sạch. Viết README.md (kiến trúc, chạy, đổi nội dung, kết quả kiểm thử).

Stage Summary:
- Hoàn thành website 4 giai đoạn: hoa hướng dương canvas (giữ DNA kỹ thuật bản gốc) → phong bì nắp lật → thư + ảnh trượt ra có vật lý → lightbox/modal đọc thư.
- Bảo mật tương tác: khóa chuyển cảnh, pointer-events theo stage, focus trap + trả focus, prefers-reduced-motion (canvas 1 frame + MotionConfig reducedMotion="user" + CSS media).
- Deliverable: Next.js app chạy tại / (preview port 3000), cấu hình nội dung tập trung tại src/config/greeting.ts, ảnh tại public/images/.
