// Seeds sample workers, customers and reviews around Chennai.
// Creates or updates accounts with an @seed.local email (by email, keeping their ids),
// so re-running it never breaks existing bookings, payments or the admin account.
// Usage: npm run seed   (all seeded accounts use the password "password123")

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const connectDB = require('../config/db');
const User = require('../models/User');
const Review = require('../models/Review');
const Booking = require('../models/Booking');
const { recalculateWorkerRating } = require('../utils/ratings');
const { jobsFor } = require('../data/categories');

const SEED_DOMAIN = '@seed.local';

// Starting price per job: [price, unit (default "per job")]. Each worker's price varies a little around it.
const JOB_PRICES = {
  pipe_leak: [400], tap_install: [250], toilet: [900], plumbing_tank: [800],
  drainage: [350], purifier_install: [450], bathroom_fitting: [900], motor_pump: [600],
  wiring: [1500], switch_socket: [150], fan: [300], inverter: [900],
  mcb: [300], led: [200], doorbell_wiring: [350], earthing: [700],
  furniture_repair: [600], door_window: [700], shelf_cabinet: [1200], bed_wardrobe: [1000],
  wood_polish: [40, 'per sq ft'], kitchen_cabinet: [4000], partition: [120, 'per sq ft'], lock_handle: [250],
  interior_paint: [18, 'per sq ft'], exterior_paint: [25, 'per sq ft'], texture: [65, 'per sq ft'], wood_metal_paint: [900],
  waterproof_coat: [35, 'per sq ft'], primer_putty: [15, 'per sq ft'], ceiling_paint: [20, 'per sq ft'], touch_up: [600],
  home_deep: [3500], kitchen_deep: [1200], bathroom_deep: [500], sofa_carpet: [900],
  cleaning_tank: [750], post_construction: [4000], office_clean: [3000], window_glass: [600],
  ac_service: [1800], fridge: [550], washer: [450], tv: [650],
  microwave: [350], geyser: [450], chimney: [700], mixer: [250],
  mason: [900, 'per day'], tile_flooring: [55, 'per sq ft'], plastering: [32, 'per sq ft'], waterproofing: [42, 'per sq ft'],
  false_ceiling: [88, 'per sq ft'], welding: [190, 'per sq ft'], renovation: [420, 'per sq ft'], demolition: [2700],
  home_shifting: [4000], office_shifting: [4400], furniture_assembly: [950], packing: [1350], loading: [750], vehicle_transport: [2600],
  cctv_install: [1100], cctv_repair: [480], dvr_nvr: [780], alarm: [1900],
  video_doorbell: [880], access_control: [2600], intercom: [1700], cable_wiring: [28, 'per sq ft'],
  car_service: [2400], bike_service: [650], oil_change: [800], brake_pads: [900],
  battery: [400], tyre: [150], vehicle_ac: [1500], breakdown: [500],
};

// [name, category, area, lat, lng, negotiable, available, years, jobs]
// `jobs` holds positions in the category's job list (data/categories.js), so '013' = its 1st, 2nd and 4th jobs.
const WORKERS = [
  ['Ravi Kumar', 'plumbing', 'T. Nagar', 13.0418, 80.2341, true, true, 8, '0167'],
  ['Senthil Murugan', 'plumbing', 'Saidapet', 13.0213, 80.2231, false, true, 5, '012345'],
  ['Abdul Rahman', 'plumbing', 'Anna Nagar', 13.085, 80.2101, true, false, 12, '0234'],
  ['Kannan Velu', 'plumbing', 'Royapuram', 13.1137, 80.2942, true, true, 9, '456701'],
  ['Bala Subramani', 'plumbing', 'Mandaveli', 13.0266, 80.2618, false, true, 6, '236704'],

  ['Karthik Raja', 'electrical', 'Adyar', 13.0012, 80.2565, true, true, 6, '012345'],
  ['Prakash Babu', 'electrical', 'Mylapore', 13.0339, 80.2619, false, true, 10, '456701'],
  ['Manoj Kumar', 'electrical', 'Vadapalani', 13.05, 80.2121, true, true, 3, '236704'],

  ['Murugan Selvam', 'carpentry', 'Ashok Nagar', 13.0359, 80.2102, true, true, 15, '012345'],
  ['Joseph Antony', 'carpentry', 'Kodambakkam', 13.0521, 80.2255, false, false, 9, '0145'],
  ['Ganesh Pandian', 'carpentry', 'Nandanam', 13.0295, 80.24, true, true, 7, '456701'],
  ['Arul Doss', 'carpentry', 'Aminjikarai', 13.0702, 80.2248, false, true, 11, '236704'],

  ['Suresh Babu', 'painting', 'Egmore', 13.0732, 80.2609, true, true, 11, '012345'],
  ['Vijay Anand', 'painting', 'Perambur', 13.121, 80.2329, false, true, 4, '456701'],
  ['Dinesh Kumar', 'painting', 'Choolaimedu', 13.0637, 80.2265, true, true, 6, '236704'],

  ['Lakshmi Devi', 'cleaning', 'Nungambakkam', 13.0569, 80.2425, false, true, 5, '012345'],
  ['Meena Kumari', 'cleaning', 'Besant Nagar', 13.0002, 80.2668, true, true, 3, '456701'],
  ['Selvi Rajan', 'cleaning', 'Royapettah', 13.054, 80.264, true, false, 7, '0127'],
  ['Revathi Sekar', 'cleaning', 'Chepauk', 13.062, 80.279, false, true, 8, '236704'],

  ['Arjun Krishnan', 'appliance_repair', 'Ashok Nagar', 13.0359, 80.2102, true, true, 9, '012345'],
  ['Sathish Kumar', 'appliance_repair', 'Saidapet', 13.0213, 80.2231, false, true, 6, '456701'],
  ['Rahim Basha', 'appliance_repair', 'Kilpauk', 13.0825, 80.2428, true, false, 11, '2356'],
  ['Vignesh Raja', 'appliance_repair', 'Kolathur', 13.124, 80.219, true, true, 5, '236704'],

  ['Venkatesh Iyer', 'construction', 'Alwarpet', 13.0335, 80.2547, true, true, 16, '0267'],
  ['Balaji Sundaram', 'construction', 'Vadapalani', 13.05, 80.2121, true, true, 9, '106'],
  ['Naveen Raj', 'construction', 'Teynampet', 13.0418, 80.2508, false, true, 6, '342'],
  ['Imran Khan', 'construction', 'Aminjikarai', 13.0702, 80.2248, true, true, 11, '574'],
  ['Mani Vannan', 'construction', 'Kodambakkam', 13.0521, 80.2255, false, true, 13, '135'],

  ['Farooq Ahmed', 'packers_movers', 'Triplicane', 13.0588, 80.2756, false, true, 8, '0134'],
  ['Ramesh Babu', 'packers_movers', 'West Mambalam', 13.039, 80.221, true, true, 6, '0235'],
  ['Siva Prakash', 'packers_movers', 'Perambur', 13.118, 80.233, false, true, 5, '451'],
  ['Kumaresan Pillai', 'packers_movers', 'Purasawalkam', 13.0878, 80.2545, true, true, 10, '214'],
  ['Gopi Nathan', 'packers_movers', 'Medavakkam', 12.9171, 80.1923, true, false, 4, '04'],

  ['Kavitha Raman', 'cctv_security', 'Mylapore', 13.0339, 80.2619, true, true, 7, '1246'],
  ['Priya Natarajan', 'cctv_security', 'Nungambakkam', 13.0614, 80.2401, false, true, 6, '0354'],
  ['Dhanush Kannan', 'cctv_security', 'T. Nagar', 13.0405, 80.2337, true, true, 9, '0172'],
  ['Rajesh Menon', 'cctv_security', 'Kilpauk', 13.0838, 80.2401, false, true, 12, '3567'],

  ['Muthu Kumar', 'mechanic', 'Guindy', 13.0108, 80.2133, true, true, 14, '0157'],
  ['Anand Raj', 'mechanic', 'Arumbakkam', 13.0732, 80.21, false, true, 9, '012345'],
  ['Sebastian Paul', 'mechanic', 'Adyar', 13.0067, 80.257, true, true, 12, '456701'],
  ['Karim Sheikh', 'mechanic', 'Washermanpet', 13.118, 80.289, true, true, 7, '236704'],
];

// Keeps prices looking natural: ₹18, ₹650, ₹2,450.
const roundPrice = (n) => (n < 100 ? Math.round(n) : n < 1000 ? Math.round(n / 10) * 10 : Math.round(n / 50) * 50);

const servicesFor = (category, picks, workerIndex) =>
  [...picks].map((position) => {
    const job = jobsFor(category)[Number(position)];
    const [price, unit = 'per job'] = JOB_PRICES[job.id];
    const variation = 1 + (((workerIndex + Number(position)) % 5) - 2) * 0.05;
    return { name: job.name, price: roundPrice(price * variation), unit, job: job.id };
  });

const FEMALE_WORKERS = new Set(['Lakshmi Devi', 'Meena Kumari', 'Selvi Rajan', 'Revathi Sekar', 'Kavitha Raman', 'Priya Natarajan']);

// Each worker gets their own placeholder portrait from client/public/avatars.
const photoCounts = { male: 0, female: 0 };
function nextPhoto(gender) {
  photoCounts[gender] += 1;
  const number = String(photoCounts[gender]).padStart(2, '0');
  return `/avatars/${gender === 'female' ? 'women' : 'men'}-${number}.jpg`;
}

const CUSTOMERS = [
  ['Arun Prasad', 13.0475, 80.2400],
  ['Divya Shankar', 13.0100, 80.2500],
  ['Harish Venkat', 13.0800, 80.2200],
];

const REVIEW_TEXT = [
  [5, 'Very professional and finished the job quickly. Highly recommended!'],
  [5, 'Came on time, explained the problem clearly and charged a fair price.'],
  [4, 'Good work overall, just arrived a little late.'],
  [4, 'Neat and tidy work. Would book again.'],
  [3, 'Job was done but took longer than expected.'],
  [5, 'Excellent service, very polite and skilled.'],
];

const slug = (name) => name.toLowerCase().replace(/[^a-z]+/g, '.');

const CATEGORY_LABEL = {
  plumbing: 'plumbing',
  electrical: 'electrical',
  carpentry: 'carpentry',
  painting: 'painting',
  cleaning: 'cleaning',
  appliance_repair: 'appliance repair',
  construction: 'construction',
  packers_movers: 'packing and moving',
  cctv_security: 'CCTV and security',
  mechanic: 'vehicle repair',
};

// Creates or updates an account by email, keeping its _id so existing
// bookings, payments and demo history stay linked.
const upsertUser = (data) =>
  User.findOneAndUpdate({ email: data.email }, { $set: data }, { upsert: true, new: true, setDefaultsOnInsert: true });

async function seed() {
  await connectDB();
  await User.syncIndexes();

  const password = await bcrypt.hash('password123', 10);

  const customers = await Promise.all(
    CUSTOMERS.map(([name, lat, lng], i) =>
      upsertUser({
        name,
        email: `${slug(name)}${SEED_DOMAIN}`,
        phone: `98400000${String(i).padStart(2, '0')}`,
        password,
        role: 'customer',
        location: { type: 'Point', coordinates: [lng, lat] },
      })
    )
  );

  const workers = await Promise.all(
    WORKERS.map(([name, category, area, lat, lng, negotiable, available, years, picks], i) => {
      const gender = FEMALE_WORKERS.has(name) ? 'female' : 'male';
      return upsertUser({
        name,
        email: `${slug(name)}${SEED_DOMAIN}`,
        phone: `94440000${String(i).padStart(2, '0')}`,
        password,
        role: 'worker',
        profilePhoto: nextPhoto(gender),
        gender,
        location: { type: 'Point', coordinates: [lng, lat] },
        address: `${area}, Chennai`,
        serviceCategory: category,
        services: servicesFor(category, picks, i),
        bio: `${years} years of experience in ${CATEGORY_LABEL[category]} work around ${area} and nearby areas.`,
        experienceYears: years,
        isNegotiable: negotiable,
        isVerified: true,
        availability: available,
      });
    })
  );

  // Replace only the sample reviews: seed reviews point at bookings that don't exist,
  // so real reviews (with real bookings) are never touched.
  const workerIds = workers.map((w) => w._id);
  const customerIds = customers.map((c) => c._id);
  const candidates = await Review.find({ workerId: { $in: workerIds }, customerId: { $in: customerIds } }).select('bookingId');
  const realBookingIds = new Set(
    (await Booking.find({ _id: { $in: candidates.map((r) => r.bookingId) } }).select('_id')).map((b) => String(b._id))
  );
  await Review.deleteMany({ _id: { $in: candidates.filter((r) => !realBookingIds.has(String(r.bookingId))).map((r) => r._id) } });

  // 2–4 sample reviews per worker.
  const reviews = [];
  workers.forEach((worker, wi) => {
    const count = 2 + (wi % 3);
    for (let r = 0; r < count; r++) {
      const [rating, comment] = REVIEW_TEXT[(wi + r) % REVIEW_TEXT.length];
      reviews.push({
        bookingId: new mongoose.Types.ObjectId(),
        customerId: customers[(wi + r) % customers.length]._id,
        workerId: worker._id,
        rating,
        comment,
        createdAt: new Date(Date.now() - (wi * 3 + r) * 24 * 60 * 60 * 1000),
      });
    }
  });
  // timestamps: false keeps the back-dated createdAt values above.
  await Review.insertMany(reviews, { timestamps: false });

  // Ratings come from every review (sample + real).
  await Promise.all(workers.map((w) => recalculateWorkerRating(w._id)));

  console.log(`Seeded ${workers.length} workers, ${customers.length} customers, ${reviews.length} sample reviews.`);
  await mongoose.disconnect();
}

seed().catch(async (err) => {
  console.error(err);
  await mongoose.disconnect();
  process.exit(1);
});
