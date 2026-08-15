import type { Metadata } from "next";
import type { ReactNode } from "react";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { Inter, Geist, Space_Grotesk } from "next/font/google";
import localFont from "next/font/local";
import { cn } from "@/lib/utils";
import { AppProvider } from "@/lib/context/AppProvider";
import { MapRtlTextSetup } from "@/components/MapRtlTextSetup";
import { Toaster } from "sonner";
import "../globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });
const inter = Inter({ subsets: ["latin"] });
// Space Grotesk : police de display pour les valeurs KPI (chiffres).
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
});

// Wordmark « Madinaty » : police Excalifont (presente dans assets/fonts).
const excalifont = localFont({
  src: "../../assets/fonts/Excalifont-Regular.woff2",
  variable: "--font-brand",
});

export const metadata: Metadata = {
  title: "Madinaty Dashboard",
  description:
    "Tableau de bord des autorités pour la gestion des signalements de services urbains",
};

type Props = {
  children: ReactNode;
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return [{ locale: "fr" }, { locale: "en" }, { locale: "ar" }];
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const messages = await getMessages();
  const dir = locale === "ar" ? "rtl" : "ltr";

  return (
    <html
      lang={locale}
      dir={dir}
      suppressHydrationWarning
      className={cn(
        "font-sans",
        geist.variable,
        excalifont.variable,
        spaceGrotesk.variable
      )}
    >
      <body className={inter.className}>
        <NextIntlClientProvider messages={messages}>
          <MapRtlTextSetup />
          <AppProvider>
            {children}
            <Toaster position="top-right" richColors closeButton />
          </AppProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
