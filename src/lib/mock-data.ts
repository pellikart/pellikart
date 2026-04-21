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
};

export function getCategoriesForEvent(eventName: string): string[] {
  const lower = eventName.toLowerCase();
  if (lower === 'mehendi') return ["Venue", "Catering", "Mehendi", "Photography", "Decor"];
  if (lower === 'sangeeth') return ["Venue", "Catering", "DJ / Music", "Photography", "Decor"];
  if (lower === 'nalugu') return ["Venue", "Catering", "Decor", "Photography"];
  if (lower === 'reception') return ["Venue", "Catering", "Decor", "Photography", "DJ / Music"];
  if (lower === 'pelli (wedding)') return ["Venue", "Catering", "Decor", "Photography", "Makeup", "Pandit", "Invitations"];
  if (lower === 'nischitartham' || lower === 'pelli choopulu') return ["Venue", "Catering", "Decor", "Photography", "Makeup"];
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
    const eventBudget = (data.budget * (eventWeights[eventName] / totalWeight));
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
  },
  "v-venue-2": {
    id: "v-venue-2", code: "Venue 002", name: "Lakeview Farms", photo: img("venue", 2),
    style: "Rustic Farmhouse", area: "Chattarpur, Delhi", capacity: 800, price: 550000,
    rating: 4.5, packageTier: "Standard", likes: [{ userId: "u-mom", name: "Mom" }], booked: false, amountPaid: 0,
  },
  "v-venue-3": {
    id: "v-venue-3", code: "Venue 003", name: "Skyline Banquets", photo: img("venue", 3),
    style: "Modern Rooftop", area: "Connaught Place, Delhi", capacity: 500, price: 420000,
    rating: 4.3, packageTier: "Standard", likes: [], booked: false, amountPaid: 0,
  },
  "v-venue-4": {
    id: "v-venue-4", code: "Venue 004", name: "Garden Bliss Resort", photo: img("venue", 4),
    style: "Garden Party", area: "Gurugram, Haryana", capacity: 1200, price: 720000,
    rating: 4.6, packageTier: "Premium", likes: [{ userId: "u-priya", name: "Priya" }], booked: false, amountPaid: 0,
  },

  // === CATERING ===
  "v-catering-1": {
    id: "v-catering-1", code: "Catering 001", name: "Spice Route Caterers", photo: img("catering", 1),
    style: "North Indian Royal", area: "Lajpat Nagar, Delhi", price: 320000,
    rating: 4.7, packageTier: "Premium (800 pax)", likes: [{ userId: "u-mom", name: "Mom" }, { userId: "u-priya", name: "Priya" }], booked: false, amountPaid: 0,
  },
  "v-catering-2": {
    id: "v-catering-2", code: "Catering 002", name: "Flavours & Forks", photo: img("catering", 2),
    style: "Multi-Cuisine Fusion", area: "Saket, Delhi", price: 280000,
    rating: 4.4, packageTier: "Standard (800 pax)", likes: [], booked: false, amountPaid: 0,
  },
  "v-catering-3": {
    id: "v-catering-3", code: "Catering 003", name: "Maharaja Feast", photo: img("catering", 3),
    style: "Rajasthani Thali", area: "Karol Bagh, Delhi", price: 250000,
    rating: 4.2, packageTier: "Standard (600 pax)", likes: [{ userId: "u-dad", name: "Dad" }], booked: false, amountPaid: 0,
  },

  // === DECOR ===
  "v-decor-1": {
    id: "v-decor-1", code: "Decor 001", name: "Petal & Bloom", photo: img("decor", 1),
    style: "Floral Luxury", area: "South Delhi", price: 280000,
    rating: 4.9, packageTier: "Premium", likes: [{ userId: "u-mom", name: "Mom" }, { userId: "u-priya", name: "Priya" }], booked: false, amountPaid: 0,
  },
  "v-decor-2": {
    id: "v-decor-2", code: "Decor 002", name: "DreamScape Events", photo: img("decor", 2),
    style: "Modern Minimalist", area: "Noida, UP", price: 180000,
    rating: 4.3, packageTier: "Standard", likes: [], booked: false, amountPaid: 0,
  },
  "v-decor-3": {
    id: "v-decor-3", code: "Decor 003", name: "Royal Mandaps", photo: img("decor", 3),
    style: "Traditional Mandap", area: "Dwarka, Delhi", price: 220000,
    rating: 4.5, packageTier: "Premium", likes: [{ userId: "u-dad", name: "Dad" }], booked: false, amountPaid: 0,
  },

  // === PHOTOGRAPHY ===
  "v-photo-1": {
    id: "v-photo-1", code: "Photo 001", name: "Lens & Light Studio", photo: img("photo", 1),
    style: "Candid + Cinematic", area: "Hauz Khas, Delhi", price: 180000,
    rating: 4.8, packageTier: "Premium (2 days)", likes: [{ userId: "u-priya", name: "Priya" }], booked: false, amountPaid: 0,
  },
  "v-photo-2": {
    id: "v-photo-2", code: "Photo 002", name: "Click & Capture", photo: img("photo", 2),
    style: "Traditional + Posed", area: "Pitampura, Delhi", price: 120000,
    rating: 4.2, packageTier: "Standard (2 days)", likes: [], booked: false, amountPaid: 0,
  },
  "v-photo-3": {
    id: "v-photo-3", code: "Photo 003", name: "FrameWorks Photography", photo: img("photo", 3),
    style: "Documentary Style", area: "Vasant Kunj, Delhi", price: 150000,
    rating: 4.6, packageTier: "Premium (1 day)", likes: [{ userId: "u-mom", name: "Mom" }], booked: false, amountPaid: 0,
  },

  // === MEHENDI ===
  "v-mehendi-1": {
    id: "v-mehendi-1", code: "Mehendi 001", name: "Henna by Priya", photo: img("mehendi", 1),
    style: "Rajasthani Bridal", area: "Chandni Chowk, Delhi", price: 35000,
    rating: 4.9, packageTier: "Bridal + 20 guests", likes: [{ userId: "u-mom", name: "Mom" }], booked: false, amountPaid: 0,
  },
  "v-mehendi-2": {
    id: "v-mehendi-2", code: "Mehendi 002", name: "Artful Hands", photo: img("mehendi", 2),
    style: "Arabic Fusion", area: "Lajpat Nagar, Delhi", price: 28000,
    rating: 4.5, packageTier: "Bridal + 15 guests", likes: [], booked: false, amountPaid: 0,
  },

  // === MAKEUP ===
  "v-makeup-1": {
    id: "v-makeup-1", code: "Makeup 001", name: "Glow by Neha", photo: img("makeup", 1),
    style: "HD Airbrush", area: "Green Park, Delhi", price: 75000,
    rating: 4.8, packageTier: "Bridal (3 looks)", likes: [{ userId: "u-priya", name: "Priya" }, { userId: "u-mom", name: "Mom" }], booked: false, amountPaid: 0,
  },
  "v-makeup-2": {
    id: "v-makeup-2", code: "Makeup 002", name: "Beauty Bliss Studio", photo: img("makeup", 2),
    style: "Natural Glam", area: "Rajouri Garden, Delhi", price: 55000,
    rating: 4.4, packageTier: "Bridal (2 looks)", likes: [], booked: false, amountPaid: 0,
  },

  // === DJ/MUSIC ===
  "v-dj-1": {
    id: "v-dj-1", code: "DJ 001", name: "DJ Sunil", photo: img("dj", 1),
    style: "Bollywood + EDM", area: "Connaught Place, Delhi", price: 85000,
    rating: 4.6, packageTier: "Full Night + Sound", likes: [{ userId: "u-dad", name: "Dad" }], booked: false, amountPaid: 0,
  },
  "v-dj-2": {
    id: "v-dj-2", code: "DJ 002", name: "Beats & Bass", photo: img("dj", 2),
    style: "Sufi + Bollywood", area: "Noida, UP", price: 65000,
    rating: 4.3, packageTier: "Half Night + Sound", likes: [], booked: false, amountPaid: 0,
  },

  // === PANDIT ===
  "v-pandit-1": {
    id: "v-pandit-1", code: "Pandit 001", name: "Pandit Sharma Ji", photo: img("decor", 4),
    style: "Vedic Rituals", area: "Old Delhi", price: 21000,
    rating: 4.7, packageTier: "Full Ceremony", likes: [{ userId: "u-dad", name: "Dad" }], booked: false, amountPaid: 0,
  },

  // === INVITATIONS ===
  "v-invite-1": {
    id: "v-invite-1", code: "Invite 001", name: "Papercraft Studio", photo: img("decor", 5),
    style: "Luxury Boxed", area: "Chandni Chowk, Delhi", price: 95000,
    rating: 4.5, packageTier: "500 cards + digital", likes: [{ userId: "u-mom", name: "Mom" }], booked: false, amountPaid: 0,
  },
  "v-invite-2": {
    id: "v-invite-2", code: "Invite 002", name: "DesignWala.in", photo: img("decor", 6),
    style: "Digital + Minimal Print", area: "Online", price: 35000,
    rating: 4.3, packageTier: "Digital + 200 cards", likes: [], booked: false, amountPaid: 0,
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
  { id: "d-photo-1a", vendorId: "v-photo-1", name: "Cinematic Love Story", photo: img("photo", 1), style: "Candid + Cinematic", price: 200000, rating: 4.9, description: "Full cinematic coverage — drone shots, same-day edit, 2 photographers, highlight reel" },
  { id: "d-photo-1b", vendorId: "v-photo-1", name: "Pre-Wedding Dreamshoot", photo: img("photo", 2), style: "Pre-Wedding", price: 80000, rating: 4.8, description: "4-hour pre-wedding shoot at location of choice, 100 edited photos, 1 reel" },
  { id: "d-photo-2a", vendorId: "v-photo-2", name: "Classic Wedding Album", photo: img("photo", 3), style: "Traditional + Posed", price: 120000, rating: 4.3, description: "Traditional posed + candid mix, 500 edited photos, 1 premium album" },
  { id: "d-photo-2b", vendorId: "v-photo-2", name: "Budget Candid Package", photo: img("photo", 4), style: "Candid", price: 80000, rating: 4.1, description: "1 photographer, 8 hours, 300 edited candid photos, USB delivery" },
  { id: "d-photo-3a", vendorId: "v-photo-3", name: "Documentary Wedding Film", photo: img("photo", 5), style: "Documentary", price: 170000, rating: 4.7, description: "Full documentary-style coverage, 20-min wedding film, raw footage included" },
  { id: "d-photo-3b", vendorId: "v-photo-3", name: "Intimate Ceremony Coverage", photo: img("photo", 6), style: "Intimate", price: 100000, rating: 4.5, description: "Small wedding specialist — 1 photographer, 6 hours, 200 edited photos" },

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
