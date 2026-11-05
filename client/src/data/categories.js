// Mirrors server/src/data/categories.js; used by forms that need the list offline.
// Job names here are the stored English values; their labels live in the locale files (jobs.<id>).
export const CATEGORIES = [
  { id: 'plumbing', name: 'Plumbing', icon: '🔧' },
  { id: 'electrical', name: 'Electrical', icon: '💡' },
  { id: 'carpentry', name: 'Carpentry', icon: '🪚' },
  { id: 'painting', name: 'Painting', icon: '🎨' },
  { id: 'cleaning', name: 'Cleaning', icon: '🧹' },
  { id: 'appliance_repair', name: 'Appliance Repair', icon: '🔌' },
  {
    id: 'construction',
    name: 'Construction',
    icon: '🏗️',
    jobs: [
      { id: 'mason', name: 'Mason / Bricklaying' },
      { id: 'tile_flooring', name: 'Tile & Flooring Work' },
      { id: 'plastering', name: 'Plastering & Cementing' },
      { id: 'waterproofing', name: 'Roof Waterproofing & Leak Repair' },
      { id: 'false_ceiling', name: 'False Ceiling Installation' },
      { id: 'welding', name: 'Steel & Iron Grillwork (Welding)' },
      { id: 'renovation', name: 'Bathroom / Kitchen Renovation' },
      { id: 'demolition', name: 'Demolition & Debris Removal' },
    ],
  },
  {
    id: 'packers_movers',
    name: 'Packers & Movers',
    icon: '🚚',
    jobs: [
      { id: 'home_shifting', name: 'Home Shifting (Local)' },
      { id: 'office_shifting', name: 'Office / Commercial Shifting' },
      { id: 'furniture_assembly', name: 'Furniture Disassembly & Reassembly' },
      { id: 'packing', name: 'Packing & Unpacking Service' },
      { id: 'loading', name: 'Loading & Unloading Labor' },
      { id: 'vehicle_transport', name: 'Vehicle Transport (Bike/Car Carrier)' },
    ],
  },
  {
    id: 'cctv_security',
    name: 'CCTV & Security',
    icon: '📹',
    jobs: [
      { id: 'cctv_install', name: 'CCTV Camera Installation' },
      { id: 'cctv_repair', name: 'CCTV Camera Repair & Maintenance' },
      { id: 'dvr_nvr', name: 'DVR/NVR Setup & Configuration' },
      { id: 'alarm', name: 'Security Alarm Installation' },
      { id: 'video_doorbell', name: 'Video Doorbell Installation' },
      { id: 'access_control', name: 'Access Control / Biometric Lock Installation' },
      { id: 'intercom', name: 'Intercom System Setup' },
      { id: 'cable_wiring', name: 'Cable Routing & Wiring' },
    ],
  },
  { id: 'mechanic', name: 'Mechanic', icon: '🛠️' },
];

export const categoryIds = CATEGORIES.map((c) => c.id);

// Jobs of one category; empty for categories that don't use the job step.
export const jobsFor = (categoryId) => CATEGORIES.find((c) => c.id === categoryId)?.jobs || [];

// Where a category tile leads: its job list if it has one, otherwise straight to workers.
export const categoryPath = (categoryId) =>
  jobsFor(categoryId).length ? `/services/${categoryId}` : `/workers?category=${categoryId}`;

const JOB_ID_BY_NAME = Object.fromEntries(CATEGORIES.flatMap((c) => c.jobs || []).map((j) => [j.name, j.id]));

// Translated label for a stored service name; free-text names written by workers are shown as-is.
export const serviceLabel = (name, t) => (JOB_ID_BY_NAME[name] ? t(`jobs.${JOB_ID_BY_NAME[name]}`) : name);
