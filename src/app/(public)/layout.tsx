import { Footer, Nav } from "@/components/SiteChrome";
import CookieNotice from "@/components/CookieNotice";
import ScrollFX from "@/components/ScrollFX";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grain relative overflow-x-clip">
      <a href="#contenu" className="btn btn-primary btn-sm fixed left-4 top-4 z-[70] -translate-y-24 focus:translate-y-0">
        Aller au contenu
      </a>
      <div className="aura" aria-hidden="true" />
      <ScrollFX />
      <Nav />
      <main id="contenu" className="relative z-10">
        {children}
      </main>
      <Footer />
      <CookieNotice />
    </div>
  );
}
