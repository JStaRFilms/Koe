import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { StatusBar } from "@/components/StatusBar";
import { Footer } from "@/components/sections/Footer";
import { WebKoeApp } from "@/components/web-app/WebKoeApp";

export const metadata: Metadata = {
  title: "Web App",
  description: "Use Koe in the browser with your signed-in account, managed processing, and account BYOK.",
  alternates: {
    canonical: "/app/",
  },
};

export default function AppPage() {
  return (
    <>
      <div id="top" />
      <StatusBar />
      <Header />
      <main className="flex-grow flex flex-col relative w-full">
        <div className="giant-kanji select-none pointer-events-none" aria-hidden="true">
          声
        </div>
        <WebKoeApp />
      </main>
      <Footer />
    </>
  );
}
