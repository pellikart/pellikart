import { Vendor, RitualBoard, OnboardingData, Design } from "./types";

const defaultCategories = [
  "Venue", "Catering", "Decor", "Photography", "Makeup", "DJ / Music",
];

// Map category labels to vendor ID prefixes
const categoryVendorPrefix: Record<string, string> = {
  "Venue": "v-venue",
  "Catering": "v-catering",
  "Decor": "v-decor",
  "Photography": "v-photo",
  "Makeup": "v-makeup",
  "DJ / Music": "v-dj",
  "Mehendi": "v-mehendi",
  "Pandit": "v-pandit",
  "Invitations": "v-invite",
  "Saree Draping": "v-saree",
};

export function getCategoriesForEvent(eventName: string): string[] {
  const lower = eventName.toLowerCase();
  if (lower === 'mehendi') return ["Venue", "Catering", "Mehendi", "Photography", "Decor"];
  if (lower === 'sangeeth') return ["Venue", "Catering", "DJ / Music", "Photography", "Decor"];
  if (lower === 'haldi') return ["Venue", "Catering", "Decor", "Photography"];
  if (lower === 'bottu') return ["Venue", "Catering", "Decor", "Photography"];
  if (lower === 'reception') return ["Venue", "Catering", "Decor", "Photography", "DJ / Music", "Saree Draping"];
  if (lower === 'pelli (wedding)') return ["Venue", "Catering", "Decor", "Photography", "Makeup", "Pandit", "Invitations", "Saree Draping"];
  if (lower === 'engagement' || lower === 'pelli choopulu') return ["Venue", "Catering", "Decor", "Photography", "Makeup"];
  return [...defaultCategories];
}

// Rough weight per category (venue/catering are expensive, others less)
export const categoryWeight: Record<string, number> = {
  "Venue": 0.30, "Catering": 0.25, "Decor": 0.15, "Photography": 0.10,
  "Makeup": 0.05, "DJ / Music": 0.05, "Mehendi": 0.03, "Pandit": 0.02,
  "Invitations": 0.05,
};

function pickVendorWithinBudget(label: string, catBudget: number): { selectedId: string | null; shortlisted: string[]; price: number } {
  // All categories use design/listing-based selection
  const designs = getDesignsForCategory(label);
  if (designs.length === 0) return { selectedId: null, shortlisted: [], price: 0 };

  const sorted = [...designs].sort((a, b) => a.price - b.price);
  const affordable = sorted.filter((d) => d.price <= catBudget);
  const pool = affordable.length > 0 ? affordable : [sorted[0]];
  const byPriceDesc = [...pool].sort((a, b) => b.price - a.price);
  return {
    selectedId: byPriceDesc[0].id,
    shortlisted: byPriceDesc.slice(0, Math.min(3, byPriceDesc.length)).map((d) => d.id),
    price: byPriceDesc[0].price,
  };
}

export function generateBoardsFromOnboarding(data: OnboardingData): RitualBoard[] {
  const allEvents = [...data.events, ...data.customEvents];
  const eventWeights: Record<string, number> = {};
  let totalWeight = 0;
  for (const e of allEvents) {
    const w = e.toLowerCase() === 'wedding' ? 2.5 : e.toLowerCase() === 'reception' ? 1.5 : 1;
    eventWeights[e] = w;
    totalWeight += w;
  }

  // First pass: pick vendors and calculate raw total
  const boardsRaw = allEvents.map((eventName) => {
    const id = `r-${eventName.toLowerCase().replace(/\s+/g, "-")}`;
    const dateInfo = data.eventDates[eventName];
    const categories = getCategoriesForEvent(eventName);
    const perEvent = data.eventBudgets?.[eventName];
    const eventBudget = typeof perEvent === 'number'
      ? perEvent
      : (data.budget * (eventWeights[eventName] / totalWeight));
    const totalCatWeight = categories.reduce((sum, c) => sum + (categoryWeight[c] || 0.05), 0);

    const cats = categories.map((label) => {
      const weight = categoryWeight[label] || 0.05;
      const catBudget = eventBudget * (weight / totalCatWeight);
      const { selectedId, shortlisted } = pickVendorWithinBudget(label, catBudget);
      return { id: `${id}-c-${label.toLowerCase().replace(/[\s\/]+/g, "-")}`, label, selectedVendorId: selectedId, shortlistedVendorIds: shortlisted, suggestedVendors: [] as { vendorId: string; suggestedBy: string }[], removed: false };
    });

    return { id, name: eventName, dateStart: dateInfo?.start, dateEnd: dateInfo?.end !== dateInfo?.start ? dateInfo?.end : undefined, categories: cats };
  });

  return boardsRaw;
}

// Calculate scale factor so that selected vendors' total lands near the user's budget
export function getVendorPriceScale(boards: RitualBoard[], budget: number): number {
  let rawTotal = 0;
  const designMap = Object.fromEntries(mockDesigns.map((d) => [d.id, d]));
  for (const board of boards) {
    for (const cat of board.categories) {
      if (!cat.selectedVendorId) continue;
      if (mockVendors[cat.selectedVendorId]) {
        rawTotal += mockVendors[cat.selectedVendorId].price;
      } else if (designMap[cat.selectedVendorId]) {
        rawTotal += designMap[cat.selectedVendorId].price;
      }
    }
  }
  if (rawTotal === 0) return 1;
  const target = budget * 0.93;
  return target / rawTotal;
}

// Helper to generate gradient backgrounds
const gradients = [
  "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
  "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
  "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
  "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
  "linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)",
  "linear-gradient(135deg, #fccb90 0%, #d57eeb 100%)",
  "linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)",
  "linear-gradient(135deg, #f5576c 0%, #ff6f91 100%)",
  "linear-gradient(135deg, #c471f5 0%, #fa71cd 100%)",
  "linear-gradient(135deg, #48c6ef 0%, #6f86d6 100%)",
  "linear-gradient(135deg, #feada6 0%, #f5efef 100%)",
  "linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%)",
  "linear-gradient(135deg, #d4fc79 0%, #96e6a1 100%)",
  "linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)",
  "linear-gradient(135deg, #fbc2eb 0%, #a6c1ee 100%)",
  "linear-gradient(135deg, #fdcbf1 0%, #e6dee9 100%)",
  "linear-gradient(135deg, #a6c0fe 0%, #f68084 100%)",
  "linear-gradient(135deg, #fccb90 0%, #d57eeb 100%)",
  "linear-gradient(135deg, #e8dff5 0%, #fce2ce 100%)",
];

function g(i: number) {
  return gradients[i % gradients.length];
}

const img = (folder: string, n: number) => `url(/images/gallery/${folder}/${n}.jpg)`;

export const mockVendors: Record<string, Vendor> = {
  // === VENUES ===
  "v-venue-1": {
    id: "v-venue-1", code: "Venue 001", name: "The Grand Palace", photo: img("venue", 1),
    style: "Royal Heritage", area: "Rajouri Garden, Delhi", capacity: 1500, price: 850000,
    rating: 4.8, packageTier: "Premium", likes: [{ userId: "u-mom", name: "Mom" }, { userId: "u-dad", name: "Dad" }], booked: false, amountPaid: 0,
    categoryFields: { venueType: "Palace", setting: "Indoor", capacity: "1500", roomsAvailable: "20+", parkingSpots: "200+ cars", foodPolicy: "Veg only", alcoholPolicy: "Allowed", outsideCatering: "Not allowed", musicRestriction: "Till 12 AM" },
    includes: ["AC Hall", "Parking", "Valet", "Bridal Suite", "Guest Rooms", "Sound System", "In-house Catering", "Generator Backup", "CCTV", "Security", "Furniture", "Basic Lighting", "Cleaning"],
    category: "Venue", bundleMandatory: true, bundledListings: ["v-catering-3", "v-decor-3"],
    transportIncluded: true,
    hourlyPricing: [{ hours: 12, price: 550000 }, { hours: 24, price: 850000 }],
    paidRooms: [
      {
        id: "pr-grand-1", sharing: 2, count: 8, price: 12000,
        amenities: ["AC", "Attached bathroom", "Hot water 24x7", "Wi-Fi", "TV", "Tea/coffee maker", "Daily housekeeping", "Breakfast included"],
        photos: ["/images/gallery/venue/1.jpg", "/images/gallery/venue/5.jpg"],
      },
      {
        id: "pr-grand-2", sharing: 4, count: 12, price: 18000,
        amenities: ["AC", "Attached bathroom", "Hot water 24x7", "Wi-Fi", "Mini fridge", "Daily housekeeping", "Breakfast included", "Room service"],
        photos: ["/images/gallery/venue/2.jpg", "/images/gallery/venue/6.jpg", "/images/gallery/venue/3.jpg"],
      },
    ],
  },
  "v-venue-2": {
    id: "v-venue-2", code: "Venue 002", name: "Lakeview Farms", photo: img("venue", 2),
    style: "Rustic Farmhouse", area: "Chattarpur, Delhi", capacity: 800, price: 550000,
    rating: 4.5, packageTier: "Standard", likes: [{ userId: "u-mom", name: "Mom" }], booked: false, amountPaid: 0,
    categoryFields: { venueType: "Farmhouse", setting: "Both", capacity: "800", roomsAvailable: "10-20", parkingSpots: "100 cars", foodPolicy: "Non-veg allowed", alcoholPolicy: "Allowed", outsideCatering: "Allowed", musicRestriction: "Till 10 PM" },
    includes: ["AC Hall", "Parking", "Lawn Area", "Pool Access", "Bridal Suite", "Sound System", "Generator Backup", "Furniture", "Basic Lighting", "Cleaning"],
    transportIncluded: false,
  },
  "v-venue-3": {
    id: "v-venue-3", code: "Venue 003", name: "Skyline Banquets", photo: img("venue", 3),
    style: "Modern Rooftop", area: "Connaught Place, Delhi", capacity: 500, price: 420000,
    rating: 4.3, packageTier: "Standard", likes: [], booked: false, amountPaid: 0,
    categoryFields: { venueType: "Rooftop", setting: "Outdoor", capacity: "500", roomsAvailable: "None", parkingSpots: "50 cars", foodPolicy: "Veg only", alcoholPolicy: "BYOB only", outsideCatering: "In-house mandatory", musicRestriction: "Till 10 PM" },
    includes: ["Sound System", "Elevator", "Wi-Fi", "CCTV", "Security", "In-house Catering", "Furniture", "Basic Lighting", "Cleaning"],
  },
  "v-venue-4": {
    id: "v-venue-4", code: "Venue 004", name: "Garden Bliss Resort", photo: img("venue", 4),
    style: "Garden Party", area: "Gurugram, Haryana", capacity: 1200, price: 720000,
    rating: 4.6, packageTier: "Premium", likes: [{ userId: "u-priya", name: "Priya" }], booked: false, amountPaid: 0,
    categoryFields: { venueType: "Resort", setting: "Outdoor", capacity: "1200", roomsAvailable: "20+", parkingSpots: "200+ cars", foodPolicy: "Non-veg allowed", alcoholPolicy: "Allowed", outsideCatering: "In-house mandatory", musicRestriction: "Till 12 AM" },
    includes: ["AC Hall", "Parking", "Valet", "Bridal Suite", "Guest Rooms", "Lawn Area", "Pool Access", "Sound System", "In-house Catering", "Generator Backup", "Wi-Fi", "Security"],
    category: "Venue", bundleMandatory: true, bundledListings: ["v-catering-1", "v-decor-1"],
    transportIncluded: false,
    hourlyPricing: [{ hours: 12, price: 480000 }, { hours: 24, price: 720000 }],
    paidRooms: [
      {
        id: "pr-garden-1", sharing: 2, count: 6, price: 9500,
        amenities: ["AC", "Attached bathroom", "Wi-Fi", "Balcony", "Tea/coffee maker", "Daily housekeeping"],
        photos: ["/images/gallery/venue/4.jpg", "/images/gallery/venue/8.jpg"],
      },
      {
        id: "pr-garden-2", sharing: 4, count: 10, price: 14000,
        amenities: ["AC", "Attached bathroom", "Hot water 24x7", "Wi-Fi", "TV", "Mini fridge", "Balcony"],
        photos: ["/images/gallery/venue/7.jpg", "/images/gallery/venue/4.jpg"],
      },
      {
        id: "pr-garden-3", sharing: 6, count: 4, price: 22000,
        amenities: ["AC", "Attached bathroom", "Hot water 24x7", "Wi-Fi", "TV", "Mini fridge", "Balcony", "Room service", "Breakfast included"],
        photos: ["/images/gallery/venue/8.jpg"],
      },
    ],
  },

  // === CATERING ===
  "v-catering-1": {
    id: "v-catering-1", code: "Catering 001", name: "Spice Route Caterers", photo: img("catering", 1),
    style: "North Indian Royal", area: "Lajpat Nagar, Delhi", price: 320000,
    rating: 4.7, packageTier: "Premium (800 pax)", likes: [{ userId: "u-mom", name: "Mom" }, { userId: "u-priya", name: "Priya" }], booked: false, amountPaid: 0,
    categoryFields: { cuisineTypes: ["North Indian", "Mughlai"], foodType: "Veg & Non-veg", menuItems: "25", liveCounters: "3", minPlates: "200", maxPlates: "1000", teamSize: "20-40 staff", staffIncluded: "Included", crockeryIncluded: "Included", specialCounters: ["Chaat Station", "Dessert Bar", "Paan Counter"] },
    transportIncluded: false,
  },
  "v-catering-2": {
    id: "v-catering-2", code: "Catering 002", name: "Flavours & Forks", photo: img("catering", 2),
    style: "Multi-Cuisine Fusion", area: "Saket, Delhi", price: 280000,
    rating: 4.4, packageTier: "Standard (800 pax)", likes: [], booked: false, amountPaid: 0,
    categoryFields: { cuisineTypes: ["Multi-Cuisine", "Continental", "Fusion"], foodType: "Veg & Non-veg", menuItems: "30+", liveCounters: "4+", minPlates: "100", maxPlates: "2000", teamSize: "20-40 staff", staffIncluded: "Included", crockeryIncluded: "Included", specialCounters: ["Pasta Counter", "Juice Bar", "Ice Cream Bar"] },
  },
  "v-catering-3": {
    id: "v-catering-3", code: "Catering 003", name: "Maharaja Feast", photo: img("catering", 3),
    style: "Rajasthani Thali", area: "Karol Bagh, Delhi", price: 250000,
    rating: 4.2, packageTier: "Standard (600 pax)", likes: [{ userId: "u-dad", name: "Dad" }], booked: false, amountPaid: 0,
    categoryFields: { cuisineTypes: ["Rajasthani"], foodType: "Veg only", menuItems: "20", liveCounters: "2", minPlates: "100", maxPlates: "1000", teamSize: "10-20 staff", staffIncluded: "Extra charge", crockeryIncluded: "Extra charge", specialCounters: ["Chaat Station"] },
    transportIncluded: true,
  },

  // === DECOR ===
  "v-decor-1": {
    id: "v-decor-1", code: "Decor 001", name: "Petal & Bloom", photo: img("decor", 1),
    style: "Floral Luxury", area: "South Delhi", price: 280000,
    rating: 4.9, packageTier: "Premium", likes: [{ userId: "u-mom", name: "Mom" }, { userId: "u-priya", name: "Priya" }], booked: false, amountPaid: 0,
    categoryFields: { decorType: "Full venue", decorSpeciality: ["Floral", "Ceiling Work"], flowerType: "Fresh flowers", ledLighting: "Included", propsIncluded: "All props included", setupArea: "Large (full venue)", setupTeamSize: "8-15 people", setupTime: "8 hours", teardownIncluded: "Yes", reusableElements: "All fresh (premium)" },
    transportIncluded: false,
  },
  "v-decor-2": {
    id: "v-decor-2", code: "Decor 002", name: "DreamScape Events", photo: img("decor", 2),
    style: "Modern Minimalist", area: "Noida, UP", price: 180000,
    rating: 4.3, packageTier: "Standard", likes: [], booked: false, amountPaid: 0,
    categoryFields: { decorType: "Stage only", decorSpeciality: ["Modern Minimal", "LED & Lighting"], flowerType: "Mix of both", ledLighting: "Included", propsIncluded: "Selected props only", setupArea: "Medium (lawn)", setupTeamSize: "5-8 people", setupTime: "6 hours", teardownIncluded: "Extra charge", reusableElements: "Mix of fresh & reusable" },
    transportIncluded: true,
  },
  "v-decor-3": {
    id: "v-decor-3", code: "Decor 003", name: "Royal Mandaps", photo: img("decor", 3),
    style: "Traditional Mandap", area: "Dwarka, Delhi", price: 220000,
    rating: 4.5, packageTier: "Premium", likes: [{ userId: "u-dad", name: "Dad" }], booked: false, amountPaid: 0,
    categoryFields: { decorType: "Mandap only", decorSpeciality: ["Traditional Mandap", "Fabric & Drapes"], flowerType: "Fresh flowers", ledLighting: "Add-on", propsIncluded: "All props included", setupArea: "Small (hall)", setupTeamSize: "5-8 people", setupTime: "4 hours", teardownIncluded: "Yes", reusableElements: "Mix of fresh & reusable" },
  },

  // === PHOTOGRAPHY ===
  "v-photo-1": {
    id: "v-photo-1", code: "Photo 001", name: "Lens & Light Studio", photo: img("photo", 1),
    style: "Candid + Cinematic", area: "Hauz Khas, Delhi", price: 60000,
    rating: 4.8, packageTier: "Per-event pricing", likes: [{ userId: "u-priya", name: "Priya" }], booked: false, amountPaid: 0,
    photographyPricingModels: ["eventBased"],
    eventPackages: [
      { id: "evt-p1", events: ["Pelli (Wedding)", "Reception"], prices: { traditionalPhotography: 60000, candidPhotography: 85000, candidVideography: 95000, ledScreens: 45000, drone: 30000, album: 3000, liveStreaming: 25000 }, durationHours: 10, cinematicTrailer: true, deliveryDays: 30 },
    ],
    categoryFields: { liveCoverage: "Add-on", editedPhotos: "800", highlightReel: "Included", cinematicTrailer: "Available", fullVideo: "Yes", sameDayEdit: "Yes", deliveryFormat: "Both", deliveryDays: "30 days", albums: "2", albumSheets: "25" },
  },
  "v-photo-2": {
    id: "v-photo-2", code: "Photo 002", name: "Click & Capture", photo: img("photo", 2),
    style: "Traditional + Posed", area: "Pitampura, Delhi", price: 40000,
    rating: 4.2, packageTier: "Per-event pricing", likes: [], booked: false, amountPaid: 0,
    photographyPricingModels: ["eventBased"],
    eventPackages: [
      { id: "evt-p2", events: ["Pelli (Wedding)", "Reception"], prices: { traditionalPhotography: 40000, candidPhotography: 55000, candidVideography: 60000, drone: 25000, album: 2000 }, durationHours: 8, cinematicTrailer: false, deliveryDays: 45 },
    ],
    categoryFields: { liveCoverage: "Not available", editedPhotos: "500", highlightReel: "Not included", cinematicTrailer: "Not available", fullVideo: "No", sameDayEdit: "No", deliveryFormat: "USB Drive", deliveryDays: "45 days", albums: "1", albumSheets: "20" },
  },
  "v-photo-3": {
    id: "v-photo-3", code: "Photo 003", name: "FrameWorks Photography", photo: img("photo", 3),
    style: "Documentary Style", area: "Vasant Kunj, Delhi", price: 50000,
    rating: 4.6, packageTier: "Per-event pricing", likes: [{ userId: "u-mom", name: "Mom" }], booked: false, amountPaid: 0,
    photographyPricingModels: ["eventBased"],
    eventPackages: [
      { id: "evt-p3", events: ["Pelli (Wedding)", "Reception"], prices: { traditionalPhotography: 50000, candidPhotography: 70000, candidVideography: 78000, ledScreens: 40000, drone: 28000, album: 2500, liveStreaming: 22000 }, durationHours: 8, cinematicTrailer: true, deliveryDays: 30 },
    ],
    categoryFields: { liveCoverage: "Yes, included", editedPhotos: "1000", highlightReel: "Included", cinematicTrailer: "Available", fullVideo: "Yes", sameDayEdit: "No", deliveryFormat: "Google Drive", deliveryDays: "30 days", albums: "2", albumSheets: "30" },
  },
  // Event-based photographer — prices per event as flat "pricing cards". Each of
  // its event packages is fanned out into its own couple-facing listing (the
  // d-photo-4* designs below), mirroring the live event-package expansion.
  "v-photo-4": {
    id: "v-photo-4", code: "Photo 004", name: "Muhurtham Films", photo: img("photo", 4),
    style: "Event-based Packages", area: "Kondapur, Hyderabad", price: 55000,
    rating: 4.7, packageTier: "Per-event pricing", likes: [], booked: false, amountPaid: 0,
    photographyPricingModels: ["eventBased"],
    eventPackages: [
      { id: "evt-wed", events: ["Pelli (Wedding)", "Reception"], prices: { traditionalPhotography: 55000, candidPhotography: 75000, candidVideography: 85000, ledScreens: 40000, drone: 25000, album: 2500, liveStreaming: 20000 }, durationHours: 12, cinematicTrailer: true, deliveryDays: 30 },
      { id: "evt-fun", events: ["Haldi", "Mehendi", "Sangeeth"], prices: { candidPhotography: 45000, candidVideography: 50000, drone: 18000, album: 1800 }, durationHours: 6, cinematicTrailer: false, deliveryDays: 30 },
    ],
    categoryFields: { liveCoverage: "Yes, included", editedPhotos: "1200", highlightReel: "Included", cinematicTrailer: "Available", fullVideo: "Yes", sameDayEdit: "Yes", deliveryFormat: "Both", deliveryDays: "30 days", albums: "2", albumSheets: "30" },
  },

  // === MEHENDI ===
  "v-mehendi-1": {
    id: "v-mehendi-1", code: "Mehendi 001", name: "Henna by Priya", photo: img("mehendi", 1),
    style: "Rajasthani Bridal", area: "Chandni Chowk, Delhi", price: 4000,
    rating: 4.9, packageTier: "Bridal + guests", likes: [{ userId: "u-mom", name: "Mom" }], booked: false, amountPaid: 0,
    mehendiPricing: {
      bridalOffered: true,
      bridal: {
        '2 Hands': { 'Minimal': 5000, 'Arabic': 8000, 'Heavy Bridal': 15000 },
        '2 Legs': { 'Minimal': 4000, 'Arabic': 7000, 'Heavy Bridal': 12000 },
        'Both Hands & Legs': { 'Minimal': 8000, 'Arabic': 14000, 'Heavy Bridal': 25000 },
      },
      groomPrice: 3000,
      guestPricePerPerson: 500,
      conesIncluded: true,
    },
    transportIncluded: true,
  },
  "v-mehendi-2": {
    id: "v-mehendi-2", code: "Mehendi 002", name: "Artful Hands", photo: img("mehendi", 2),
    style: "Arabic Fusion", area: "Lajpat Nagar, Delhi", price: 3500,
    rating: 4.5, packageTier: "Bridal + guests", likes: [], booked: false, amountPaid: 0,
    mehendiPricing: {
      bridalOffered: true,
      bridal: {
        '2 Hands': { 'Minimal': 3500, 'Arabic': 6000 },
        'Both Hands & Legs': { 'Minimal': 6000, 'Arabic': 10000 },
      },
      guestPricePerPerson: 400,
      conesIncluded: false,
    },
  },

  // === MAKEUP ===
  "v-makeup-1": {
    id: "v-makeup-1", code: "Makeup 001", name: "Glow by Neha", photo: img("makeup", 1),
    style: "HD Airbrush", area: "Green Park, Delhi", price: 8000,
    rating: 4.8, packageTier: "Bridal looks + guests", likes: [{ userId: "u-priya", name: "Priya" }, { userId: "u-mom", name: "Mom" }], booked: false, amountPaid: 0,
    makeupPricing: {
      bridalByEvent: { 'Bridal Makeup (Wedding)': 18000, 'Engagement/Reception Look': 14000, 'Pre-Wedding Ceremonies (Haldi, Sangeeth, etc.)': 9000 },
      groomPrice: 5000,
      guestPricePerPerson: 2500,
      addons: { 'Hair extensions': 2000, 'False lashes': 800, 'Contact lens': 1200, 'Nail paint': 500 },
    },
    // This makeup artist also offers mehendi + saree draping + hairstyling as add-ons.
    mehendiPricing: {
      bridalOffered: true,
      bridal: {
        '2 Hands': { 'Minimal': 4500, 'Arabic': 7500, 'Heavy Bridal': 13000 },
        'Both Hands & Legs': { 'Minimal': 7500, 'Arabic': 13000, 'Heavy Bridal': 22000 },
      },
      groomPrice: 2500,
      guestPricePerPerson: 450,
      conesIncluded: true,
    },
    sareeDrapingPricing: { bridalPricePerLook: 3500, groomPricePerLook: 2500, guestPricePerPerson: 1000 },
    hairStylingPricing: { bridalPricePerLook: 4000, groomPricePerLook: 1800, guestPricePerPerson: 1200 },
  },
  "v-makeup-2": {
    id: "v-makeup-2", code: "Makeup 002", name: "Beauty Bliss Studio", photo: img("makeup", 2),
    style: "Natural Glam", area: "Rajouri Garden, Delhi", price: 6000,
    rating: 4.4, packageTier: "Bridal looks + guests", likes: [], booked: false, amountPaid: 0,
    makeupPricing: {
      bridalByEvent: { 'Bridal Makeup (Wedding)': 14000, 'Engagement/Reception Look': 10000, 'Pre-Wedding Ceremonies (Haldi, Sangeeth, etc.)': 6000 },
      groomPrice: 4000,
      guestPricePerPerson: 1800,
      addons: { 'Hair accessories': 1500, 'False lashes': 600, 'Nail paint': 400 },
    },
    sareeDrapingPricing: { bridalPricePerLook: 2800, guestPricePerPerson: 900, prePleatingPricePerSaree: 700 },
    hairStylingPricing: { bridalPricePerLook: 3200, guestPricePerPerson: 700 },
    transportIncluded: false,
  },

  // === SAREE DRAPING ===
  "v-saree-1": {
    id: "v-saree-1", code: "Saree 001", name: "Drape Diva", photo: img("makeup", 5),
    style: "Bridal Draping", area: "Jubilee Hills, Hyderabad", price: 1500,
    rating: 4.8, packageTier: "Bridal + guests", likes: [{ userId: "u-priya", name: "Priya" }], booked: false, amountPaid: 0,
    sareeDrapingPricing: { bridalPricePerLook: 3000, groomPricePerLook: 2000, guestPricePerPerson: 800, prePleatingPricePerSaree: 500 },
  },
  "v-saree-2": {
    id: "v-saree-2", code: "Saree 002", name: "Pleats & Perfection", photo: img("makeup", 6),
    style: "Modern Draping", area: "Madhapur, Hyderabad", price: 1200,
    rating: 4.5, packageTier: "Bridal + guests", likes: [], booked: false, amountPaid: 0,
    sareeDrapingPricing: { bridalPricePerLook: 2500, guestPricePerPerson: 1200, prePleatingPricePerSaree: 600 },
  },

  // === DJ/MUSIC ===
  "v-dj-1": {
    id: "v-dj-1", code: "DJ 001", name: "DJ Sunil", photo: img("dj", 1),
    style: "Bollywood + EDM", area: "Connaught Place, Delhi", price: 85000,
    rating: 4.6, packageTier: "Full Night + Sound", likes: [{ userId: "u-dad", name: "Dad" }], booked: false, amountPaid: 0,
    categoryFields: { performanceType: ["DJ"], genres: ["Bollywood", "EDM", "Punjabi"], performanceHours: "6h+", teamSize: "Solo DJ", songRequests: "Accepted", soundSystem: "Included (own)", wattage: "Up to 5000W", lighting: ["LED lights", "Lasers", "Fog machine"], emcee: "Add-on", liveDhol: "Add-on", wirelessMics: "2" },
  },
  "v-dj-2": {
    id: "v-dj-2", code: "DJ 002", name: "Beats & Bass", photo: img("dj", 2),
    style: "Sufi + Bollywood", area: "Noida, UP", price: 65000,
    rating: 4.3, packageTier: "Half Night + Sound", likes: [], booked: false, amountPaid: 0,
    categoryFields: { performanceType: ["DJ", "Singer"], genres: ["Sufi", "Bollywood"], performanceHours: "4h", teamSize: "2 performers", songRequests: "Accepted", soundSystem: "Included (own)", wattage: "Up to 2000W", lighting: ["LED lights"], emcee: "Included", liveDhol: "Included", wirelessMics: "1" },
  },

  // === PANDIT ===
  "v-pandit-1": {
    id: "v-pandit-1", code: "Pandit 001", name: "Pandit Sharma Ji", photo: img("decor", 4),
    style: "Vedic Rituals", area: "Old Delhi", price: 21000,
    rating: 4.7, packageTier: "Full Ceremony", likes: [{ userId: "u-dad", name: "Dad" }], booked: false, amountPaid: 0,
    categoryFields: { tradition: "Multi-tradition", ceremonies: ["Ganapathi Puja", "Mangalsutra Dharana", "Saptapadi", "Talambralu", "Jeelakarra Bellam"], duration: "Full day", languages: ["Sanskrit", "Hindi", "Telugu"], samagri: "Included", homamSetup: "Included", muhurthamConsult: "Included", teamSize: "Pandit + 1 assistant", travel: "Up to 100km" },
  },

  // === INVITATIONS ===
  "v-invite-1": {
    id: "v-invite-1", code: "Invite 001", name: "Papercraft Studio", photo: img("decor", 5),
    style: "Luxury Boxed", area: "Chandni Chowk, Delhi", price: 95000,
    rating: 4.5, packageTier: "500 cards + digital", likes: [{ userId: "u-mom", name: "Mom" }], booked: false, amountPaid: 0,
    categoryFields: { inviteType: "Boxed invite", design: "In-house custom", customization: "Full custom design", languages: ["English", "Hindi"], minQty: "50", maxQty: "500", deliveryTimeline: "14 days", deliveryMode: "Included (within city)", digitalVersion: "Included", envelope: "Included", boxPackaging: "Included", sweetBox: "Available", waxSeal: "Included", rsvpTracking: "Included" },
  },
  "v-invite-2": {
    id: "v-invite-2", code: "Invite 002", name: "DesignWala.in", photo: img("decor", 6),
    style: "Digital + Minimal Print", area: "Online", price: 35000,
    rating: 4.3, packageTier: "Digital + 200 cards", likes: [], booked: false, amountPaid: 0,
    categoryFields: { inviteType: "Digital only", design: "Template-based", customization: "Name, date, venue only", languages: ["English"], minQty: "No minimum", maxQty: "1000", deliveryTimeline: "7 days", deliveryMode: "Pickup only", digitalVersion: "Included", envelope: "Not included", boxPackaging: "Not included", sweetBox: "Not available", waxSeal: "Not available", rsvpTracking: "Included" },
  },
};

// Design-based categories: Venue & Decor
// Each vendor can have multiple design listings
export const mockDesigns: Design[] = [
  // === VENUE DESIGNS ===
  // The Grand Palace (v-venue-1)
  { id: "d-venue-1a", vendorId: "v-venue-1", name: "Royal Mughal Night", photo: img("venue", 1), style: "Mughal Heritage", price: 950000, rating: 4.9, description: "Grand Mughal-inspired setup with arched mandap, mirror work, and royal drapes" },
  { id: "d-venue-1b", vendorId: "v-venue-1", name: "Palace Garden Soirée", photo: img("venue", 5), style: "Garden Palace", price: 820000, rating: 4.7, description: "Open-air palace garden with fairy lights, fountain walkway, and floral canopy" },
  // Lakeview Farms (v-venue-2)
  { id: "d-venue-2a", vendorId: "v-venue-2", name: "Lakeside Sunset Setup", photo: img("venue", 2), style: "Rustic Lakeside", price: 580000, rating: 4.6, description: "Wooden pier ceremony with lake backdrop, lanterns, and sunset-facing mandap" },
  { id: "d-venue-2b", vendorId: "v-venue-2", name: "Barn Charm Celebration", photo: img("venue", 6), style: "Rustic Barn", price: 500000, rating: 4.4, description: "Converted barn with exposed beams, hay bale seating, and vintage chandeliers" },
  // Skyline Banquets (v-venue-3)
  { id: "d-venue-3a", vendorId: "v-venue-3", name: "Rooftop Skyline Gala", photo: img("venue", 3), style: "Modern Rooftop", price: 450000, rating: 4.3, description: "360° city view rooftop with LED bars, lounge seating, and glass mandap" },
  { id: "d-venue-3b", vendorId: "v-venue-3", name: "Twilight Terrace", photo: img("venue", 7), style: "Terrace Evening", price: 400000, rating: 4.2, description: "Intimate terrace setup with candles, sheer drapes, and twilight ambiance" },
  // Garden Bliss Resort (v-venue-4)
  { id: "d-venue-4a", vendorId: "v-venue-4", name: "Tropical Garden Party", photo: img("venue", 4), style: "Tropical Garden", price: 750000, rating: 4.6, description: "Lush tropical garden with orchid arches, pool-side bar, and tiki torches" },
  { id: "d-venue-4b", vendorId: "v-venue-4", name: "English Garden Tea Party", photo: img("venue", 8), style: "English Garden", price: 680000, rating: 4.5, description: "Manicured hedges, pastel florals, vintage tea stations, and a gazebo mandap" },

  // === DECOR DESIGNS ===
  // Petal & Bloom (v-decor-1)
  { id: "d-decor-1a", vendorId: "v-decor-1", name: "Floral Cascade Mandap", photo: img("decor", 1), style: "Floral Luxury", price: 320000, rating: 4.9, description: "Floor-to-ceiling cascading flowers, rose petal aisle, and jasmine garland mandap" },
  { id: "d-decor-1b", vendorId: "v-decor-1", name: "Pastel Dream Garden", photo: img("decor", 4), style: "Pastel Floral", price: 260000, rating: 4.8, description: "Soft pastel roses, baby's breath canopy, and blush pink fabric drapes" },
  { id: "d-decor-1c", vendorId: "v-decor-1", name: "White Orchid Elegance", photo: img("decor", 7), style: "Minimal Luxury", price: 290000, rating: 4.7, description: "All-white orchid arrangements, crystal accents, and floating candle pools" },
  // DreamScape Events (v-decor-2)
  { id: "d-decor-2a", vendorId: "v-decor-2", name: "Neon Modern Night", photo: img("decor", 2), style: "Modern Neon", price: 200000, rating: 4.4, description: "LED neon signs, geometric frames, acrylic panels, and modern minimalism" },
  { id: "d-decor-2b", vendorId: "v-decor-2", name: "Industrial Chic Setup", photo: img("decor", 5), style: "Industrial", price: 170000, rating: 4.2, description: "Exposed metal frames, concrete textures, Edison bulbs, and raw wood accents" },
  // Royal Mandaps (v-decor-3)
  { id: "d-decor-3a", vendorId: "v-decor-3", name: "Traditional Gold Mandap", photo: img("decor", 3), style: "Traditional Gold", price: 240000, rating: 4.6, description: "Carved wooden mandap with gold leaf finish, marigold chains, and red velvet" },
  { id: "d-decor-3b", vendorId: "v-decor-3", name: "Rajasthani Royal Court", photo: img("decor", 6), style: "Rajasthani Royal", price: 260000, rating: 4.5, description: "Mirror-work mandap, silk cushion seating, brass lamps, and puppet strings" },
  { id: "d-decor-3c", vendorId: "v-decor-3", name: "South Indian Temple Theme", photo: img("decor", 8), style: "Temple Traditional", price: 220000, rating: 4.4, description: "Banana leaf pillars, brass urli centerpieces, kolam-inspired floor art" },

  // === CATERING LISTINGS ===
  { id: "d-catering-1a", vendorId: "v-catering-1", name: "Royal North Indian Feast", photo: img("catering", 1), style: "North Indian Royal", price: 350000, rating: 4.8, description: "12-course royal thali with live tandoor, chaat counter, and dessert bar for 800 guests" },
  { id: "d-catering-1b", vendorId: "v-catering-1", name: "Mughlai Grand Banquet", photo: img("catering", 2), style: "Mughlai", price: 300000, rating: 4.7, description: "Biryani live counter, kebab station, Mughlai curries, and kheer bar" },
  { id: "d-catering-2a", vendorId: "v-catering-2", name: "Fusion Grazing Tables", photo: img("catering", 3), style: "Multi-Cuisine Fusion", price: 280000, rating: 4.5, description: "Global cuisine stations — Italian, Asian, Indian fusion with craft cocktail bar" },
  { id: "d-catering-2b", vendorId: "v-catering-2", name: "Continental Elegance", photo: img("catering", 4), style: "Continental", price: 260000, rating: 4.3, description: "Plated 5-course meal with wine pairing, cheese board, and patisserie" },
  { id: "d-catering-3a", vendorId: "v-catering-3", name: "Rajasthani Daal Baati Feast", photo: img("catering", 5), style: "Rajasthani Thali", price: 250000, rating: 4.3, description: "Authentic Rajasthani thali with daal baati churma, gatte ki sabzi, and ghewar" },
  { id: "d-catering-3b", vendorId: "v-catering-3", name: "South Indian Sadya", photo: img("catering", 6), style: "South Indian", price: 220000, rating: 4.2, description: "Traditional banana leaf sadya with 26 dishes, payasam, and filter coffee station" },

  // === PHOTOGRAPHY LISTINGS ===
  { id: "d-photo-1a", vendorId: "v-photo-1", name: "Cinematic Love Story", photo: img("photo", 1), style: "Candid + Cinematic", price: 25000, rating: 4.9, description: "Full cinematic coverage for Wedding + Reception — pick photo, video, LED, drone, album, live streaming", eventPackage: { id: "evt-p1", events: ["Pelli (Wedding)", "Reception"], prices: { traditionalPhotography: 60000, candidPhotography: 85000, candidVideography: 95000, ledScreens: 45000, drone: 30000, album: 3000, liveStreaming: 25000 }, durationHours: 10, cinematicTrailer: true, deliveryDays: 30 } },
  { id: "d-photo-1b", vendorId: "v-photo-1", name: "Pelli Koduku / Kuthuru Coverage", photo: img("photo", 2), style: "Candid", price: 40000, rating: 4.8, description: "Flat per-service pricing for the Pelli Koduku/Pellikuthuru function", eventPackage: { id: "evt-p1-pk", events: ["Pelli Koduku/Pellikuthuru Function"], prices: { candidPhotography: 40000, candidVideography: 45000, drone: 20000 }, durationHours: 4, cinematicTrailer: false, deliveryDays: 15 } },
  { id: "d-photo-2a", vendorId: "v-photo-2", name: "Classic Wedding Album", photo: img("photo", 3), style: "Traditional + Posed", price: 22000, rating: 4.3, description: "Traditional posed + candid mix for Wedding + Reception — flat per-service pricing", eventPackage: { id: "evt-p2", events: ["Pelli (Wedding)", "Reception"], prices: { traditionalPhotography: 40000, candidPhotography: 55000, candidVideography: 60000, drone: 25000, album: 2000 }, durationHours: 8, cinematicTrailer: false, deliveryDays: 45 } },
  { id: "d-photo-2b", vendorId: "v-photo-2", name: "Haldi & Mehendi Coverage", photo: img("photo", 4), style: "Candid", price: 18000, rating: 4.1, description: "Candid coverage for the fun events — flat per-service pricing", eventPackage: { id: "evt-p2-fun", events: ["Haldi", "Mehendi"], prices: { candidPhotography: 35000, candidVideography: 40000, album: 1500 }, durationHours: 5, cinematicTrailer: false, deliveryDays: 30 } },
  { id: "d-photo-3a", vendorId: "v-photo-3", name: "Documentary Wedding Film", photo: img("photo", 5), style: "Documentary", price: 22000, rating: 4.7, description: "Full documentary-style coverage for Wedding + Reception — flat per-service pricing", eventPackage: { id: "evt-p3", events: ["Pelli (Wedding)", "Reception"], prices: { traditionalPhotography: 50000, candidPhotography: 70000, candidVideography: 78000, ledScreens: 40000, drone: 28000, album: 2500, liveStreaming: 22000 }, durationHours: 8, cinematicTrailer: true, deliveryDays: 30 } },
  { id: "d-photo-3b", vendorId: "v-photo-3", name: "Engagement Coverage", photo: img("photo", 6), style: "Intimate", price: 20000, rating: 4.5, description: "Engagement & Pelli Choopulu specialist — flat per-service pricing", eventPackage: { id: "evt-p3-eng", events: ["Engagement", "Pelli Choopulu"], prices: { traditionalPhotography: 30000, candidPhotography: 45000, album: 1800 }, durationHours: 4, cinematicTrailer: false, deliveryDays: 20 } },
  // Event-based packages (Muhurtham Films) — each is its own event listing. Price is
  // the cheapest service; the couple ticks the services they want in the detail sheet.
  { id: "d-photo-4a", vendorId: "v-photo-4", name: "Wedding & Reception Package", photo: img("photo", 4), style: "Event-based", price: 20000, rating: 4.7, description: "Flat per-service pricing for Wedding + Reception — pick photo, video, LED, drone, album, live streaming", eventPackage: { id: "evt-wed", events: ["Pelli (Wedding)", "Reception"], prices: { traditionalPhotography: 55000, candidPhotography: 75000, candidVideography: 85000, ledScreens: 40000, drone: 25000, album: 2500, liveStreaming: 20000 }, durationHours: 12, cinematicTrailer: true, deliveryDays: 30 } },
  { id: "d-photo-4b", vendorId: "v-photo-4", name: "Haldi · Mehendi · Sangeeth Package", photo: img("photo", 5), style: "Event-based", price: 18000, rating: 4.6, description: "Flat per-service pricing for the fun events — candid photo & video, drone, album", eventPackage: { id: "evt-fun", events: ["Haldi", "Mehendi", "Sangeeth"], prices: { candidPhotography: 45000, candidVideography: 50000, drone: 18000, album: 1800 }, durationHours: 6, cinematicTrailer: false, deliveryDays: 30 } },

  // === MEHENDI LISTINGS ===
  { id: "d-mehendi-1a", vendorId: "v-mehendi-1", name: "Bridal Rajasthani Full", photo: img("mehendi", 1), style: "Rajasthani Bridal", price: 40000, rating: 4.9, description: "Full hands + feet bridal mehendi, intricate Rajasthani patterns, 4-hour session" },
  { id: "d-mehendi-1b", vendorId: "v-mehendi-1", name: "Bride + 20 Guests Package", photo: img("mehendi", 2), style: "Bridal + Guests", price: 65000, rating: 4.8, description: "Bridal full design + simple designs for 20 guests, 2 artists, full day" },
  { id: "d-mehendi-2a", vendorId: "v-mehendi-2", name: "Arabic Fusion Bridal", photo: img("mehendi", 3), style: "Arabic Fusion", price: 30000, rating: 4.6, description: "Modern Arabic patterns with traditional elements, bold and elegant" },
  { id: "d-mehendi-2b", vendorId: "v-mehendi-2", name: "Minimalist Modern Mehendi", photo: img("mehendi", 4), style: "Contemporary", price: 20000, rating: 4.4, description: "Clean, minimal patterns — perfect for contemporary brides" },

  // === MAKEUP LISTINGS ===
  { id: "d-makeup-1a", vendorId: "v-makeup-1", name: "HD Bridal 3-Look Package", photo: img("makeup", 1), style: "HD Airbrush", price: 85000, rating: 4.9, description: "3 bridal looks (mehendi, wedding, reception), HD airbrush, hairstyling included" },
  { id: "d-makeup-1b", vendorId: "v-makeup-1", name: "Engagement Glam Look", photo: img("makeup", 2), style: "Glam", price: 35000, rating: 4.7, description: "Single engagement look — HD base, dramatic eyes, hairstyling, draping" },
  { id: "d-makeup-2a", vendorId: "v-makeup-2", name: "Natural Bridal Glow", photo: img("makeup", 3), style: "Natural Glam", price: 55000, rating: 4.5, description: "2 looks — soft dewy skin, natural tones, minimal yet stunning" },
  { id: "d-makeup-2b", vendorId: "v-makeup-2", name: "Family Makeup Package", photo: img("makeup", 4), style: "Family", price: 45000, rating: 4.3, description: "Bride + 5 family members, natural makeup for all, bridal HD for bride" },

  // === SAREE DRAPING LISTINGS ===
  { id: "d-saree-1a", vendorId: "v-saree-1", name: "Bridal Draping Signature", photo: img("makeup", 5), style: "Bridal Draping", price: 8000, rating: 4.8, description: "Flawless bridal saree draping with pleat perfection, pins & on-site touch-up" },
  { id: "d-saree-1b", vendorId: "v-saree-1", name: "Bride + Family Package", photo: img("makeup", 6), style: "Bridal + Guests", price: 15000, rating: 4.7, description: "Bridal draping + groom panche + family drapes, full event coverage" },
  { id: "d-saree-2a", vendorId: "v-saree-2", name: "Modern Drape Look", photo: img("makeup", 3), style: "Modern Draping", price: 6000, rating: 4.5, description: "Contemporary draping styles — lehenga saree, mermaid, butterfly pleats" },

  // === DJ / MUSIC LISTINGS ===
  { id: "d-dj-1a", vendorId: "v-dj-1", name: "Bollywood + EDM Night", photo: img("dj", 1), style: "Bollywood + EDM", price: 95000, rating: 4.7, description: "Full night DJ, 10K watts sound, LED dance floor, fog machine, live dhol entry" },
  { id: "d-dj-1b", vendorId: "v-dj-1", name: "Sangeeth Special Setup", photo: img("dj", 2), style: "Sangeeth", price: 65000, rating: 4.5, description: "6-hour sangeeth package — wireless mics for performances, curated Bollywood + Telugu playlist" },
  { id: "d-dj-2a", vendorId: "v-dj-2", name: "Sufi Night Experience", photo: img("dj", 3), style: "Sufi + Bollywood", price: 70000, rating: 4.4, description: "Live sufi singer + DJ combo, qawwali session transitioning to dance floor" },
  { id: "d-dj-2b", vendorId: "v-dj-2", name: "Cocktail Lounge Mix", photo: img("dj", 4), style: "Lounge", price: 50000, rating: 4.2, description: "Ambient lounge music for cocktail hour, smooth transitions to party set" },

  // === PANDIT LISTINGS ===
  { id: "d-pandit-1a", vendorId: "v-pandit-1", name: "Full Vedic Wedding Ceremony", photo: img("decor", 4), style: "Vedic Rituals", price: 25000, rating: 4.8, description: "Complete Vedic ceremony — havan, saat phere, kanyadaan, all rituals with samagri" },
  { id: "d-pandit-1b", vendorId: "v-pandit-1", name: "Quick Muhurat Ceremony", photo: img("decor", 7), style: "Express", price: 11000, rating: 4.5, description: "1-hour condensed ceremony with essential rituals, perfect for destination weddings" },

  // === INVITATIONS LISTINGS ===
  { id: "d-invite-1a", vendorId: "v-invite-1", name: "Luxury Box Invitation Set", photo: img("decor", 5), style: "Luxury Boxed", price: 110000, rating: 4.6, description: "500 boxed invites with sweet, custom design, foil stamping, digital version included" },
  { id: "d-invite-1b", vendorId: "v-invite-1", name: "Premium Print + Digital", photo: img("decor", 8), style: "Premium Print", price: 70000, rating: 4.4, description: "300 premium cards + animated digital invite with RSVP tracking" },
  { id: "d-invite-2a", vendorId: "v-invite-2", name: "Full Digital Suite", photo: img("decor", 6), style: "Digital Only", price: 25000, rating: 4.3, description: "Animated video invite + WhatsApp cards + RSVP form + save-the-date" },
  { id: "d-invite-2b", vendorId: "v-invite-2", name: "Eco-Friendly Seed Paper", photo: img("decor", 9), style: "Eco-Friendly", price: 45000, rating: 4.2, description: "200 plantable seed paper invites + digital version, sustainable & beautiful" },
];

// All categories now use design-based listings
export const designCategories = ["Venue", "Decor", "Catering", "Photography", "Mehendi", "Makeup", "DJ / Music", "Pandit", "Invitations"];

const designPrefixMap: Record<string, string> = {
  "Venue": "d-venue", "Decor": "d-decor", "Catering": "d-catering",
  "Photography": "d-photo", "Mehendi": "d-mehendi", "Makeup": "d-makeup",
  "DJ / Music": "d-dj", "Pandit": "d-pandit", "Invitations": "d-invite",
  "Saree Draping": "d-saree",
};

export function getDesignsForCategory(categoryLabel: string): Design[] {
  const prefix = designPrefixMap[categoryLabel];
  if (!prefix) return [];
  return mockDesigns.filter((d) => d.id.startsWith(prefix));
}

export const mockRitualBoards: RitualBoard[] = [
  {
    id: "r-engagement",
    name: "Engagement",
    dateStart: "2026-11-15",
    categories: [
      { id: "c-eng-venue", label: "Venue", selectedVendorId: "v-venue-2", shortlistedVendorIds: ["v-venue-1", "v-venue-2", "v-venue-3"], suggestedVendors: [{ vendorId: "v-venue-4", suggestedBy: "Mom" }], removed: false },
      { id: "c-eng-catering", label: "Catering", selectedVendorId: "v-catering-1", shortlistedVendorIds: ["v-catering-1", "v-catering-2"], suggestedVendors: [], removed: false },
      { id: "c-eng-decor", label: "Decor", selectedVendorId: "v-decor-2", shortlistedVendorIds: ["v-decor-1", "v-decor-2"], suggestedVendors: [{ vendorId: "v-decor-3", suggestedBy: "Priya" }], removed: false },
      { id: "c-eng-photo", label: "Photography", selectedVendorId: "v-photo-1", shortlistedVendorIds: ["v-photo-1", "v-photo-2"], suggestedVendors: [], removed: false },
      { id: "c-eng-makeup", label: "Makeup", selectedVendorId: null, shortlistedVendorIds: [], suggestedVendors: [{ vendorId: "v-makeup-1", suggestedBy: "Priya" }], removed: false },
    ],
  },
  {
    id: "r-wedding",
    name: "Wedding",
    dateStart: "2026-12-12",
    dateEnd: "2026-12-13",
    categories: [
      { id: "c-wed-venue", label: "Venue", selectedVendorId: "v-venue-1", shortlistedVendorIds: ["v-venue-1", "v-venue-4"], suggestedVendors: [], removed: false },
      { id: "c-wed-catering", label: "Catering", selectedVendorId: "v-catering-1", shortlistedVendorIds: ["v-catering-1", "v-catering-3"], suggestedVendors: [{ vendorId: "v-catering-2", suggestedBy: "Dad" }], removed: false },
      { id: "c-wed-decor", label: "Decor", selectedVendorId: "v-decor-1", shortlistedVendorIds: ["v-decor-1", "v-decor-3"], suggestedVendors: [], removed: false },
      { id: "c-wed-photo", label: "Photography", selectedVendorId: "v-photo-1", shortlistedVendorIds: ["v-photo-1", "v-photo-3"], suggestedVendors: [], removed: false },
      { id: "c-wed-mehendi", label: "Mehendi", selectedVendorId: "v-mehendi-1", shortlistedVendorIds: ["v-mehendi-1", "v-mehendi-2"], suggestedVendors: [], removed: false },
      { id: "c-wed-makeup", label: "Makeup", selectedVendorId: "v-makeup-1", shortlistedVendorIds: ["v-makeup-1", "v-makeup-2"], suggestedVendors: [], removed: false },
      { id: "c-wed-pandit", label: "Pandit", selectedVendorId: "v-pandit-1", shortlistedVendorIds: ["v-pandit-1"], suggestedVendors: [], removed: false },
      { id: "c-wed-invite", label: "Invitations", selectedVendorId: "v-invite-1", shortlistedVendorIds: ["v-invite-1", "v-invite-2"], suggestedVendors: [], removed: false },
    ],
  },
  {
    id: "r-reception",
    name: "Reception",
    dateStart: "2026-12-14",
    categories: [
      { id: "c-rec-venue", label: "Venue", selectedVendorId: "v-venue-4", shortlistedVendorIds: ["v-venue-1", "v-venue-4"], suggestedVendors: [], removed: false },
      { id: "c-rec-catering", label: "Catering", selectedVendorId: "v-catering-2", shortlistedVendorIds: ["v-catering-1", "v-catering-2"], suggestedVendors: [], removed: false },
      { id: "c-rec-decor", label: "Decor", selectedVendorId: null, shortlistedVendorIds: [], suggestedVendors: [], removed: false },
      { id: "c-rec-photo", label: "Photography", selectedVendorId: "v-photo-3", shortlistedVendorIds: ["v-photo-2", "v-photo-3"], suggestedVendors: [{ vendorId: "v-photo-1", suggestedBy: "Priya" }], removed: false },
      { id: "c-rec-dj", label: "DJ / Music", selectedVendorId: "v-dj-1", shortlistedVendorIds: ["v-dj-1", "v-dj-2"], suggestedVendors: [], removed: false },
    ],
  },
  {
    id: "r-sangeeth",
    name: "Sangeeth",
    dateStart: "2026-12-11",
    categories: [
      { id: "c-san-venue", label: "Venue", selectedVendorId: null, shortlistedVendorIds: [], suggestedVendors: [{ vendorId: "v-venue-3", suggestedBy: "Mom" }], removed: false },
      { id: "c-san-dj", label: "DJ / Music", selectedVendorId: "v-dj-2", shortlistedVendorIds: ["v-dj-1", "v-dj-2"], suggestedVendors: [], removed: false },
      { id: "c-san-decor", label: "Decor", selectedVendorId: null, shortlistedVendorIds: [], suggestedVendors: [], removed: false },
      { id: "c-san-catering", label: "Catering", selectedVendorId: null, shortlistedVendorIds: [], suggestedVendors: [], removed: false },
    ],
  },
];
