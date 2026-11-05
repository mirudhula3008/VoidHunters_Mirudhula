import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle, X } from 'lucide-react';
import { SEVERITIES, ticketRef } from './TicketUi';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { createTicket } from '../api/tickets';
import { errorMessage } from '../api/client';
import { formatDateTime } from '../utils/format';

const EMPTY = { subject: '', message: '', severity: 'medium' };
const MIN_MESSAGE = 10;

// Tells an open tickets page to reload after a ticket is raised from the chat box.
export const TICKET_RAISED_EVENT = 'fixit:ticket-raised';

// Floating support button and small chat box, for logged-in customers and workers.
export default function SupportChat() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [raised, setRaised] = useState(null);
  const [error, setError] = useState(null);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!open) {
      // Reopening starts with a fresh form, not the last confirmation.
      setRaised(null);
      setError(null);
      return undefined;
    }
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  if (user?.role !== 'customer' && user?.role !== 'worker') return null;

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.subject.trim()) return setError(t('support.errors.subject'));
    if (form.message.trim().length < MIN_MESSAGE) return setError(t('support.errors.message'));

    setError(null);
    setSending(true);
    try {
      setRaised(await createTicket(form));
      setForm(EMPTY);
      window.dispatchEvent(new Event(TICKET_RAISED_EVENT));
    } catch (err) {
      setError(errorMessage(err, t('support.errors.failed')));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-40 flex flex-col items-end gap-3">
      {open && (
        <section
          className="flex max-h-[calc(100vh-7rem)] w-[calc(100vw-2.5rem)] max-w-sm flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lift"
          aria-label={t('support.title')}
        >
          <header className="flex items-center justify-between gap-3 bg-navy px-4 py-3 text-white">
            <div>
              <h2 className="text-sm font-semibold">{t('support.title')}</h2>
              <p className="text-xs text-white/80">{t('support.subtitle')}</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-full p-1 hover:bg-white/20"
              aria-label={t('support.close')}
            >
              <X size={18} aria-hidden="true" />
            </button>
          </header>

          <div className="space-y-3 overflow-y-auto p-4">
            <p className="w-fit max-w-[90%] rounded-2xl rounded-tl-sm bg-blue-50 px-3 py-2 text-sm text-slate-800">
              {t('support.greeting', { name: user.name.split(' ')[0] })}
            </p>

            {raised ? (
              <>
                <div className="w-fit max-w-[90%] rounded-2xl rounded-tl-sm bg-emerald-50 px-3 py-2 text-sm text-emerald-800" role="status">
                  <p className="font-semibold">{t('support.raised', { ref: ticketRef(raised._id) })}</p>
                  <p className="mt-1">{formatDateTime(raised.createdAt)}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link to="/support/tickets" onClick={() => setOpen(false)} className="btn btn-primary btn-sm">
                    {t('support.viewTickets')}
                  </Link>
                  <button type="button" onClick={() => setRaised(null)} className="btn btn-secondary btn-sm">
                    {t('support.raiseAnother')}
                  </button>
                </div>
              </>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3">
                <label className="block">
                  <span className="text-xs font-medium text-slate-700">{t('support.subject')}</span>
                  <input
                    className="input mt-1 py-2 text-sm"
                    value={form.subject}
                    onChange={set('subject')}
                    maxLength={120}
                    placeholder={t('support.subjectPlaceholder')}
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-medium text-slate-700">{t('support.severityLabel')}</span>
                  <select className="input mt-1 py-2 text-sm" value={form.severity} onChange={set('severity')}>
                    {SEVERITIES.map((s) => (
                      <option key={s} value={s}>
                        {t(`support.severity.${s}`)} · {t(`support.severityHelp.${s}`)}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="text-xs font-medium text-slate-700">{t('support.message')}</span>
                  <textarea
                    rows={3}
                    className="input mt-1 py-2 text-sm"
                    value={form.message}
                    onChange={set('message')}
                    maxLength={2000}
                    placeholder={t('support.messagePlaceholder')}
                  />
                </label>
                {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>}
                <button type="submit" disabled={sending} className="btn btn-primary w-full">
                  {sending ? t('support.sending') : t('support.raiseTicket')}
                </button>
              </form>
            )}
          </div>
        </section>
      )}

      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-white bg-navy text-white shadow-lift transition hover:bg-blue-700"
        aria-label={t('support.title')}
        aria-expanded={open}
        title={t('support.title')}
      >
        {open ? <X size={24} aria-hidden="true" /> : <MessageCircle size={24} aria-hidden="true" />}
      </button>
    </div>
  );
}
