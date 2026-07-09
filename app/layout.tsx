import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "PayEvery — Smart International Payments for Bangladesh",
  description: "PayEvery connects local wallets (bKash, Nagad) to generate one-time virtual dollar cards for international SaaS subscriptions, AI tools, and software payments — no dual-currency bank card needed.",
  keywords: "bKash, Nagad, virtual card, international payment, Bangladesh, SaaS, AI subscription, PayEvery",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <script src="https://cdn.tailwindcss.com"></script>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
        <style>{`* { font-family: 'Inter', sans-serif; }`}</style>
      </head>
      <body className="bg-slate-950 text-slate-300 antialiased">{children}</body>
    </html>
  );
}