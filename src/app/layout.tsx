import "./globals.css";
import React from "react";

export const metadata = {
  title: "SAR Mission Control",
  description: "LLM-powered search and rescue drone mission control dashboard",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}): JSX.Element {
  return (
    <html lang="en" className="dark">
      <body>{children}</body>
    </html>
  );
}
