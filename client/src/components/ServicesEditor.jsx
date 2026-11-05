import { controlClass } from './FormField';
import { useLanguage } from '../context/LanguageContext';

const EMPTY = { name: '', price: '', unit: 'per job' };
// Stored values stay in English; only the labels are translated.
const UNITS = ['per job', 'per hour', 'per day', 'per sq ft', 'per visit'];

// Editable list of { name, price, unit, job } rows. With `jobs`, the name is picked from that list.
export default function ServicesEditor({ services, onChange, jobs = [] }) {
  const { t } = useLanguage();
  const update = (i, key, value) => onChange(services.map((s, idx) => (idx === i ? { ...s, [key]: value } : s)));
  const remove = (i) => onChange(services.filter((_, idx) => idx !== i));
  const chooseJob = (i, jobId) => {
    const job = jobs.find((j) => j.id === jobId);
    onChange(services.map((s, idx) => (idx === i ? { ...s, job: jobId, name: job?.name || '' } : s)));
  };

  return (
    <div className="space-y-2">
      {services.length === 0 && <p className="text-sm text-slate-400">{t('servicesEditor.none')}</p>}
      {services.map((s, i) => (
        <div key={s._id || i} className="grid grid-cols-[1fr_96px_auto] gap-2 sm:grid-cols-[1fr_110px_110px_auto]">
          {jobs.length > 0 ? (
            <select
              className={controlClass}
              value={s.job || ''}
              onChange={(e) => chooseJob(i, e.target.value)}
              aria-label={`${t('servicesEditor.name')} ${i + 1}`}
              required
            >
              <option value="">{t('servicesEditor.chooseJob')}</option>
              {jobs
                .filter((j) => j.id === s.job || !services.some((other) => other.job === j.id))
                .map((j) => (
                  <option key={j.id} value={j.id}>
                    {t(`jobs.${j.id}`)}
                  </option>
                ))}
            </select>
          ) : (
            <input
              className={controlClass}
              placeholder={t('servicesEditor.name')}
              value={s.name}
              onChange={(e) => update(i, 'name', e.target.value)}
              aria-label={`${t('servicesEditor.name')} ${i + 1}`}
              required
            />
          )}
          <input
            className={controlClass}
            type="number"
            min="0"
            placeholder={t('servicesEditor.price')}
            value={s.price}
            onChange={(e) => update(i, 'price', e.target.value)}
            aria-label={`${t('servicesEditor.price')} ${i + 1}`}
            required
          />
          <select
            className={`${controlClass} hidden sm:block`}
            value={s.unit || 'per job'}
            onChange={(e) => update(i, 'unit', e.target.value)}
            aria-label={`${t('servicesEditor.name')} ${i + 1}: ${t('worker.perJob')}`}
          >
            {UNITS.map((u) => (
              <option key={u} value={u}>
                {t(`servicesEditor.units.${u}`)}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => remove(i)}
            className="rounded-lg px-2 text-slate-400 hover:bg-red-50 hover:text-red-600"
            aria-label={t('servicesEditor.remove', { n: i + 1 })}
          >
            ✕
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...services, { ...EMPTY }])}
        className="text-sm font-medium text-blue-600 hover:underline"
      >
        {t('servicesEditor.add')}
      </button>
    </div>
  );
}

// Converts editor rows to the API shape, dropping empty rows.
export const cleanServices = (services) =>
  services
    .filter((s) => s.name.trim() && s.price !== '')
    .map((s) => ({ name: s.name.trim(), price: Number(s.price), unit: s.unit || 'per job', job: s.job }));

// Translated label for a stored unit; unknown (custom) units are shown as-is.
export const unitLabel = (unit, t) => (UNITS.includes(unit) ? t(`servicesEditor.units.${unit}`) : unit);
