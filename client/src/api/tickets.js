import api from './client';

export const createTicket = (ticket) => api.post('/tickets', ticket).then((r) => r.data);

export const getMyTickets = (params) => api.get('/tickets/mine', { params }).then((r) => r.data);

export const listAllTickets = (params) => api.get('/admin/tickets', { params }).then((r) => r.data);

export const setTicketStatus = (id, status) => api.patch(`/admin/tickets/${id}/status`, { status }).then((r) => r.data);
