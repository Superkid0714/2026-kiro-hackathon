import './globals.css';

export const metadata = {
  title: 'Roomonic — 같이, 더 좋은 일상',
  description: '생활 패턴 인터뷰 기반 룸메이트 매칭 서비스',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Gaegu:wght@400;700&family=Noto+Sans+KR:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-noto bg-[#F3F0FC] text-ink">{children}</body>
    </html>
  );
}
