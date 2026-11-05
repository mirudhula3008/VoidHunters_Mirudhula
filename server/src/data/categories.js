// Service categories are fixed for the hackathon, so they live in code
// rather than a collection. `id` is what gets stored in User.serviceCategory.
// Categories with `jobs` ask the customer to pick a job before showing workers;
// a job id is stored on each of the worker's services (User.services.job).
const categories = [
  { id: 'plumbing', name: 'Plumbing', icon: '🔧', description: 'Leaks, taps, pipes, fittings and drainage' },
  { id: 'electrical', name: 'Electrical', icon: '💡', description: 'Wiring, switches, fans, lights and appliances' },
  { id: 'carpentry', name: 'Carpentry', icon: '🪚', description: 'Furniture repair, doors, shelves and fittings' },
  { id: 'painting', name: 'Painting', icon: '🎨', description: 'Interior, exterior and touch-up painting' },
  { id: 'cleaning', name: 'Cleaning', icon: '🧹', description: 'Home, kitchen, bathroom and deep cleaning' },
  { id: 'appliance_repair', name: 'Appliance Repair', icon: '🔌', description: 'AC, fridge, washing machine, TV and more' },
  {
    id: 'construction',
    name: 'Construction',
    icon: '🏗️',
    description: 'Masonry, tiling, waterproofing, welding and renovation',
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
    description: 'Home and office shifting, packing, loading and transport',
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
    description: 'Cameras, alarms, biometric locks and intercoms',
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
  { id: 'mechanic', name: 'Mechanic', icon: '🛠️', description: 'Car and bike repair, servicing, breakdown help' },
];

const categoryIds = categories.map((c) => c.id);

// Jobs of one category; empty for categories that don't use the job step.
const jobsFor = (categoryId) => categories.find((c) => c.id === categoryId)?.jobs || [];

module.exports = { categories, categoryIds, jobsFor };
