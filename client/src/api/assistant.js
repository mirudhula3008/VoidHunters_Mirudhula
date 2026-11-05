import api from './client';

export const askAssistant = ({ message, intent, params }) => api.post('/assistant', { message, intent, params }).then((r) => r.data);
