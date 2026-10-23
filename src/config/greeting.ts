/**
 * CẤU HÌNH NỘI DUNG THIỆP 20/10
 * ---------------------------------------------------------------
 * Toàn bộ nội dung lời chúc, người nhận, chữ ký, ảnh và các dòng
 * gợi ý tương tác được khai báo tại đây. Có thể thay đổi mà không
 * cần động vào logic animation của các component.
 */

export type GreetingConfig = {
  /** Tiêu đề lớn của thiệp (hiện trong lá thư & modal đọc thư) */
  title: string;
  /** Dòng phụ dưới tiêu đề */
  subtitle: string;
  /** Người nhận,VD: "Gửi bạn thương mến" — chỉ phần tên sau "Gửi" */
  recipient: string;
  /** Các đoạn lời chúc — mỗi phần tử là một đoạn văn trong lá thư */
  message: string[];
  /** Chữ ký cuối thư */
  signature: string;
  /** Đường dẫn ảnh bên trong phong bì (thay ảnh thật tại public/images) */
  photo: string;
  /** Ảnh dự phòng hiển thị nếu ảnh chính lỗi */
  photoFallback: string;
  /** Chú thích dưới ảnh (kiểu polaroid) */
  photoCaption: string;
  /** Dòng gợi ý khi đang ở cảnh hoa hướng dương */
  flowerHint: string;
  /** Dòng gợi ý khi phong bì vừa xuất hiện */
  envelopeHint: string;
  /** Dòng gợi ý khi lá thư đã trồi ra một phần */
  letterPeekHint: string;
  /** Dòng gợi ý dưới lá thư / ảnh khi đã được đẩy ra */
  letterHint: string;
  photoHint: string;
  /** Ngày hiển thị trên lá thư */
  date: string;
  /** Dòng đề dedicaton nhỏ góc trên */
  dedication: string;
};

export const greetingConfig: GreetingConfig = {
  title: "Chúc mừng ngày 20/10",
  subtitle: "Một chút dịu dàng dành tặng bạn",
  recipient: "bạn thương mến",
  message: [
    "Chúc bạn có một ngày 20/10 thật vui vẻ.",
    "Mong bạn luôn gặp nhiều điều tốt đẹp và có thật nhiều niềm vui trong cuộc sống. Như một bông hướng dương luôn hướng về phía mặt trời, mong bạn cũng luôn tìm thấy những ánh sáng nhỏ bé để mà mỉm cười.",
    "Chúc những ngày phía trước của bạn luôn ngập tràn tiếng cười, những điều dịu dàng và những kỷ niệm đáng nhớ. Hãy cứ rạng rỡ theo cách của riêng bạn nhé.",
  ],
  signature: "Thân gửi, ♡",
  photo: "/images/greeting-photo.png",
  photoFallback: "/images/greeting-photo-fallback.svg",
  photoCaption: "20 · 10 — Ngày Phụ nữ Việt Nam",
  flowerHint: "Chạm vào bông hoa để khám phá điều bất ngờ.",
  envelopeHint: "Một lời chúc nhỏ đang chờ bạn…",
  letterPeekHint: "Chạm vào lá thư để mở nhé…",
  letterHint: "Chạm vào lá thư để đọc lời chúc",
  photoHint: "Chạm vào ảnh để xem rõ hơn",
  date: "20 · 10",
  dedication: "Dành tặng bạn, một vườn thương dịu dàng.",
};
