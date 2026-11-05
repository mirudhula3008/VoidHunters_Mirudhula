import { Moon, Sun } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

// Sun / moon button in the navbar.
export default function ThemeToggle({ theme, onToggle }) {
  const { t } = useLanguage();
  const dark = theme === 'dark';
  const label = t(dark ? 'nav.switchToLight' : 'nav.switchToDark');
  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex h-9 w-9 flex-none items-center justify-center rounded-full text-navy transition hover:bg-blue-50"
      aria-label={label}
      title={label}
    >
      {dark ? <Sun size={19} aria-hidden="true" /> : <Moon size={19} aria-hidden="true" />}
    </button>
  );
}
