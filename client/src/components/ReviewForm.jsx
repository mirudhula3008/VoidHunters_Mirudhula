import { useEffect, useState } from 'react';
import { ImagePlus, X } from 'lucide-react';
import StarRating from './StarRating';
import { createReview } from '../api/reviews';
import { errorMessage } from '../api/client';
import { useLanguage } from '../context/LanguageContext';

const MAX_COMMENT = 1000;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

// Drop-in review form for a completed booking. Module 3's My Bookings page can
// render this inline, or link to /review/:bookingId.
export default function ReviewForm({ bookingId, workerName, onSubmitted }) {
  const { t } = useLanguage();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!image) return setPreview(null);
    const url = URL.createObjectURL(image);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [image]);

  const handleImage = (e) => {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;
    if (!IMAGE_TYPES.includes(file.type)) return setError(t('review.photoType'));
    if (file.size > MAX_IMAGE_BYTES) return setError(t('review.photoTooLarge'));
    setError(null);
    setImage(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!rating) {
      setError(t('review.chooseRating'));
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const result = await createReview({ bookingId, rating, comment, image });
      onSubmitted?.(result);
    } catch (err) {
      setError(errorMessage(err, t('review.submitFailed')));
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <p className="text-sm font-medium text-slate-700">
          {workerName ? t('review.howWasWith', { name: workerName }) : t('review.rateExperience')}
        </p>
        <div className="mt-2">
          <StarRating value={rating} onChange={setRating} size="lg" showLabel />
        </div>
      </div>

      <label className="block">
        <span className="text-sm font-medium text-slate-700">{t('review.yourReview')}</span>
        <textarea
          rows={4}
          maxLength={MAX_COMMENT}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder={t('review.placeholder')}
          className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
        />
        <span className="mt-1 block text-right text-xs text-slate-400">
          {comment.length}/{MAX_COMMENT}
        </span>
      </label>

      <div>
        <span className="block text-sm font-medium text-slate-700">{t('review.addPhoto')}</span>
        {preview ? (
          <div className="relative mt-2 inline-block">
            <img src={preview} alt={t('review.photoAlt')} className="h-32 w-32 rounded-xl border border-slate-200 object-cover" />
            <button
              type="button"
              onClick={() => setImage(null)}
              className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-card hover:text-red-600"
              aria-label={t('review.removePhoto')}
              title={t('review.removePhoto')}
            >
              <X size={15} aria-hidden="true" />
            </button>
          </div>
        ) : (
          <label className="mt-2 flex h-32 w-32 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-slate-300 text-slate-500 transition hover:border-blue-400 hover:text-blue-600">
            <ImagePlus size={24} aria-hidden="true" />
            <span className="sr-only">{t('review.addPhoto')}</span>
            <input type="file" accept={IMAGE_TYPES.join(',')} onChange={handleImage} className="sr-only" />
          </label>
        )}
        <span className="mt-1 block text-xs text-slate-400">{t('review.photoHint')}</span>
      </div>

      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="btn btn-primary w-full py-3"
      >
        {submitting ? t('review.submitting') : t('review.submit')}
      </button>
    </form>
  );
}
