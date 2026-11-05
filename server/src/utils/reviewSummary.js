const Review = require('../models/Review');

// What customers tend to mention, by keyword. The browser shows each theme in the person's language.
const THEMES = {
  punctual: ['on time', 'punctual', 'quickly', 'fast'],
  quality: ['professional', 'excellent', 'skilled', 'quality', 'good work', 'well done', 'great'],
  price: ['fair price', 'price', 'worth', 'affordable', 'value'],
  polite: ['polite', 'friendly', 'kind', 'explained', 'helpful'],
  tidy: ['neat', 'tidy', 'clean'],
  slow: ['late', 'delay', 'longer than'],
};
const NEGATIVE = ['slow'];
const MAX_THEMES = 3;
const MAX_REVIEWS = 500;

// A short summary of a worker's reviews, worked out from the reviews themselves.
async function summarizeReviews(workerId) {
  const reviews = await Review.find({ workerId }).sort({ createdAt: -1 }).limit(MAX_REVIEWS).select('rating comment image').lean();
  const total = reviews.length;
  if (!total) return { total: 0 };

  const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
  const positive = reviews.filter((r) => r.rating >= 4).length;

  const counts = Object.entries(THEMES).map(([id, words]) => ({
    id,
    count: reviews.filter((r) => words.some((w) => (r.comment || '').toLowerCase().includes(w))).length,
  }));
  const found = counts.filter((c) => c.count > 0).sort((a, b) => b.count - a.count);

  const withComment = reviews.filter((r) => r.comment);
  const best = withComment.filter((r) => r.rating >= 4).sort((a, b) => b.rating - a.rating)[0];
  const critical = withComment.filter((r) => r.rating <= 3).sort((a, b) => a.rating - b.rating)[0];

  return {
    total,
    average: Math.round((sum / total) * 10) / 10,
    positivePercent: Math.round((positive / total) * 100),
    praise: found.filter((c) => !NEGATIVE.includes(c.id)).slice(0, MAX_THEMES).map((c) => c.id),
    concerns: found.filter((c) => NEGATIVE.includes(c.id)).map((c) => c.id),
    best: best ? { rating: best.rating, comment: best.comment } : null,
    critical: critical ? { rating: critical.rating, comment: critical.comment } : null,
    photos: reviews.filter((r) => r.image).length,
  };
}

module.exports = { summarizeReviews };
