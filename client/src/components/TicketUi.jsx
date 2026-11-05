import { AlertOctagon, AlertTriangle, ArrowDown, CheckCircle2, CircleDot, Clock, Minus } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export const SEVERITIES = ['low', 'medium', 'high', 'critical'];
export const TICKET_STATUSES = ['open', 'in_progress', 'resolved'];

// Tells an open tickets page to reload after a ticket is raised from the chat box.
export const TICKET_RAISED_EVENT = 'fixit:ticket-raised';

const SEVERITY_STYLE = {
  low: { Icon: ArrowDown, badge: 'bg-slate-100 text-slate-600' },
  medium: { Icon: Minus, badge: 'bg-blue-50 text-blue-700' },
  high: { Icon: AlertTriangle, badge: 'bg-amber-100 text-amber-700' },
  critical: { Icon: AlertOctagon, badge: 'bg-rose-100 text-rose-700' },
};

const STATUS_STYLE = {
  open: { Icon: CircleDot, badge: 'bg-blue-50 text-blue-700' },
  in_progress: { Icon: Clock, badge: 'bg-amber-100 text-amber-700' },
  resolved: { Icon: CheckCircle2, badge: 'bg-emerald-50 text-emerald-700' },
};

// Short reference shown to people, from the end of the database id.
export const ticketRef = (id) => `#${String(id).slice(-6).toUpperCase()}`;

// Badges always show an icon and a label, never colour alone.
export function SeverityBadge({ severity }) {
  const { t } = useLanguage();
  const { Icon, badge } = SEVERITY_STYLE[severity] || SEVERITY_STYLE.medium;
  return (
    <span className={`badge ${badge}`}>
      <Icon size={12} strokeWidth={2.5} aria-hidden="true" /> {t(`support.severity.${severity}`)}
    </span>
  );
}

export function TicketStatusBadge({ status }) {
  const { t } = useLanguage();
  const { Icon, badge } = STATUS_STYLE[status] || STATUS_STYLE.open;
  return (
    <span className={`badge ${badge}`}>
      <Icon size={12} strokeWidth={2.5} aria-hidden="true" /> {t(`support.status.${status}`)}
    </span>
  );
}

// Total, open, in progress and resolved counts.
export function TicketCounts({ counts }) {
  const { t } = useLanguage();
  const cards = [
    { label: t('support.total'), value: counts.total },
    ...TICKET_STATUSES.map((status) => ({ label: t(`support.status.${status}`), value: counts[status] })),
  ];
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {cards.map((card) => (
        <div key={card.label} className="card p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{card.label}</p>
          <p className="mt-1 text-2xl font-bold text-navy">{card.value}</p>
        </div>
      ))}
    </div>
  );
}
