import { Link, Navigate, useParams } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import CategoryIcon from '../components/CategoryIcon';
import { useLanguage } from '../context/LanguageContext';
import { jobsFor } from '../data/categories';

// /services/:category — the jobs in a category. Workers are shown only after one is chosen.
export default function JobPicker() {
  const { category } = useParams();
  const { t } = useLanguage();
  const jobs = jobsFor(category);

  if (!jobs.length) return <Navigate to="/dashboard" replace />;

  return (
    <div>
      <div className="mx-auto max-w-5xl px-4 py-8">
      <Link to="/dashboard" className="text-sm text-blue-600 hover:underline">
        {t('discovery.allServices')}
      </Link>
      <div className="mt-3 flex items-center gap-4">
        <CategoryIcon id={category} size="lg" />
        <div className="min-w-0">
          <h1 className="font-display text-3xl text-navy sm:text-4xl">{t(`services.${category}`)}</h1>
          <p className="mt-1 text-slate-600">{t('discovery.chooseJob')}</p>
        </div>
      </div>

      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        {jobs.map((job) => (
          <Link
            key={job.id}
            to={`/workers?category=${category}&job=${job.id}`}
            className="card card-hover group flex items-center justify-between gap-3 p-5"
          >
            <span className="min-w-0 font-semibold text-navy">{t(`jobs.${job.id}`)}</span>
            <ArrowRight size={18} className="flex-none text-blue-600 transition group-hover:translate-x-0.5" aria-hidden="true" />
          </Link>
        ))}
      </div>
      </div>
    </div>
  );
}
