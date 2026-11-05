import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle, Send, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { askAssistant } from '../api/assistant';
import { serviceLabel } from '../data/categories';
import { formatScheduleDate, formatTime } from '../utils/bookings';
import { formatDate, formatPrice } from '../utils/format';

// Buttons that ask a question for you, by topic.
const SUGGESTIONS = {
  customer: ['bookings', 'payments', 'reviews', 'dashboard'],
  worker: ['bookings', 'earnings', 'reviews', 'dashboard'],
};

// Turns the raw values in a reply into text in the person's language.
function displayVars(vars, t) {
  const shown = { ...vars };
  Object.keys(shown).forEach((name) => {
    if (name === 'amount' || name.endsWith('Amount')) shown[name] = formatPrice(shown[name]);
  });
  if (shown.date) shown.date = formatDate(shown.date);
  if (shown.scheduleDate) shown.scheduleDate = formatScheduleDate(shown.scheduleDate);
  if (shown.time) shown.time = formatTime(shown.time);
  if (shown.service) shown.service = serviceLabel(shown.service, t);
  if (shown.status) shown.status = t(`booking.status.${shown.status}`);
  if (shown.method) shown.method = t(`booking.methods.${shown.method}`);
  if (shown.accountStatus) shown.accountStatus = t(`admin.status.${shown.accountStatus}`);
  if (shown.verified) shown.verified = t(`assistant.${shown.verified}`);
  if (shown.availability) shown.availability = t(`assistant.${shown.availability}`);
  return shown;
}

// Floating chat button and small chat box, for logged-in customers and workers.
// Answers about their own bookings, payments, reviews and earnings.
export default function AssistantChat() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const endRef = useRef(null);
  const userId = user?._id;

  // A new login starts a new conversation.
  useEffect(() => {
    setMessages([]);
    setOpen(false);
  }, [userId]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' });
  }, [messages, sending, open]);

  if (user?.role !== 'customer' && user?.role !== 'worker') return null;

  const send = async (text, intent) => {
    const message = text.trim();
    if (!message || sending) return;
    setDraft('');
    setSending(true);
    setMessages((list) => [...list, { from: 'user', text: message }]);
    try {
      const reply = await askAssistant(message, intent);
      setMessages((list) => [...list, { from: 'bot', lines: reply.lines, links: reply.links }]);
    } catch {
      setMessages((list) => [...list, { from: 'bot', lines: [{ key: 'assistant.failed' }], links: [] }]);
    } finally {
      setSending(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    send(draft);
  };

  return (
    <div className="fixed bottom-5 right-5 z-40 flex flex-col items-end gap-3">
      {open && (
        <section
          className="flex h-[32rem] max-h-[calc(100vh-7rem)] w-[calc(100vw-2.5rem)] max-w-sm flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lift"
          aria-label={t('assistant.title')}
        >
          <header className="flex flex-none items-center justify-between gap-3 bg-navy px-4 py-3 text-white">
            <div>
              <h2 className="text-sm font-semibold">{t('assistant.title')}</h2>
              <p className="text-xs text-white/80">{t('assistant.subtitle')}</p>
            </div>
            <button type="button" onClick={() => setOpen(false)} className="rounded-full p-1 hover:bg-white/20" aria-label={t('assistant.close')}>
              <X size={18} aria-hidden="true" />
            </button>
          </header>

          <div className="flex-1 space-y-3 overflow-y-auto p-4" aria-live="polite">
            <BotBubble>{t('assistant.welcome', { name: user.name.split(' ')[0] })}</BotBubble>
            {messages.length === 0 && (
              <div className="flex flex-wrap gap-2">
                {SUGGESTIONS[user.role].map((intent) => (
                  <button
                    key={intent}
                    type="button"
                    onClick={() => send(t(`assistant.suggest.${intent}`), intent)}
                    className="rounded-full border border-blue-300 px-3 py-1.5 text-xs font-medium text-blue-700 transition hover:bg-blue-50"
                  >
                    {t(`assistant.suggest.${intent}`)}
                  </button>
                ))}
              </div>
            )}

            {messages.map((m, i) =>
              m.from === 'user' ? (
                <p key={i} className="ml-auto w-fit max-w-[85%] break-words rounded-2xl rounded-tr-sm bg-navy px-3 py-2 text-sm text-white">
                  {m.text}
                </p>
              ) : (
                <div key={i} className="space-y-2">
                  <BotBubble>
                    {m.lines.map((l, n) => (
                      <p key={n} className={n ? 'mt-2' : ''}>
                        {t(l.key, displayVars(l.vars || {}, t))}
                      </p>
                    ))}
                  </BotBubble>
                  {m.links?.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {m.links.map((l) => (
                        <Link key={l.to} to={l.to} onClick={() => setOpen(false)} className="btn btn-secondary btn-sm">
                          {t(l.label)}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )
            )}

            {sending && <BotBubble>{t('assistant.thinking')}</BotBubble>}
            <div ref={endRef} />
          </div>

          <form onSubmit={handleSubmit} className="flex flex-none items-center gap-2 border-t border-slate-200 p-3">
            <input
              className="input min-w-0 flex-1 py-2 text-sm"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              maxLength={500}
              placeholder={t('assistant.placeholder')}
              aria-label={t('assistant.placeholder')}
            />
            <button
              type="submit"
              disabled={sending || !draft.trim()}
              className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-navy text-white transition hover:bg-blue-700 disabled:opacity-50"
              aria-label={t('assistant.send')}
              title={t('assistant.send')}
            >
              <Send size={16} aria-hidden="true" />
            </button>
          </form>
        </section>
      )}

      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-white bg-navy text-white shadow-lift transition hover:bg-blue-700"
        aria-label={t('assistant.title')}
        aria-expanded={open}
        title={t('assistant.title')}
      >
        {open ? <X size={24} aria-hidden="true" /> : <MessageCircle size={24} aria-hidden="true" />}
      </button>
    </div>
  );
}

function BotBubble({ children }) {
  return <div className="w-fit max-w-[90%] break-words rounded-2xl rounded-tl-sm bg-blue-50 px-3 py-2 text-sm text-slate-800">{children}</div>;
}
