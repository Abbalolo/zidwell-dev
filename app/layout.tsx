import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { UserProvider } from "./context/userData";
import SessionWatcher from "./components/SessionUser";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
    title: "Zidwell",
  description: "Zidwell - Your Personal Finance app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
        <body className={`${inter.variable} font-sans antialiased` }>

      <UserProvider>
        
        <SessionWatcher/>
          {children}
      </UserProvider>
        </body>
        
    </html>
  );
}
