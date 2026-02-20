import type { Metadata } from "next";
import { ThemeProvider } from "@/components/ThemeProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "X1-Backslash",
  description: "X1 Lab's LaTeX editor with live PDF preview",
  icons: {
    icon: "/icon.png",
  },
  openGraph: {
    title: "X1-Backslash",
    description: "X1 Lab's LaTeX editor with live PDF preview",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
