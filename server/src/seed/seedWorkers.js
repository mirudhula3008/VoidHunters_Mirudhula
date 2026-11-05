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

// [name, category, area, lat, lng, negotiable, available, years, services: [name, price, unit?]]
const WORKERS = [
  ['Ravi Kumar', 'plumbing', 'T. Nagar', 13.0418, 80.2341, true, true, 8,
    [['Tap / faucet repair', 250], ['Pipe leak fixing', 400], ['Bathroom fitting installation', 900]]],
  ['Senthil Murugan', 'plumbing', 'Velachery', 12.975, 80.2212, false, true, 5,
    [['Drain unclogging', 350], ['Water tank cleaning', 800], ['Motor pump repair', 600]]],
  ['Abdul Rahman', 'plumbing', 'Anna Nagar', 13.085, 80.2101, true, false, 12,
    [['Tap / faucet repair', 200], ['Geyser installation', 700], ['Full bathroom plumbing', 3500]]],

  ['Karthik Raja', 'electrical', 'Adyar', 13.0012, 80.2565, true, true, 6,
    [['Switch / socket repair', 150], ['Ceiling fan installation', 350], ['Full house wiring check', 1500]]],
  ['Prakash Babu', 'electrical', 'Mylapore', 13.0339, 80.2619, false, true, 10,
    [['Light fitting installation', 200], ['MCB / fuse replacement', 300], ['Inverter installation', 900]]],
  ['Manoj Kumar', 'electrical', 'Porur', 13.0382, 80.1565, true, true, 3,
    [['Switch / socket repair', 120], ['Ceiling fan repair', 250], ['AC point wiring', 800]]],

  ['Murugan Selvam', 'carpentry', 'Guindy', 13.0067, 80.2206, true, true, 15,
    [['Door lock fitting', 300], ['Furniture repair', 600], ['Wardrobe assembly', 1200]]],
  ['Joseph Antony', 'carpentry', 'Kodambakkam', 13.0521, 80.2255, false, false, 9,
    [['Hinge / handle replacement', 200], ['Bed assembly', 800], ['Custom shelf making', 2500]]],
  ['Ganesh Pandian', 'carpentry', 'Chromepet', 12.9516, 80.1462, true, true, 7,
    [['Furniture repair', 500], ['Window frame repair', 700], ['Modular kitchen fitting', 4000]]],

  ['Suresh Babu', 'painting', 'Egmore', 13.0732, 80.2609, true, true, 11,
    [['Single wall painting', 1200], ['1 BHK interior painting', 8000], ['Waterproofing coat', 3000]]],
  ['Vijay Anand', 'painting', 'Perambur', 13.121, 80.2329, false, true, 4,
    [['Touch-up painting', 600], ['Door / grill painting', 900], ['2 BHK interior painting', 14000]]],
  ['Dinesh Kumar', 'painting', 'Tambaram', 12.9249, 80.1, true, true, 6,
    [['Single wall painting', 1000], ['Exterior wall painting', 6000], ['Texture painting', 4500]]],

  ['Lakshmi Devi', 'cleaning', 'Nungambakkam', 13.0569, 80.2425, false, true, 5,
    [['Kitchen deep cleaning', 1200], ['Bathroom cleaning', 500], ['Full home deep cleaning', 3500]]],
  ['Meena Kumari', 'cleaning', 'Besant Nagar', 13.0002, 80.2668, true, true, 3,
    [['Sofa shampooing', 900], ['Bathroom cleaning', 450], ['Move-in / move-out cleaning', 4000]]],
  ['Selvi Rajan', 'cleaning', 'Royapettah', 13.054, 80.264, true, false, 7,
    [['Kitchen deep cleaning', 1000], ['Window & balcony cleaning', 600], ['Full home deep cleaning', 3000]]],

  ['Arjun Krishnan', 'appliance_repair', 'Ashok Nagar', 13.0359, 80.2102, true, true, 9,
    [['Washing machine repair', 450], ['Refrigerator repair', 550], ['AC service', 600], ['Microwave repair', 350]]],
  ['Sathish Kumar', 'appliance_repair', 'Saidapet', 13.0213, 80.2231, false, true, 6,
    [['AC gas refill', 1800], ['Refrigerator repair', 500], ['Water purifier service', 400]]],
  ['Rahim Basha', 'appliance_repair', 'Kilpauk', 13.0825, 80.2428, true, false, 11,
    [['TV repair', 650], ['Washing machine repair', 400], ['Geyser repair', 450]]],

  // In categories with a job list, service names must match a job name in data/categories.js.
  ['Venkatesh Iyer', 'construction', 'Alwarpet', 13.0335, 80.2547, true, true, 16,
    [['Mason / Bricklaying', 900, 'per day'], ['Plastering & Cementing', 35, 'per sq ft'], ['Bathroom / Kitchen Renovation', 450, 'per sq ft'], ['Demolition & Debris Removal', 2500]]],
  ['Balaji Sundaram', 'construction', 'Vadapalani', 13.05, 80.2121, true, true, 9,
    [['Tile & Flooring Work', 55, 'per sq ft'], ['Mason / Bricklaying', 850, 'per day'], ['Bathroom / Kitchen Renovation', 400, 'per sq ft']]],
  ['Naveen Raj', 'construction', 'Teynampet', 13.0418, 80.2508, false, true, 6,
    [['Roof Waterproofing & Leak Repair', 40, 'per sq ft'], ['False Ceiling Installation', 85, 'per sq ft'], ['Plastering & Cementing', 30, 'per sq ft']]],
  ['Imran Khan', 'construction', 'Aminjikarai', 13.0702, 80.2248, true, true, 11,
    [['Steel & Iron Grillwork (Welding)', 180, 'per sq ft'], ['Demolition & Debris Removal', 3000], ['False Ceiling Installation', 90, 'per sq ft']]],
  ['Mani Vannan', 'construction', 'Kodambakkam', 13.0521, 80.2255, false, true, 13,
    [['Tile & Flooring Work', 60, 'per sq ft'], ['Roof Waterproofing & Leak Repair', 45, 'per sq ft'], ['Steel & Iron Grillwork (Welding)', 200, 'per sq ft']]],

  ['Farooq Ahmed', 'packers_movers', 'Triplicane', 13.0588, 80.2756, false, true, 8,
    [['Home Shifting (Local)', 4500], ['Office / Commercial Shifting', 4900], ['Packing & Unpacking Service', 1500], ['Loading & Unloading Labor', 800]]],
  ['Ramesh Babu', 'packers_movers', 'West Mambalam', 13.039, 80.221, true, true, 6,
    [['Home Shifting (Local)', 3800], ['Furniture Disassembly & Reassembly', 900], ['Packing & Unpacking Service', 1200], ['Vehicle Transport (Bike/Car Carrier)', 2500]]],
  ['Siva Prakash', 'packers_movers', 'Perambur', 13.118, 80.233, false, true, 5,
    [['Loading & Unloading Labor', 700], ['Vehicle Transport (Bike/Car Carrier)', 2800], ['Office / Commercial Shifting', 4500]]],
  ['Kumaresan Pillai', 'packers_movers', 'Purasawalkam', 13.0878, 80.2545, true, true, 10,
    [['Furniture Disassembly & Reassembly', 1000], ['Office / Commercial Shifting', 4800], ['Loading & Unloading Labor', 750]]],
  ['Gopi Nathan', 'packers_movers', 'Medavakkam', 12.9171, 80.1923, true, false, 4,
    [['Home Shifting (Local)', 3500], ['Loading & Unloading Labor', 650]]],

  ['Kavitha Raman', 'cctv_security', 'Mylapore', 13.0339, 80.2619, true, true, 7,
    [['CCTV Camera Repair & Maintenance', 500], ['DVR/NVR Setup & Configuration', 800], ['Video Doorbell Installation', 900], ['Intercom System Setup', 1800]]],
  ['Priya Natarajan', 'cctv_security', 'Nungambakkam', 13.0614, 80.2401, false, true, 6,
    [['CCTV Camera Installation', 1200], ['Security Alarm Installation', 2000], ['Access Control / Biometric Lock Installation', 2500], ['Video Doorbell Installation', 850]]],
  ['Dhanush Kannan', 'cctv_security', 'T. Nagar', 13.0405, 80.2337, true, true, 9,
    [['CCTV Camera Installation', 1000], ['CCTV Camera Repair & Maintenance', 450], ['Cable Routing & Wiring', 25, 'per sq ft'], ['DVR/NVR Setup & Configuration', 750]]],
  ['Rajesh Menon', 'cctv_security', 'Kilpauk', 13.0838, 80.2401, false, true, 12,
    [['Security Alarm Installation', 1800], ['Access Control / Biometric Lock Installation', 2800], ['Intercom System Setup', 1600], ['Cable Routing & Wiring', 30, 'per sq ft']]],

  ['Muthu Kumar', 'mechanic', 'Guindy', 13.0108, 80.2133, true, true, 14,
    [['Bike general service', 600], ['Car general service', 2500], ['Breakdown assistance', 500], ['Puncture repair', 100]]],
  ['Anand Raj', 'mechanic', 'Porur', 13.035, 80.158, false, true, 9,
    [['Car battery replacement', 300], ['Brake pad replacement', 900], ['Bike engine repair', 1500]]],
  ['Sebastian Paul', 'mechanic', 'Adyar', 13.0067, 80.257, true, true, 12,
    [['Two-wheeler service at home', 700], ['Car AC repair', 1500], ['Clutch repair', 1800]]],
  ['Karim Sheikh', 'mechanic', 'Perungudi', 12.9654, 80.2461, true, true, 7,
    [['Breakdown towing', 1200], ['Puncture repair', 120], ['Car general service', 2200]]],
];

const FEMALE_WORKERS = new Set(['Lakshmi Devi', 'Meena Kumari', 'Selvi Rajan', 'Kavitha Raman', 'Priya Natarajan']);

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
    WORKERS.map(([name, category, area, lat, lng, negotiable, available, years, services], i) =>
      upsertUser({
        name,
        email: `${slug(name)}${SEED_DOMAIN}`,
        phone: `94440000${String(i).padStart(2, '0')}`,
        password,
        role: 'worker',
        // No photo: the app draws a picture that matches the worker's gender.
        profilePhoto: '',
        gender: FEMALE_WORKERS.has(name) ? 'female' : 'male',
        location: { type: 'Point', coordinates: [lng, lat] },
        address: `${area}, Chennai`,
        serviceCategory: category,
        services: services.map(([serviceName, price, unit = 'per job']) => ({
          name: serviceName,
          price,
          unit,
          job: jobsFor(category).find((j) => j.name === serviceName)?.id,
        })),
        bio: `${years} years of experience in ${CATEGORY_LABEL[category]} work around ${area} and nearby areas.`,
        experienceYears: years,
        isNegotiable: negotiable,
        isVerified: true,
        availability: available,
      })
    )
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
