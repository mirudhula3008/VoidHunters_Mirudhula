import { useState } from 'react';

// Profile picture: the uploaded photo, else a drawn face matching the person's gender,
// else their initial. Drawn locally, so it also works without internet.
const BACKGROUNDS = ['#DBE7FB', '#DDF1E6', '#F8EBD3', '#E8E3F5'];
const SKIN = ['#C68642', '#A9714B', '#8D5524', '#B97A4E'];
const HAIR = ['#1F1A17', '#2B2220', '#3A2A20'];
const CLOTHES = ['#1B2A4A', '#2563EB', '#0F766E', '#B45309', '#7C3AED'];

// The same name always gets the same look.
const hashName = (name = '') => [...name].reduce((sum, ch) => (sum * 31 + ch.charCodeAt(0)) % 9973, 7);

function Face({ gender, name, className }) {
  const hash = hashName(name);
  const pick = (list, salt) => list[(hash + salt) % list.length];
  const skin = pick(SKIN, 0);
  const hair = pick(HAIR, 1);
  const style = hash % 3;
  const female = gender === 'female';

  return (
    <svg viewBox="0 0 96 96" className={className} aria-hidden="true">
      <rect width="96" height="96" fill={pick(BACKGROUNDS, 2)} />

      {/* Hair that falls behind the head */}
      {female && style !== 2 && (
        <path d="M27 74c-4-16-4-30 0-40 4-12 13-18 21-18s17 6 21 18c4 10 4 24 0 40z" fill={hair} />
      )}
      {female && style === 2 && <circle cx="48" cy="13" r="9" fill={hair} />}

      <path d="M14 96c0-19 15-29 34-29s34 10 34 29z" fill={pick(CLOTHES, 3)} />
      <rect x="41" y="52" width="14" height="19" rx="6" fill={skin} />
      <ellipse cx="48" cy="39" rx="17" ry="19" fill={skin} />

      {/* Hair in front of the head */}
      {female ? (
        <path d="M30 40c-2-14 7-22 18-22s20 8 18 22c-6-3-13-8-18-14-5 6-12 11-18 14z" fill={hair} />
      ) : style === 0 ? (
        <path d="M30 38c-2-15 8-22 18-22s20 7 18 22c-2-6-5-9-9-11-7 2-15 2-21 0-3 2-5 5-6 11z" fill={hair} />
      ) : style === 1 ? (
        <path d="M30 37c-2-14 7-22 19-22 11 0 19 8 17 22-2-7-5-11-9-13-8 3-14 1-18-1-5 3-8 8-9 14z" fill={hair} />
      ) : (
        <path d="M31 33c1-11 9-17 17-17s16 6 17 17c-5-5-11-7-17-7s-12 2-17 7z" fill={hair} />
      )}

      <circle cx="41" cy="40" r="1.9" fill="#1F1A17" />
      <circle cx="55" cy="40" r="1.9" fill="#1F1A17" />
      {!female && style !== 0 && <path d="M40 48c3-2 6-2 8 0 2-2 5-2 8 0-3 2-6 2-8 1-2 1-5 1-8-1z" fill={hair} />}
      <path d="M43 51c3 2 7 2 10 0" fill="none" stroke="#5B2E1F" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export default function Avatar({ person, className = 'h-12 w-12', textClass = 'text-lg' }) {
  const [photoFailed, setPhotoFailed] = useState(false);
  const name = person?.name || '';
  const shape = `${className} flex-none rounded-full`;

  if (person?.profilePhoto && !photoFailed) {
    return (
      <img
        src={person.profilePhoto}
        alt=""
        loading="lazy"
        className={`${shape} bg-slate-100 object-cover`}
        onError={() => setPhotoFailed(true)}
      />
    );
  }
  if (person?.gender === 'male' || person?.gender === 'female') {
    return <Face gender={person.gender} name={name} className={shape} />;
  }
  return (
    <span className={`${shape} flex items-center justify-center bg-gradient-to-br from-blue-400 to-blue-600 font-semibold text-white ${textClass}`}>
      {name.charAt(0).toUpperCase()}
    </span>
  );
}
