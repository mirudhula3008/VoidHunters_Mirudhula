import { useLanguage } from '../context/LanguageContext';

// Photo attached to a review. Opens full size in a new tab.
export default function ReviewImage({ src, className = '' }) {
  const { t } = useLanguage();
  return (
    <a href={src} target="_blank" rel="noopener noreferrer" className={`inline-block ${className}`} title={t('review.viewPhoto')}>
      <img
        src={src}
        alt={t('review.photoAlt')}
        loading="lazy"
        className="h-32 w-32 rounded-xl border border-slate-200 bg-slate-100 object-cover transition hover:opacity-90"
      />
    </a>
  );
}
