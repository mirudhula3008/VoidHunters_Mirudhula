import { Award } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export function FixitChoiceBadge() {
  const { t } = useLanguage();
  return (
    <span className="badge badge-choice">
      <Award size={13} strokeWidth={2.5} aria-hidden="true" /> {t('worker.fixitChoice')}
    </span>
  );
}

// Tells the customer why this worker was recommended.
export function FixitChoiceReason({ worker, className = '' }) {
  const { t } = useLanguage();
  return (
    <p className={`text-xs font-medium text-blue-700 ${className}`}>
      {t('worker.choiceWhy', {
        rating: worker.averageRating.toFixed(1),
        reviews: worker.totalReviews,
        years: worker.experienceYears || 0,
        skills: worker.services?.length || 0,
      })}
    </p>
  );
}
