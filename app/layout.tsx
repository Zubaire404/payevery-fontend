import "./globals.css";

export const metadata = {
  title: "PayEvery",
  description: "Modern Fintech Dashboard",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* 🔴 দ্য চিট কোড: এটি ইন্টারনেট থেকে সরাসরি আপনার ডিজাইন রেন্ডার করবে! */}
        <script src="https://cdn.tailwindcss.com"></script>
      </head>
      <body className="bg-[#f4f7fe] text-gray-900">{children}</body>
    </html>
  );
}