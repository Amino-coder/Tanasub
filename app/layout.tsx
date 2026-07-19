import "./globals.css";

export const metadata = {
  title: "Tanasub — Better conversations before marriage",
  description: "A private, anonymous conversation-starter questionnaire for couples.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body style={{ background: "#FAF6F2" }}>{children}</body>
    </html>
  );
}
