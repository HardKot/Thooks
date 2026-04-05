import type { Metadata } from "next";
import "./globals.css";


export const metadata: Metadata = {
  title: "Thooks",
  description: "Tools for API development and testing",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
