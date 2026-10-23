"use client";

/**
 * LetterSprig — nhánh hoa nhỏ trang trí trên lá thư.
 * Giữ nguyên SVG đặc trưng từ lá thư trong mã nguồn tham khảo (garden.html)
 * để thiệp mang đúng chất botanical của bản gốc.
 */
export default function LetterSprig({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 90 64"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M45 59 Q41 40 46 21 M44 49 Q25 47 23 35 Q39 33 44 49 M44 40 Q60 39 65 28 Q51 28 44 40"
        stroke="#78947a"
        strokeWidth="1.2"
        fill="#dfe9d9"
      />
      <g fill="#ecc1d2" stroke="#c9789a" strokeWidth=".6">
        <ellipse cx="39" cy="17" rx="8" ry="12" transform="rotate(-40 39 17)" />
        <ellipse cx="52" cy="17" rx="8" ry="12" transform="rotate(40 52 17)" />
        <ellipse cx="45" cy="15" rx="8" ry="12" />
        <path d="M30 19 Q44 17 45 30 Q33 32 30 19 M60 19 Q46 17 45 30 Q58 32 60 19" />
      </g>
    </svg>
  );
}
