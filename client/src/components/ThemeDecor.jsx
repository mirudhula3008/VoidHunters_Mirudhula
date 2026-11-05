const CORNER = { fill: 'var(--decor-corner)' };
const SWEEP = { fill: 'rgb(var(--c-blue-100))' };

// A soft curve behind every page. Pale enough for text to sit on.
export function ThemeBackdrop() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden="true">
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 1440 900" preserveAspectRatio="none">
        <path d="M1440 360 C1180 640 860 800 460 900 H1440 Z" style={SWEEP} opacity="0.35" />
      </svg>
    </div>
  );
}

// Navy curve at the bottom right. The parent needs `relative`.
// Hidden on small screens, where it would sit behind the text.
export function BottomCorner() {
  return (
    <svg
      className="pointer-events-none absolute bottom-0 right-0 hidden h-36 w-[30vw] md:block"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <path d="M100 0 C72 42 36 78 0 100 H100 Z" style={CORNER} />
    </svg>
  );
}

// Curves for every page: navy and pale at the top left, navy at the bottom right.
// The top curve needs the wider screens, where page content starts clear of it.
export function PageCorners() {
  return (
    <>
      <svg
        className="pointer-events-none absolute left-0 top-0 hidden h-[180px] w-[300px] min-[1440px]:block"
        viewBox="0 0 300 180"
        aria-hidden="true"
      >
        <path d="M0 100 C40 55 90 20 150 0 H285 C180 25 80 85 0 175 Z" style={SWEEP} opacity="0.8" />
        <path d="M0 0 H150 C90 20 40 55 0 100 Z" style={CORNER} />
      </svg>
      <BottomCorner />
    </>
  );
}

// Curves at the right of the navbar. The navy part needs the wider screens to clear the buttons.
export function NavbarCorner() {
  return (
    <svg
      className="pointer-events-none absolute right-0 top-0 hidden h-16 w-[300px] lg:block"
      viewBox="0 0 300 64"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="navbar-sweep" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" style={{ stopColor: 'rgb(var(--c-blue-100))', stopOpacity: 0 }} />
          <stop offset="1" style={{ stopColor: 'rgb(var(--c-blue-100))', stopOpacity: 1 }} />
        </linearGradient>
      </defs>
      <path d="M40 0 H205 C225 35 265 60 300 64 H120 C95 45 60 20 40 0 Z" fill="url(#navbar-sweep)" />
      <path d="M205 0 H300 V64 C265 60 225 35 205 0 Z" style={CORNER} className="hidden min-[1440px]:block" />
    </svg>
  );
}
