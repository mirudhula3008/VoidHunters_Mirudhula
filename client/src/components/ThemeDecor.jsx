import { Wrench } from 'lucide-react';

// Pale diagonals, dot grid and wrench watermark behind every page.
export function ThemeBackdrop() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden="true">
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice">
        <polygon points="330,0 560,0 240,330 10,330" fill="#D9E6FA" opacity="0.55" />
        <polygon points="1010,0 1190,0 780,420 600,420" fill="#D9E6FA" opacity="0.45" />
        <polygon points="1440,520 1440,760 1180,900 900,900" fill="#D9E6FA" opacity="0.5" />
      </svg>
      <span className="dot-grid absolute left-5 top-24 hidden h-24 w-14 min-[1400px]:block" />
      <span className="dot-grid absolute bottom-10 right-8 h-20 w-28" />
      <Wrench className="absolute -right-6 top-24 h-72 w-72 -rotate-12 text-blue-200 opacity-40" strokeWidth={1.25} />
    </div>
  );
}

// Navy corner shapes for headline areas. The parent needs `relative overflow-hidden`.
// Hidden on small screens, where they would sit behind the text.
export function NavyCorners({ bottom = true }) {
  return (
    <div className="pointer-events-none absolute inset-0 hidden md:block" aria-hidden="true">
      <svg className="absolute right-0 top-0 h-44 w-72" viewBox="0 0 288 176">
        <defs>
          <linearGradient id="corner-stripe" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#123F9C" stopOpacity="0.35" />
            <stop offset="1" stopColor="#123F9C" stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon points="110,0 288,0 288,176" fill="#0A2259" />
        <polygon points="58,0 92,0 268,176 234,176" fill="url(#corner-stripe)" />
      </svg>
      {bottom && (
        <>
          <svg className="absolute bottom-0 left-0 h-44 w-72" viewBox="0 0 288 176">
            <polygon points="0,26 150,176 0,176" fill="#0A2259" />
            <polygon points="0,0 12,0 188,176 170,176 0,6" fill="#FFFFFF" />
          </svg>
          <svg className="absolute bottom-0 right-0 h-36 w-72" viewBox="0 0 288 144">
            <polygon points="288,0 288,144 150,144" fill="#0A2259" />
            <path d="M60,144 l34,-46 a18,18 0 0 1 14,-8 h56 l-40,54 z" fill="#123F9C" />
          </svg>
        </>
      )}
    </div>
  );
}
