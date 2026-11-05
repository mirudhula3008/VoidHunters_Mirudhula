// FixIT Choice recommendation engine.
// Scores each worker out of 100 from their ratings, reviews and profile skills,
// then picks the best available worker in a set of search results.

const PRIOR_RATING = 3.5; // A worker with few reviews starts near this rating...
const PRIOR_REVIEWS = 5; // ...until about this many reviews outweigh it.
const FULL_REVIEWS = 20;
const FULL_EXPERIENCE_YEARS = 15;
const FULL_SKILLS = 8;

const WEIGHTS = { rating: 50, reviews: 20, skills: 15, experience: 15 };

// The minimum a worker needs to earn the badge at all.
const MIN_CHOICE_RATING = 4;
const MIN_CHOICE_REVIEWS = 2;

const capped = (value, full) => Math.min(value / full, 1);

function scoreWorker(worker) {
  const reviews = worker.totalReviews || 0;
  const rating = worker.averageRating || 0;

  // Weighted average, so one 5-star review doesn't beat fifty 4.8-star ones.
  const fairRating = (reviews * rating + PRIOR_REVIEWS * PRIOR_RATING) / (reviews + PRIOR_REVIEWS);

  const score =
    WEIGHTS.rating * (fairRating / 5) +
    WEIGHTS.reviews * capped(Math.log1p(reviews), Math.log1p(FULL_REVIEWS)) +
    WEIGHTS.skills * capped(worker.services?.length || 0, FULL_SKILLS) +
    WEIGHTS.experience * capped(worker.experienceYears || 0, FULL_EXPERIENCE_YEARS);

  return Math.round(score * 10) / 10;
}

const canBeChoice = (worker) =>
  worker.availability && worker.averageRating >= MIN_CHOICE_RATING && worker.totalReviews >= MIN_CHOICE_REVIEWS;

// Adds recommendationScore to every worker and fixitChoice to the single best one, if any qualifies.
function rankWorkers(workers) {
  const scored = workers.map((worker) => ({ ...worker, recommendationScore: scoreWorker(worker), fixitChoice: false }));

  const best = scored.filter(canBeChoice).reduce((top, worker) => {
    if (!top || worker.recommendationScore > top.recommendationScore) return worker;
    return top;
  }, null);
  if (best) best.fixitChoice = true;

  return scored;
}

module.exports = { scoreWorker, rankWorkers };
