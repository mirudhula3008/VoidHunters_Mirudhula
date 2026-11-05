// Works out what a chat message is asking about, by keyword, in English, Tamil, Hindi and Bengali.
// No AI service is involved: answers always come from the person's own data.

// Listed by priority: when two topics score the same, the earlier one wins.
const INTENTS = [
  {
    id: 'complaint',
    keywords: [
      'complaint', 'complain', 'fraud', 'scam', 'cheated', 'harass', 'threat', 'unsafe', 'emergency', 'human', 'agent', 'customer care', 'contact support',
      'புகார்', 'மோசடி', 'அவசரம்',
      'शिकायत', 'धोखा', 'आपातकाल',
      'অভিযোগ', 'প্রতারণা', 'জরুরি',
    ],
  },
  { id: 'howCancel', keywords: ['cancel', 'decline', 'reject', 'ரத்து', 'रद्द', 'বাতিল'] },
  { id: 'refund', keywords: ['refund', 'money back', 'பணத்தைத் திரும்ப', 'திரும்பப் பெற', 'रिफंड', 'वापसी', 'রিফান্ড', 'ফেরত'] },
  { id: 'howPay', keywords: ['how to pay', 'how do i pay', 'how can i pay', 'pay now', 'எப்படி செலுத்த', 'कैसे भुगतान', 'भुगतान कैसे', 'কীভাবে পেমেন্ট', 'পেমেন্ট কীভাবে'] },
  { id: 'howReview', keywords: ['how to review', 'how do i review', 'write a review', 'leave a review', 'add a review', 'give a review', 'rate a worker', 'எப்படி மதிப்பு', 'समीक्षा कैसे', 'रिव्यू कैसे', 'রিভিউ কীভাবে'] },
  { id: 'howBook', keywords: ['how to book', 'how do i book', 'how can i book', 'book a worker', 'find a worker', 'hire', 'எப்படி முன்பதிவு', 'बुक कैसे', 'बुकिंग कैसे', 'বুক কীভাবে', 'বুকিং কীভাবে'] },
  {
    id: 'earnings',
    keywords: [
      'earning', 'earned', 'earn', 'income', 'salary', 'payout', 'commission', 'kamai', 'sambalam',
      'வருமானம்', 'சம்பாத்தியம்', 'சம்பளம்', 'வருவாய்',
      'कमाई', 'आय', 'भुगतान मिला',
      'আয়', 'উপার্জন', 'রোজগার',
    ],
  },
  {
    id: 'payments',
    keywords: [
      'payment', 'paid', 'unpaid', 'pay', 'upi', 'transaction', 'bill', 'invoice', 'spent', 'paisa',
      'பணம்', 'கட்டணம்', 'செலுத்த',
      'भुगतान', 'पेमेंट', 'पैसे', 'बिल',
      'পেমেন্ট', 'টাকা', 'বিল',
    ],
  },
  {
    id: 'reviews',
    keywords: [
      'review', 'rating', 'rated', 'feedback', 'stars',
      'மதிப்புரை', 'மதிப்பீடு', 'ரிவியூ',
      'समीक्षा', 'रिव्यू', 'रेटिंग',
      'রিভিউ', 'রেটিং', 'পর্যালোচনা',
    ],
  },
  {
    id: 'bookings',
    keywords: [
      'booking', 'booked', 'order', 'appointment', 'schedule', 'job', 'request', 'visit', 'worker coming',
      'முன்பதிவு', 'ஆர்டர்', 'வேலை', 'கோரிக்கை',
      'बुकिंग', 'ऑर्डर', 'काम', 'अनुरोध',
      'বুকিং', 'অর্ডার', 'কাজ', 'অনুরোধ',
    ],
  },
  {
    id: 'dashboard',
    keywords: ['dashboard', 'summary', 'overview', 'my account', 'டாஷ்போர்டு', 'சுருக்கம்', 'डैशबोर्ड', 'सारांश', 'ড্যাশবোর্ড', 'সারাংশ'],
  },
  {
    id: 'account',
    keywords: ['verified', 'verification', 'suspended', 'blocked', 'account status', 'id proof', 'available', 'availability', 'சரிபார்ப்பு', 'सत्यापन', 'যাচাই'],
  },
  { id: 'settings', keywords: ['language', 'dark mode', 'light mode', 'theme', 'மொழி', 'भाषा', 'ভাষা'] },
  { id: 'help', keywords: ['help', 'what can you', 'who are you', 'options', 'உதவி', 'मदद', 'सहायता', 'সাহায্য'] },
];

// Only count when the message is little more than this.
const SMALL_TALK = [
  { id: 'thanks', keywords: ['thank', 'thanks', 'thx', 'நன்றி', 'धन्यवाद', 'शुक्रिया', 'ধন্যবাদ'] },
  { id: 'greeting', keywords: ['hi', 'hello', 'hey', 'good morning', 'good evening', 'vanakkam', 'namaste', 'வணக்கம்', 'नमस्ते', 'নমস্কার', 'হ্যালো'] },
];

// Words that also appear in everyday questions ("a movie review", "earn money in stocks").
// These send the message to the polite out-of-scope reply, whatever else it says.
const OFF_TOPIC = [
  'weather', 'movie', 'film', 'cricket', 'football', 'match score', 'politic', 'election', 'prime minister', 'president', 'capital of',
  'stock', 'share market', 'crypto', 'bitcoin', 'recipe', 'joke', 'song', 'lyrics', 'homework', 'python', 'javascript', 'write code',
  'girlfriend', 'boyfriend', 'horoscope', 'restaurant', 'hotel', 'flight', 'train ticket', 'book to read', 'novel', 'news',
  'வானிலை', 'திரைப்படம்', 'கிரிக்கெட்', 'அரசியல்',
  'मौसम', 'फिल्म', 'क्रिकेट', 'राजनीति',
  'আবহাওয়া', 'সিনেমা', 'ক্রিকেট', 'রাজনীতি',
];

const hasKeyword = (text, keyword) => {
  // Latin words must start at a word boundary, so "book" isn't found in "facebook". Other scripts have no such boundary.
  if (/^[\x00-\x7f]+$/.test(keyword)) {
    return new RegExp(`\\b${keyword}`).test(text);
  }
  return text.includes(keyword);
};

const countMatches = (text, keywords) => keywords.filter((k) => hasKeyword(text, k)).length;

// Small talk must be the whole word, so "hi" isn't found in "history".
const hasWholeWord = (text, keyword) =>
  /^[\x00-\x7f]+$/.test(keyword) ? new RegExp(`\\b${keyword}\\b`).test(text) : text.includes(keyword);

const MAX_SMALL_TALK_WORDS = 5;

// Returns an intent id, or 'outOfScope' for anything else.
function detectIntent(message) {
  const text = String(message).toLowerCase().trim();
  if (OFF_TOPIC.some((k) => hasKeyword(text, k))) return 'outOfScope';

  let best = null;
  let bestScore = 0;
  INTENTS.forEach(({ id, keywords }) => {
    const score = countMatches(text, keywords);
    if (score > bestScore) {
      best = id;
      bestScore = score;
    }
  });
  if (best) return best;

  if (text.split(/\s+/).length <= MAX_SMALL_TALK_WORDS) {
    const smallTalk = SMALL_TALK.find(({ keywords }) => keywords.some((k) => hasWholeWord(text, k)));
    if (smallTalk) return smallTalk.id;
  }
  return 'outOfScope';
}

const INTENT_IDS = [...INTENTS, ...SMALL_TALK].map((i) => i.id).concat('outOfScope');

module.exports = { detectIntent, INTENT_IDS };
