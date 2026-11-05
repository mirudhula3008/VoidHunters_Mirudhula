import { useEffect, useState } from 'react';
import { Pager } from '../components/AdminUi';
import { TICKET_RAISED_EVENT } from '../components/SupportChat';
import { SeverityBadge, TicketCounts, TicketStatusBadge, ticketRef } from '../components/TicketUi';
import { getMyTickets } from '../api/tickets';
import { errorMessage } from '../api/client';
import { useLanguage } from '../context/LanguageContext';
import { formatDateTime } from '../utils/format';

// /support/tickets — the tickets a customer or worker has raised.
export default function MyTickets() {
  const { t } = useLanguage();
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const load = () =>
      getMyTickets({ page, limit: 20 })
        .then((res) => !cancelled && (setData(res), setError(null)))
        .catch((err) => !cancelled && setError(errorMessage(err, t('common.loadError'))));

    load();
    window.addEventListener(TICKET_RAISED_EVENT, load);
    return () => {
      cancelled = true;
      window.removeEventListener(TICKET_RAISED_EVENT, load);
    };
  }, [page]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="font-display text-3xl text-navy sm:text-4xl">{t('support.ticketsRaised')}</h1>
      <p className="mt-2 text-slate-500">{t('support.ticketsSubtitle')}</p>

      {error && <p className="mt-4 rounded-xl bg-rose-50 p-4 text-rose-700">{error}</p>}

      {!data ? (
        !error && <div className="mt-6 h-64 animate-pulse rounded-xl bg-slate-100" />
      ) : (
        <>
          <div className="mt-6">
            <TicketCounts counts={data.counts} />
          </div>

          <div className="card mt-5 overflow-hidden">
            {data.tickets.length === 0 ? (
              <p className="p-8 text-center text-slate-500">{t('support.noTickets')}</p>
            ) : (
              <>
                <ul className="divide-y divide-slate-100">
                  {data.tickets.map((ticket) => (
                    <li key={ticket._id} className="p-5">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-slate-400">{ticketRef(ticket._id)}</p>
                          <h2 className="break-words font-semibold text-navy">{ticket.subject}</h2>
                        </div>
                        <span className="flex flex-wrap gap-1.5">
                          <SeverityBadge severity={ticket.severity} />
                          <TicketStatusBadge status={ticket.status} />
                        </span>
                      </div>
                      <p className="mt-2 whitespace-pre-line break-words text-sm text-slate-600">{ticket.message}</p>
                      <p className="mt-2 text-xs text-slate-500">
                        {t('support.raisedOn')}: <span className="font-medium">{formatDateTime(ticket.createdAt)}</span>
                      </p>
                    </li>
                  ))}
                </ul>
                <Pager page={data.page} pages={data.pages} total={data.total} noun="ticket" onPage={setPage} />
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
