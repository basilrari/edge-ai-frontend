import "./globals.css";
import React from "react";

export const metadata = {
  title: "Jetson LLM Gateway Dashboard",
  description: "Live telemetry for the Jetson LLM Gateway",
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
