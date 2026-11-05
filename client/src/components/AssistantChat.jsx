import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Bot,
  CalendarCheck,
  CreditCard,
  HelpCircle,
  LayoutDashboard,
  LifeBuoy,
  MessageCircle,
  Send,
  Star,
  ThumbsDown,
  ThumbsUp,
  Ticket,
  UserCheck,
  Wallet,
  X,
} from 'lucide-react';
import Avatar from './Avatar';
import { FixitChoiceBadge } from './FixitChoice';
import { SEVERITIES, SeverityBadge, TICKET_RAISED_EVENT, TicketStatusBadge, ticketRef } from './TicketUi';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { askAssistant } from '../api/assistant';
import { createTicket } from '../api/tickets';
import { errorMessage } from '../api/client';
import { serviceLabel } from '../data/categories';
import { formatScheduleDate, formatTime } from '../utils/bookings';
import { formatDate, formatDateTime, formatDistanceShort, formatPrice, formatPriceRange } from '../utils/format';

const MENU_ICONS = {
  bookings: CalendarCheck,
  payments: CreditCard,
  earnings: Wallet,
  reviews: Star,
  suggestWorker: UserCheck,
  raiseTicket: LifeBuoy,
  myTickets: Ticket,
  dashboard: LayoutDashboard,
  account: UserCheck,
  help: HelpCircle,
};

const MENU = {
  customer: ['bookings', 'payments', 'reviews', 'suggestWorker', 'raiseTicket', 'myTickets', 'dashboard', 'help'],
  worker: ['bookings', 'earnings', 'reviews', 'account', 'raiseTicket', 'myTickets', 'dashboard', 'help'],
};

const TICKET_ISSUES = ['payment', 'booking', 'person', 'account', 'other'];
const MIN_TICKET_MESSAGE = 10;

// Turns the raw values in a reply into text in the person's language.
function displayVars(vars = {}, t) {
  const shown = { ...vars };
  Object.keys(shown).forEach((name) => {
    if (name === 'amount' || name.endsWith('Amount')) shown[name] = formatPrice(shown[name]);
  });
  if (shown.date) shown.date = formatDate(shown.date);
  if (shown.scheduleDate) shown.scheduleDate = formatScheduleDate(shown.scheduleDate);
  if (shown.time) shown.time = formatTime(shown.time);
  if (shown.service) shown.service = serviceLabel(shown.service, t);
  if (shown.category) shown.category = t(`services.${shown.category}`);
  if (shown.status) shown.status = t(`booking.status.${shown.status}`);
  if (shown.method) shown.method = t(`booking.methods.${shown.method}`);
  if (shown.accountStatus) shown.accountStatus = t(`admin.status.${shown.accountStatus}`);
  if (shown.verified) shown.verified = t(`assistant.${shown.verified}`);
  if (shown.availability) shown.availability = t(`assistant.${shown.availability}`);
  return shown;
}

// Support chat for logged-in customers and workers: a menu, cards, typed questions and tickets.
export default function AssistantChat() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [prompts, setPrompts] = useState([]);
  const [ticket, setTicket] = useState(null); // { step, issue, booking, severity } while raising a ticket
  const [ticketBookings, setTicketBookings] = useState([]);
  const endRef = useRef(null);
  const userId = user?._id;
  const role = user?.role;
  const canChat = role === 'customer' || role === 'worker';

  // A new login starts a new conversation.
  useEffect(() => {
    setMessages([]);
    setPrompts([]);
    setTicket(null);
    setOpen(false);
  }, [userId]);

  // Personal suggestions, refreshed each time the chat opens.
  useEffect(() => {
    if (!open || !canChat) return;
    askAssistant({ intent: 'welcome' })
      .then((reply) => setPrompts(reply.links || []))
      .catch(() => setPrompts([]));
  }, [open, canChat]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' });
  }, [messages, sending, open, ticket]);

  if (!canChat) return null;

  const addBot = (lines, extra = {}) => setMessages((list) => [...list, { from: 'bot', lines, ...extra }]);
  const addUser = (text) => setMessages((list) => [...list, { from: 'user', text }]);
  const say = (key, vars) => ({ key, vars });

  const startTicket = () => {
    setTicket({ step: 'issue' });
    addBot([say('assistant.ticket.askIssue')]);
    askAssistant({ intent: 'ticketBookings' })
      .then((reply) => setTicketBookings(reply.bookings || []))
      .catch(() => setTicketBookings([]));
  };

  const ask = async ({ message, intent, params, label }) => {
    if (sending) return;
    if (intent === 'menu') {
      addUser(label);
      setTicket(null);
      addBot([say('assistant.menuPrompt')], { showMenu: true });
      return;
    }
    if (intent === 'raiseTicket') {
      addUser(label);
      startTicket();
      return;
    }
    setTicket(null);
    addUser(label || message);
    setSending(true);
    try {
      const reply = await askAssistant({ message: message || label, intent, params });
      addBot(reply.lines || [], { cards: reply.cards, links: reply.links, options: reply.options, helpful: !reply.startTicket });
      if (reply.startTicket) startTicket();
    } catch {
      addBot([say('assistant.failed')], { options: [{ intent: 'menu' }] });
    } finally {
      setSending(false);
    }
  };

  const chooseIssue = (issue) => {
    addUser(t(`assistant.ticket.issues.${issue}`));
    setTicket({ step: ticketBookings.length ? 'booking' : 'severity', issue });
    addBot([say(ticketBookings.length ? 'assistant.ticket.askBooking' : 'assistant.ticket.askSeverity')]);
  };

  const chooseBooking = (booking) => {
    addUser(booking ? `${serviceLabel(booking.service, t)} · ${formatScheduleDate(booking.scheduleDate)}` : t('assistant.ticket.noBooking'));
    setTicket({ ...ticket, step: 'severity', booking });
    addBot([say('assistant.ticket.askSeverity')]);
  };

  const chooseSeverity = (severity) => {
    addUser(t(`support.severity.${severity}`));
    setTicket({ ...ticket, step: 'message', severity });
    addBot([say('assistant.ticket.askMessage')]);
  };

  const submitTicket = async (text) => {
    addUser(text);
    if (text.length < MIN_TICKET_MESSAGE) {
      addBot([say('support.errors.message')]);
      return;
    }
    setSending(true);
    try {
      const issue = t(`assistant.ticket.issues.${ticket.issue}`);
      const subject = ticket.booking ? `${issue}: ${serviceLabel(ticket.booking.service, t)}` : issue;
      const created = await createTicket({ subject, message: text, severity: ticket.severity, bookingId: ticket.booking?.id });
      setTicket(null);
      window.dispatchEvent(new Event(TICKET_RAISED_EVENT));
      addBot([say('assistant.ticket.done', { ref: ticketRef(created._id) })], {
        cards: [{ type: 'tickets', items: [created] }],
        links: [{ to: '/support/tickets', label: 'assistant.links.allTickets' }],
        options: [{ intent: 'menu' }],
      });
    } catch (err) {
      addBot([say('assistant.failedRaw', { error: errorMessage(err, t('support.errors.failed')) })]);
    } finally {
      setSending(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text || sending) return;
    setDraft('');
    if (ticket?.step === 'message') submitTicket(text);
    else ask({ message: text });
  };

  const close = () => setOpen(false);
  const menu = MENU[role];

  return (
    <div className="fixed bottom-5 right-5 z-40 flex flex-col items-end gap-3">
      {open && (
        <section
          className="flex h-[36rem] max-h-[calc(100vh-7rem)] w-[calc(100vw-2.5rem)] max-w-md flex-col overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 shadow-lift"
          aria-label={t('assistant.title')}
        >
          <header className="flex flex-none items-center justify-between gap-3 bg-navy px-4 py-3 text-white">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-white/15">
                <Bot size={20} aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <h2 className="text-sm font-semibold">{t('assistant.title')}</h2>
                <p className="truncate text-xs text-white/80">{t('assistant.subtitle')}</p>
              </div>
            </div>
            <button type="button" onClick={close} className="rounded-full p-1 hover:bg-white/20" aria-label={t('assistant.close')}>
              <X size={18} aria-hidden="true" />
            </button>
          </header>

          <div className="flex-1 space-y-3 overflow-y-auto p-3" aria-live="polite">
            <BotBubble>{t('assistant.welcome', { name: user.name.split(' ')[0] })}</BotBubble>

            {prompts.length > 0 && (
              <div className="ml-9 rounded-xl border border-slate-200 bg-white p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{t('assistant.suggestedForYou')}</p>
                <div className="mt-2 space-y-1">
                  {prompts.map((p) => (
                    <Link key={p.label} to={p.to} onClick={close} className="block text-sm font-medium text-blue-700 hover:underline">
                      {t(p.label, p.vars)} →
                    </Link>
                  ))}
                </div>
              </div>
            )}

            <MenuGrid items={menu} onPick={(intent) => ask({ intent, label: t(`assistant.menu.${intent}`) })} />

            {messages.map((m, i) =>
              m.from === 'user' ? (
                <p key={i} className="ml-auto w-fit max-w-[85%] break-words rounded-2xl rounded-tr-sm bg-navy px-3 py-2 text-sm text-white">
                  {m.text}
                </p>
              ) : (
                <div key={i} className="space-y-2">
                  {m.lines?.length > 0 && (
                    <BotBubble>
                      {m.lines.map((l, n) => (
                        <p key={n} className={n ? 'mt-2' : ''}>
                          {t(l.key, displayVars(l.vars, t))}
                        </p>
                      ))}
                    </BotBubble>
                  )}
                  {m.showMenu && <MenuGrid items={menu} onPick={(intent) => ask({ intent, label: t(`assistant.menu.${intent}`) })} />}
                  {m.cards?.map((card, n) => <ChatCard key={n} card={card} onNavigate={close} />)}
                  {m.links?.length > 0 && (
                    <div className="ml-9 flex flex-wrap gap-2">
                      {m.links.map((l) => (
                        <Link key={l.to + l.label} to={l.to} onClick={close} className="btn btn-secondary btn-sm">
                          {t(l.label, l.vars)}
                        </Link>
                      ))}
                    </div>
                  )}
                  {/* Follow-up buttons and the helpful question only belong to the latest reply. */}
                  {i === messages.length - 1 && !ticket && m.options?.length > 0 && (
                    <div className="ml-9 flex flex-wrap gap-2">
                      {m.options.map((o, n) => {
                        const label = optionLabel(o, t);
                        return <Chip key={n} onClick={() => ask({ intent: o.intent, params: o.params, label })}>{label}</Chip>;
                      })}
                    </div>
                  )}
                  {i === messages.length - 1 && !ticket && m.helpful && <Helpful onNo={startTicket} onYes={() => addBot([say('assistant.gladToHelp')], { options: [{ intent: 'menu' }] })} />}
                </div>
              )
            )}

            {ticket?.step === 'issue' && (
              <TicketOptions>
                {TICKET_ISSUES.map((issue) => (
                  <Chip key={issue} onClick={() => chooseIssue(issue)}>
                    {t(`assistant.ticket.issues.${issue}`)}
                  </Chip>
                ))}
              </TicketOptions>
            )}
            {ticket?.step === 'booking' && (
              <TicketOptions>
                {ticketBookings.map((b) => (
                  <Chip key={b.id} onClick={() => chooseBooking(b)}>
                    {serviceLabel(b.service, t)} · {formatScheduleDate(b.scheduleDate)}
                  </Chip>
                ))}
                <Chip onClick={() => chooseBooking(null)}>{t('assistant.ticket.noBooking')}</Chip>
              </TicketOptions>
            )}
            {ticket?.step === 'severity' && (
              <TicketOptions>
                {SEVERITIES.map((s) => (
                  <Chip key={s} onClick={() => chooseSeverity(s)}>
                    {t(`support.severity.${s}`)} · {t(`support.severityHelp.${s}`)}
                  </Chip>
                ))}
              </TicketOptions>
            )}
            {ticket && (
              <div className="ml-9">
                <button
                  type="button"
                  onClick={() => {
                    setTicket(null);
                    addBot([say('assistant.ticket.cancelled')], { options: [{ intent: 'menu' }] });
                  }}
                  className="text-xs font-medium text-slate-500 hover:underline"
                >
                  {t('assistant.ticket.cancel')}
                </button>
              </div>
            )}

            {sending && <BotBubble>{t('assistant.thinking')}</BotBubble>}
            <div ref={endRef} />
          </div>

          <form onSubmit={handleSubmit} className="flex flex-none items-center gap-2 border-t border-slate-200 bg-white p-3">
            <input
              className="input min-w-0 flex-1 py-2 text-sm"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              maxLength={ticket?.step === 'message' ? 2000 : 500}
              placeholder={t(ticket?.step === 'message' ? 'support.messagePlaceholder' : 'assistant.placeholder')}
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

function optionLabel(option, t) {
  if (option.text) return option.reviewOf ? t('assistant.reviewsOf', { name: option.text }) : option.text;
  if (option.service) return t(`services.${option.service}`);
  return t(`assistant.menu.${option.intent}`);
}

function BotBubble({ children }) {
  return (
    <div className="flex items-end gap-2">
      <span className="flex h-7 w-7 flex-none items-center justify-center rounded-full bg-blue-100 text-navy" aria-hidden="true">
        <Bot size={15} />
      </span>
      <div className="w-fit max-w-[85%] break-words rounded-2xl rounded-bl-sm border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800">{children}</div>
    </div>
  );
}

function Chip({ onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-full border border-blue-300 bg-white px-3 py-1.5 text-left text-xs font-medium text-blue-700 transition hover:bg-blue-50"
    >
      {children}
    </button>
  );
}

function TicketOptions({ children }) {
  return <div className="ml-9 flex flex-wrap gap-2">{children}</div>;
}

function MenuGrid({ items, onPick }) {
  const { t } = useLanguage();
  return (
    <div className="ml-9 grid grid-cols-2 gap-2">
      {items.map((intent) => {
        const Icon = MENU_ICONS[intent] || HelpCircle;
        return (
          <button
            key={intent}
            type="button"
            onClick={() => onPick(intent)}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-left text-xs font-semibold text-navy transition hover:border-blue-400 hover:bg-blue-50"
          >
            <Icon size={16} className="flex-none text-blue-600" aria-hidden="true" />
            <span className="min-w-0">{t(`assistant.menu.${intent}`)}</span>
          </button>
        );
      })}
    </div>
  );
}

function Helpful({ onYes, onNo }) {
  const { t } = useLanguage();
  return (
    <div className="ml-9 flex flex-wrap items-center gap-2 text-xs text-slate-500">
      <span>{t('assistant.wasHelpful')}</span>
      <button type="button" onClick={onYes} className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2 py-1 hover:bg-blue-50">
        <ThumbsUp size={12} aria-hidden="true" /> {t('assistant.yes')}
      </button>
      <button type="button" onClick={onNo} className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2 py-1 hover:bg-blue-50">
        <ThumbsDown size={12} aria-hidden="true" /> {t('assistant.no')}
      </button>
    </div>
  );
}

function ChatCard({ card, onNavigate }) {
  const body =
    card.type === 'bookings' ? <BookingsCard items={card.items} onNavigate={onNavigate} /> :
    card.type === 'earnings' ? <EarningsCard card={card} /> :
    card.type === 'reviewSummary' ? <ReviewSummaryCard card={card} onNavigate={onNavigate} /> :
    card.type === 'workers' ? <WorkersCard items={card.items} onNavigate={onNavigate} /> :
    card.type === 'tickets' ? <TicketsCard items={card.items} /> : null;
  return body && <div className="ml-9 overflow-hidden rounded-xl border border-slate-200 bg-white">{body}</div>;
}

function BookingsCard({ items, onNavigate }) {
  const { t } = useLanguage();
  if (!items.length) return <p className="p-3 text-sm text-slate-500">{t('assistant.noBookingsYet')}</p>;
  return (
    <ul className="divide-y divide-slate-100">
      {items.map((b) => (
        <li key={b.id} className="p-3 text-sm">
          <div className="flex items-start justify-between gap-2">
            <p className="min-w-0 font-semibold text-navy">{serviceLabel(b.service, t)}</p>
            <span className="badge badge-outline flex-none">{t(`booking.status.${b.status}`)}</span>
          </div>
          <p className="mt-0.5 text-xs text-slate-500">
            {b.name} · {formatScheduleDate(b.scheduleDate)}, {formatTime(b.time)}
          </p>
          <div className="mt-1.5 flex flex-wrap items-center justify-between gap-2">
            <span className="font-semibold text-navy">
              {formatPrice(b.price)} <span className="text-xs font-normal text-slate-500">· {t(`assistant.paymentStatus.${b.paymentStatus}`)}</span>
            </span>
            <span className="flex gap-2">
              {b.canPay && <Link to={`/payment/${b.id}`} onClick={onNavigate} className="btn btn-primary btn-sm">{t('assistant.links.payNow')}</Link>}
              {b.canReview && <Link to={`/review/${b.id}`} onClick={onNavigate} className="btn btn-secondary btn-sm">{t('assistant.links.writeReview')}</Link>}
            </span>
          </div>
        </li>
      ))}
    </ul>
  );
}

function EarningsCard({ card }) {
  const { t } = useLanguage();
  const cells = [
    ['today', card.today],
    ['week', card.week],
    ['month', card.month],
    ['lifetime', card.lifetime],
  ];
  return (
    <div className="p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{t('assistant.earnings.title')}</p>
      <div className="mt-2 grid grid-cols-2 gap-2">
        {cells.map(([key, value]) => (
          <div key={key} className="rounded-lg bg-slate-50 p-2">
            <p className="text-xs text-slate-500">{t(`assistant.earnings.${key}`)}</p>
            <p className="font-bold text-navy">{formatPrice(value)}</p>
          </div>
        ))}
      </div>
      <p className="mt-2 text-xs text-slate-500">{t('assistant.earnings.foot', { jobs: card.jobs, pending: formatPrice(card.pending) })}</p>
    </div>
  );
}

function ReviewSummaryCard({ card, onNavigate }) {
  const { t } = useLanguage();
  const { worker } = card;
  return (
    <div className="p-3 text-sm">
      <div className="flex items-center gap-3">
        <Avatar person={worker} className="h-10 w-10" />
        <div className="min-w-0">
          <p className="truncate font-semibold text-navy">{worker.name}</p>
          {card.total > 0 ? (
            <p className="text-xs text-slate-500">
              <span className="font-semibold text-amber-600">★ {card.average.toFixed(1)}</span> · {t('assistant.review.count', { count: card.total })} · {t('assistant.review.positive', { percent: card.positivePercent })}
            </p>
          ) : (
            <p className="text-xs text-slate-500">{t('assistant.review.none')}</p>
          )}
        </div>
      </div>

      {card.praise?.length > 0 && (
        <div className="mt-2">
          <p className="text-xs font-semibold text-slate-500">{t('assistant.review.praise')}</p>
          <div className="mt-1 flex flex-wrap gap-1">
            {card.praise.map((id) => <span key={id} className="badge badge-verified">{t(`assistant.review.themes.${id}`)}</span>)}
          </div>
        </div>
      )}
      {card.concerns?.length > 0 && (
        <div className="mt-2">
          <p className="text-xs font-semibold text-slate-500">{t('assistant.review.concerns')}</p>
          <div className="mt-1 flex flex-wrap gap-1">
            {card.concerns.map((id) => <span key={id} className="badge badge-negotiable">{t(`assistant.review.themes.${id}`)}</span>)}
          </div>
        </div>
      )}
      {card.best && <p className="mt-2 rounded-lg bg-slate-50 p-2 text-xs text-slate-600">{card.best.rating}★ “{card.best.comment}”</p>}
      {card.critical && <p className="mt-1 rounded-lg bg-slate-50 p-2 text-xs text-slate-600">{card.critical.rating}★ “{card.critical.comment}”</p>}

      <Link to={`/workers/${worker.id}`} onClick={onNavigate} className="btn btn-secondary btn-sm mt-3">
        {t('assistant.links.viewProfile')}
      </Link>
    </div>
  );
}

function WorkersCard({ items, onNavigate }) {
  const { t } = useLanguage();
  return (
    <ul className="divide-y divide-slate-100">
      {items.map((w) => (
        <li key={w.id} className="flex items-center gap-3 p-3 text-sm">
          <Avatar person={w} className="h-10 w-10" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <p className="font-semibold text-navy">{w.name}</p>
              {w.fixitChoice && <FixitChoiceBadge />}
            </div>
            <p className="text-xs text-slate-500">
              <span className="font-semibold text-amber-600">★ {(w.rating || 0).toFixed(1)}</span> ({w.reviews}) · {formatDistanceShort(w.distance, t)}
              {w.minPrice != null && ` · ${formatPriceRange(w.minPrice, w.maxPrice)}`}
            </p>
          </div>
          <Link to={`/workers/${w.id}`} state={{ fixitChoice: Boolean(w.fixitChoice) }} onClick={onNavigate} className="btn btn-secondary btn-sm flex-none">
            {t('assistant.links.view')}
          </Link>
        </li>
      ))}
    </ul>
  );
}

function TicketsCard({ items }) {
  return (
    <ul className="divide-y divide-slate-100">
      {items.map((ticket) => (
        <li key={ticket._id} className="p-3 text-sm">
          <p className="text-xs font-semibold text-slate-400">{ticketRef(ticket._id)}</p>
          <p className="break-words font-semibold text-navy">{ticket.subject}</p>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <SeverityBadge severity={ticket.severity} />
            <TicketStatusBadge status={ticket.status} />
          </div>
          <p className="mt-1 text-xs text-slate-500">{formatDateTime(ticket.createdAt)}</p>
        </li>
      ))}
    </ul>
  );
}
