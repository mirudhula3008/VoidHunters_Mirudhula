import { Cctv, Cog, Hammer, HardHat, Paintbrush, Refrigerator, Sparkles, Truck, Wrench, Zap } from 'lucide-react';

// Navy icon in a pale circle per service category. Names and blurbs live in the locale files.
export const CATEGORY_META = {
  plumbing: { Icon: Wrench },
  electrical: { Icon: Zap },
  carpentry: { Icon: Hammer },
  painting: { Icon: Paintbrush },
  cleaning: { Icon: Sparkles },
  appliance_repair: { Icon: Refrigerator },
  construction: { Icon: HardHat },
  packers_movers: { Icon: Truck },
  cctv_security: { Icon: Cctv },
  mechanic: { Icon: Cog },
};

export default function CategoryIcon({ id, size = 'md' }) {
  const meta = CATEGORY_META[id] || CATEGORY_META.plumbing;
  const { Icon } = meta;
  const box = size === 'lg' ? 'h-16 w-16' : size === 'sm' ? 'h-9 w-9' : 'h-12 w-12';
  const icon = size === 'lg' ? 30 : size === 'sm' ? 18 : 24;
  return (
    <span className={`inline-flex flex-none items-center justify-center rounded-full bg-blue-50 text-navy ${box}`} aria-hidden="true">
      <Icon size={icon} strokeWidth={2} fill="currentColor" fillOpacity={0.18} />
    </span>
  );
}
