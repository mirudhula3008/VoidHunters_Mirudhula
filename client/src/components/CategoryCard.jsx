import { Link } from 'react-router-dom';
import CategoryIcon from './CategoryIcon';
import { useLanguage } from '../context/LanguageContext';
import { categoryPath } from '../data/categories';

// Service category tile with a navy icon and a glow ring on hover.
export default function CategoryCard({ category }) {
  const { t } = useLanguage();
  return (
    <Link
      to={categoryPath(category.id)}
      className="group flex flex-col items-center gap-3 rounded-2xl border border-white bg-white/95 px-4 py-6 text-center shadow-card transition hover:-translate-y-1 hover:border-blue-300 hover:shadow-lift focus:outline-none focus-visible:border-blue-600 focus-visible:shadow-glow"
    >
      <CategoryIcon id={category.id} size="lg" />
      <div>
        <h3 className="font-semibold text-navy">{t(`services.${category.id}`)}</h3>
        <p className="mt-1 text-xs leading-relaxed text-slate-500">{t(`services.desc.${category.id}`)}</p>
      </div>
    </Link>
  );
}
