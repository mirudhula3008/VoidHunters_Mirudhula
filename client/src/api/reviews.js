import api from './client';

export const createReview = ({ bookingId, rating, comment, image }) => {
  const data = new FormData();
  data.append('bookingId', bookingId);
  data.append('rating', rating);
  data.append('comment', comment);
  if (image) data.append('image', image);
  return api.post('/reviews', data).then((r) => r.data);
};

export const getReviewsForWorker = (workerId, page = 1, limit = 5) =>
  api.get(`/reviews/worker/${workerId}`, { params: { page, limit } }).then((r) => r.data);

export const getReviewForBooking = (bookingId) => api.get(`/reviews/booking/${bookingId}`).then((r) => r.data.review);
