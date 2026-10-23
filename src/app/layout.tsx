import type { Metadata, Viewport } from "next";
import { Be_Vietnam_Pro, Dancing_Script, Playfair_Display } from "next/font/google";
import "./globals.css";
import "@/styles/global.css";
import "@/styles/sunflower.css";
import "@/styles/envelope.css";
import "@/styles/animations.css";

/* Font serif thanh lịch cho tiêu đề & nội dung thư */
const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin", "vietnamese"],
  display: "swap",
});

/* Font sans-serif dễ đọc cho giao diện (thiết kế riêng cho tiếng Việt) */
const beVietnam = Be_Vietnam_Pro({
  variable: "--font-be-vietnam",
  subsets: ["latin", "vietnamese"],
  display: "swap",
  weight: ["400", "500", "600"],
});

/* Font viết tay cho chữ ký */
const dancing = Dancing_Script({
  variable: "--font-dancing",
  subsets: ["latin", "vietnamese"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Cả một vườn thương · 20/10",
  description:
    "Chạm một bông hoa hướng dương, đánh thức cả khu vườn và nhận một lời chúc dịu dàng ngày Phụ nữ Việt Nam 20/10.",
  keywords: ["20/10", "Ngày Phụ nữ Việt Nam", "thiệp chúc mừng", "hoa hướng dương"],
};

export const viewport: Viewport = {
  themeColor: "#fdf3dc",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="vi"
      className={`${playfair.variable} ${beVietnam.variable} ${dancing.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
