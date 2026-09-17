import type { Settings } from "@/lib/types";
import { ClipReveal } from "./animated-text";
import { GreekMark } from "./greek-mark";

export function Footer({ settings }: { settings: Settings }) {
  const year = new Date().getFullYear();
  return (
    <footer className="relative overflow-hidden border-t border-foreground/10 bg-background px-4 pt-20 pb-10 sm:px-6 md:pt-28">
      <div aria-hidden className="glow-top absolute inset-0" />
      <div className="relative mx-auto max-w-6xl">
        <div className="flex flex-col justify-between gap-12 md:flex-row">
          <div className="max-w-sm">
            <p className="flex items-center gap-3">
              <GreekMark mode="hover" strokeWidth={9} className="w-[42px] text-accent" />
              <span className="text-lg font-semibold">{settings.storeName}</span>
            </p>
            <p className="mt-5 text-sm leading-relaxed text-foreground/70">
              {settings.chapterName}. Drink orders for brothers, tracked in one place.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-10 md:gap-16">
            <div>
              <p className="mb-4 text-xs tracking-[0.2em] text-foreground/60 uppercase">Menu</p>
              <ul className="space-y-3 text-sm">
                <li><a href="#drinks" className="text-foreground/80 transition-colors hover:text-foreground">Drinks</a></li>
                <li><a href="#merch" className="text-foreground/80 transition-colors hover:text-foreground">Merch</a></li>
              </ul>
            </div>
            <div>
              <p className="mb-4 text-xs tracking-[0.2em] text-foreground/60 uppercase">Ordering</p>
              <ul className="space-y-3 text-sm">
                <li><a href="#how-it-works" className="text-foreground/80 transition-colors hover:text-foreground">How it works</a></li>
                <li><a href="#top" className="text-foreground/80 transition-colors hover:text-foreground">Back to top</a></li>
              </ul>
            </div>
          </div>
        </div>

        <p
          aria-hidden
          className="mt-16 text-center font-serif text-[22vw] leading-none tracking-tight text-foreground/[0.06] select-none md:mt-20 md:text-[15vw]"
        >
          <ClipReveal>Zeta Rho</ClipReveal>
        </p>

        <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-foreground/10 pt-8 text-xs text-foreground/60 sm:flex-row">
          <p>&copy; {year} {settings.chapterName}. Must be 21+ to order.</p>
          <p>Product images belong to their respective brands.</p>
        </div>
      </div>
    </footer>
  );
}
