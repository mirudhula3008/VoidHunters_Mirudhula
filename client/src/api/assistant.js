import api from './client';

export const askAssistant = (message, intent) => api.post('/assistant', { message, intent }).then((r) => r.data);
