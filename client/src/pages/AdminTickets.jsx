import { useEffect, useState } from 'react';
import AdminLayout from '../components/AdminLayout';
import { FilterChips, Pager } from '../components/AdminUi';
import { SEVERITIES, SeverityBadge, TICKET_STATUSES, TicketCounts, ticketRef } from '../components/TicketUi';
import { listAllTickets, setTicketStatus } from '../api/tickets';
import { errorMessage } from '../api/client';
import { useLanguage } from '../context/LanguageContext';
import { formatDate, formatDateTime } from '../utils/format';
import { serviceLabel } from '../data/categories';

// /admin/tickets — every ticket raised by customers and workers, newest first.
export default function AdminTickets() {
  const { t } = useLanguage();
  const [severity, setSeverity] = useState('');
  const [status, setStatus] = useState('');
  const [role, setRole] = useState('');
  const [page, setPage] = useState(1);
  const [reload, setReload] = useState(0);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => setPage(1), [severity, status, role]);

  useEffect(() => {
    let cancelled = false;
    listAllTickets({ severity: severity || undefined, status: status || undefined, role: role || undefined, page, limit: 20 })
      .then((res) => !cancelled && (setData(res), setError(null)))
      .catch((err) => !cancelled && setError(errorMessage(err, t('common.loadError'))));
    return () => {
      cancelled = true;
    };
  }, [severity, status, role, page, reload]);

  const changeStatus = async (id, next) => {
    try {
      await setTicketStatus(id, next);
      setReload((n) => n + 1);
    } catch (err) {
      setError(errorMessage(err, t('common.error')));
    }
  };

  const all = { id: '', label: t('filter.any') };

  return (
    <AdminLayout title={t('support.ticketsRaised')}>
      {data && <TicketCounts counts={data.counts} />}

      <div className="mt-5 space-y-3">
        <Filter label={t('support.severityLabel')}>
          <FilterChips
            label={t('support.severityLabel')}
            value={severity}
            onChange={setSeverity}
            options={[all, ...SEVERITIES.map((id) => ({ id, label: t(`support.severity.${id}`) }))]}
          />
        </Filter>
        <Filter label={t('support.statusLabel')}>
          <FilterChips
            label={t('support.statusLabel')}
            value={status}
            onChange={setStatus}
            options={[all, ...TICKET_STATUSES.map((id) => ({ id, label: t(`support.status.${id}`) }))]}
          />
        </Filter>
        <Filter label={t('support.raisedBy')}>
          <FilterChips
            label={t('support.raisedBy')}
            value={role}
            onChange={setRole}
            options={[all, ...['customer', 'worker'].map((id) => ({ id, label: t(`nav.roles.${id}`) }))]}
          />
        </Filter>
      </div>

      {error && <p className="mt-4 rounded-xl bg-rose-50 p-4 text-rose-700">{error}</p>}

      <div className="card mt-5 overflow-hidden">
        {!data ? (
          <div className="m-5 h-64 animate-pulse rounded-xl bg-slate-100" />
        ) : data.tickets.length === 0 ? (
          <p className="p-8 text-center text-slate-500">{t('support.noMatchingTickets')}</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-3">{t('support.raisedOn')}</th>
                    <th className="px-5 py-3">{t('support.severityLabel')}</th>
                    <th className="px-5 py-3">{t('support.raisedBy')}</th>
                    <th className="min-w-[16rem] px-5 py-3">{t('support.subject')}</th>
                    <th className="px-5 py-3">{t('support.statusLabel')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 align-top">
                  {data.tickets.map((ticket) => (
                    <tr key={ticket._id}>
                      <td className="whitespace-nowrap px-5 py-3">
                        <p className="font-medium text-navy">{formatDateTime(ticket.createdAt)}</p>
                        <p className="text-xs text-slate-400">{ticketRef(ticket._id)}</p>
                      </td>
                      <td className="px-5 py-3">
                        <SeverityBadge severity={ticket.severity} />
                      </td>
                      <td className="px-5 py-3">
                        <p className="font-medium text-navy">{ticket.raisedBy?.name || '—'}</p>
                        <p className="text-xs text-slate-500">{t(`nav.roles.${ticket.raisedByRole}`)}</p>
                        <p className="text-xs text-slate-500">{ticket.raisedBy?.email}</p>
                        <p className="text-xs text-slate-500">{ticket.raisedBy?.phone}</p>
                      </td>
                      <td className="px-5 py-3">
                        <p className="break-words font-medium text-navy">{ticket.subject}</p>
                        <p className="mt-1 whitespace-pre-line break-words text-slate-600">{ticket.message}</p>
                        {ticket.bookingId && (
                          <p className="mt-1 text-xs text-slate-500">
                            {t('support.relatedBooking')}: {serviceLabel(ticket.bookingId.serviceName, t)}, {formatDate(ticket.bookingId.scheduledDate)}
                          </p>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        <select
                          className="input w-36 py-1.5 text-sm"
                          value={ticket.status}
                          onChange={(e) => changeStatus(ticket._id, e.target.value)}
                          aria-label={`${t('support.statusLabel')} ${ticketRef(ticket._id)}`}
                        >
                          {TICKET_STATUSES.map((s) => (
                            <option key={s} value={s}>
                              {t(`support.status.${s}`)}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pager page={data.page} pages={data.pages} total={data.total} noun="ticket" onPage={setPage} />
          </>
        )}
      </div>
    </AdminLayout>
  );
}

function Filter({ label, children }) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
      <span className="w-24 text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</span>
      {children}
    </div>
  );
}
