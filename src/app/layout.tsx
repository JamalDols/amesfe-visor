import type { Metadata } from "next";
import { Lato } from "next/font/google";
import "./globals.css";

const lato = Lato({
  subsets: ["latin"],
  weight: ["300", "400", "700", "900"], // Light, Regular, Bold, Black
  variable: "--font-lato",
});

export const metadata: Metadata = {
  title: "Visor de Fotos",
  description: "Galería de fotos pública con panel de administración",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={lato.variable}>
      <body className="min-h-screen bg-gray-50 font-lato antialiased">
        <main className="min-h-screen">{children}</main>
      </body>
    </html>
  );
}
