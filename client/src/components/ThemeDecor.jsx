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
