// Mirrors server/src/data/categories.js; used by forms that need the list offline.
// Job names here are the stored English values; their labels live in the locale files (jobs.<id>).
export const CATEGORIES = [
  {
    id: 'plumbing',
    name: 'Plumbing',
    icon: '🔧',
    jobs: [
      { id: 'pipe_leak', name: 'Pipe Leak Repair' },
      { id: 'tap_install', name: 'Tap/Faucet Installation' },
      { id: 'toilet', name: 'Toilet Repair & Installation' },
      { id: 'plumbing_tank', name: 'Water Tank Cleaning' },
      { id: 'drainage', name: 'Drainage/Blockage Clearing' },
      { id: 'purifier_install', name: 'Water Purifier Installation' },
      { id: 'bathroom_fitting', name: 'Bathroom Fitting & Fixtures' },
      { id: 'motor_pump', name: 'Motor/Pump Repair' },
    ],
  },
  {
    id: 'electrical',
    name: 'Electrical',
    icon: '💡',
    jobs: [
      { id: 'wiring', name: 'Wiring & Rewiring' },
      { id: 'switch_socket', name: 'Switch/Socket Installation' },
      { id: 'fan', name: 'Fan Installation & Repair' },
      { id: 'inverter', name: 'Inverter/UPS Installation' },
      { id: 'mcb', name: 'MCB/Fuse Box Repair' },
      { id: 'led', name: 'LED Light Installation' },
      { id: 'doorbell_wiring', name: 'Doorbell & Intercom Wiring' },
      { id: 'earthing', name: 'Earthing & Safety Check' },
    ],
  },
  {
    id: 'carpentry',
    name: 'Carpentry',
    icon: '🪚',
    jobs: [
      { id: 'furniture_repair', name: 'Furniture Repair' },
      { id: 'door_window', name: 'Door/Window Fitting' },
      { id: 'shelf_cabinet', name: 'Shelf & Cabinet Installation' },
      { id: 'bed_wardrobe', name: 'Bed & Wardrobe Assembly' },
      { id: 'wood_polish', name: 'Wood Polishing & Finishing' },
      { id: 'kitchen_cabinet', name: 'Kitchen Cabinet Work' },
      { id: 'partition', name: 'Partition & False Wall' },
      { id: 'lock_handle', name: 'Lock & Handle Replacement' },
    ],
  },
  {
    id: 'painting',
    name: 'Painting',
    icon: '🎨',
    jobs: [
      { id: 'interior_paint', name: 'Interior Wall Painting' },
      { id: 'exterior_paint', name: 'Exterior Wall Painting' },
      { id: 'texture', name: 'Texture/Stucco Finish' },
      { id: 'wood_metal_paint', name: 'Wood & Metal Painting' },
      { id: 'waterproof_coat', name: 'Waterproof Coating' },
      { id: 'primer_putty', name: 'Primer & Putty Work' },
      { id: 'ceiling_paint', name: 'Ceiling Painting' },
      { id: 'touch_up', name: 'Touch-Up & Patch Painting' },
    ],
  },
  {
    id: 'cleaning',
    name: 'Cleaning',
    icon: '🧹',
    jobs: [
      { id: 'home_deep', name: 'Full Home Deep Cleaning' },
      { id: 'kitchen_deep', name: 'Kitchen Deep Cleaning' },
      { id: 'bathroom_deep', name: 'Bathroom Deep Cleaning' },
      { id: 'sofa_carpet', name: 'Sofa & Carpet Shampooing' },
      { id: 'cleaning_tank', name: 'Water Tank Cleaning' },
      { id: 'post_construction', name: 'Post-Construction Cleanup' },
      { id: 'office_clean', name: 'Office/Commercial Cleaning' },
      { id: 'window_glass', name: 'Window & Glass Cleaning' },
    ],
  },
  {
    id: 'appliance_repair',
    name: 'Appliance Repair',
    icon: '🔌',
    jobs: [
      { id: 'ac_service', name: 'AC Service & Gas Refill' },
      { id: 'fridge', name: 'Refrigerator Repair' },
      { id: 'washer', name: 'Washing Machine Repair' },
      { id: 'tv', name: 'TV/Monitor Repair' },
      { id: 'microwave', name: 'Microwave/Oven Repair' },
      { id: 'geyser', name: 'Geyser/Water Heater Repair' },
      { id: 'chimney', name: 'Chimney & Hob Service' },
      { id: 'mixer', name: 'Mixer/Grinder Repair' },
    ],
  },
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
  {
    id: 'mechanic',
    name: 'Automotive Service Technician',
    icon: '🛠️',
    jobs: [
      { id: 'car_service', name: 'Car General Service' },
      { id: 'bike_service', name: 'Bike General Service' },
      { id: 'oil_change', name: 'Engine Oil & Filter Change' },
      { id: 'brake_pads', name: 'Brake Pad Replacement' },
      { id: 'battery', name: 'Battery Jumpstart & Replacement' },
      { id: 'tyre', name: 'Tyre Puncture & Replacement' },
      { id: 'vehicle_ac', name: 'AC Gas Refill (Vehicle)' },
      { id: 'breakdown', name: 'Doorstep Breakdown Assistance' },
    ],
  },
];

export const categoryIds = CATEGORIES.map((c) => c.id);

// Jobs of one category; empty for an unknown category.
export const jobsFor = (categoryId) => CATEGORIES.find((c) => c.id === categoryId)?.jobs || [];

// Where a category tile leads: its job list.
export const categoryPath = (categoryId) => `/services/${categoryId}`;

const JOB_ID_BY_NAME = Object.fromEntries(CATEGORIES.flatMap((c) => c.jobs || []).map((j) => [j.name, j.id]));

// Translated label for a stored service name; free-text names written by workers are shown as-is.
export const serviceLabel = (name, t) => (JOB_ID_BY_NAME[name] ? t(`jobs.${JOB_ID_BY_NAME[name]}`) : name);
