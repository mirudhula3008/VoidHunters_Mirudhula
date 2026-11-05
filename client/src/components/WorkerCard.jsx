import { Link } from 'react-router-dom';
import { Check, MapPin } from 'lucide-react';
import Avatar from './Avatar';
import { FixitChoiceBadge, FixitChoiceReason } from './FixitChoice';
import StarDisplay from './StarDisplay';
import { unitLabel } from './ServicesEditor';
import { useLanguage } from '../context/LanguageContext';
import { formatDistanceShort, formatPriceRange } from '../utils/format';

// Worker card (theme guide §6): avatar, name + Verified, stars, distance, availability, price, Negotiable.
export default function WorkerCard({ worker, job, highlighted, onHover }) {
  const { t } = useLanguage();
  const jobUnit = job && worker.services?.find((s) => s.job === job)?.unit;
  return (
    <Link
      to={job ? `/workers/${worker._id}?job=${job}` : `/workers/${worker._id}`}
      onMouseEnter={() => onHover?.(worker._id)}
      onMouseLeave={() => onHover?.(null)}
      state={{ fixitChoice: Boolean(worker.fixitChoice) }}
      className={`flex gap-4 rounded-2xl border bg-white p-4 shadow-card transition hover:shadow-lift ${
        highlighted || worker.fixitChoice ? 'border-blue-600 shadow-glow' : 'border-slate-200'
      }`}
    >
      <Avatar person={worker} className="h-14 w-14" textClass="text-xl" />

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="truncate font-semibold text-navy">{worker.name}</h3>
          {worker.fixitChoice && <FixitChoiceBadge />}
          {worker.isVerified && (
            <span className="badge badge-verified">
              <Check size={12} strokeWidth={3} /> {t('worker.verified')}
            </span>
          )}
        </div>

        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-500">
          <StarDisplay rating={worker.averageRating} />
          {worker.distance != null && (
            <span className="inline-flex items-center gap-1">
              <MapPin size={14} className="text-rose-500" /> {formatDistanceShort(worker.distance, t)}
            </span>
          )}
          <span className={`inline-flex items-center gap-1.5 font-medium ${worker.availability ? 'text-emerald-600' : 'text-slate-400'}`}>
            <span className={`h-2 w-2 rounded-full ${worker.availability ? 'bg-emerald-500' : 'bg-slate-300'}`} />
            {worker.availability ? t('worker.available') : t('worker.busy')}
          </span>
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className="font-bold text-navy">{worker.minPrice == null ? t('worker.priceOnRequest') : formatPriceRange(worker.minPrice, worker.maxPrice)}</span>
          {jobUnit && <span className="text-xs text-slate-400">{unitLabel(jobUnit, t)}</span>}
          {worker.isNegotiable && <span className="badge badge-negotiable">{t('worker.negotiable')}</span>}
        </div>
        {worker.fixitChoice && <FixitChoiceReason worker={worker} className="mt-2" />}
      </div>
    </Link>
  );
}
