// ────────────────────────────────────────────
// Category-specific configuration for vendor
// onboarding and listing creation.
// All fields are selectable (chips/toggles/sliders).
// ────────────────────────────────────────────

export interface SelectField {
  key: string
  label: string
  type: 'single' | 'multi' | 'toggle' | 'slider' | 'number'
  options?: string[]
  /** For toggle fields */
  toggleLabels?: [string, string]
  /** For slider fields */
  sliderMin?: number
  sliderMax?: number
  sliderStep?: number
  sliderUnit?: string
  /** For number-stepper fields */
  numberMin?: number
  numberMax?: number
  numberStep?: number
  numberUnit?: string
  /** Conditional visibility based on another field's value */
  visibleWhen?: { key: string; notEquals?: string | string[]; equals?: string | string[] }
}

export interface CategoryOnboardingConfig {
  /** Title for the category-specific screen */
  title: string
  /** Subtitle */
  subtitle: string
  /** Fields shown during onboarding */
  fields: SelectField[]
}

export interface CategoryListingConfig {
  /** Steps for listing creation (each step = one screen) */
  steps: {
    title: string
    subtitle: string
    fields: SelectField[]
  }[]
  /** Style options for this category */
  styles: string[]
  /** Inclusion options for this category */
  inclusions: string[]
  /** Price range */
  priceRange: { min: number; max: number; step: number }
}

// ─── ONBOARDING CONFIG ──────────────────────

export const ONBOARDING_CONFIG: Record<string, CategoryOnboardingConfig> = {
  Venue: {
    title: 'About your venue',
    subtitle: 'Help couples understand what your venue offers.',
    fields: [
      { key: 'venueType', label: 'Venue type', type: 'single', options: ['Banquet Hall', 'Farmhouse', 'Resort', 'Hotel', 'Lawn', 'Palace', 'Rooftop', 'Convention Center'] },
      { key: 'setting', label: 'Setting', type: 'single', options: ['Indoor', 'Outdoor', 'Both'] },
      { key: 'maxCapacity', label: 'Max guest capacity', type: 'slider', sliderMin: 50, sliderMax: 2000, sliderStep: 50, sliderUnit: 'guests' },
      { key: 'foodPolicy', label: 'Food policy', type: 'single', options: ['Veg only', 'Non-veg allowed', 'Both'] },
      { key: 'parkingCapacity', label: 'Parking', type: 'single', options: ['No parking', '20 cars', '50 cars', '100 cars', '200+ cars'] },
    ],
  },
  Catering: {
    title: 'About your catering',
    subtitle: 'Let couples know your cuisine and service style.',
    fields: [
      { key: 'cuisineTypes', label: 'Cuisine speciality', type: 'multi', options: ['South Indian', 'North Indian', 'Mughlai', 'Rajasthani', 'Multi-Cuisine', 'Continental', 'Chinese', 'Fusion'] },
      { key: 'foodType', label: 'Food type', type: 'single', options: ['Veg only', 'Non-veg', 'Both'] },
      { key: 'minPlateCount', label: 'Minimum plate count', type: 'single', options: ['50', '100', '200', '300', '500', 'No minimum'] },
      { key: 'ownStaffCrockery', label: 'Own staff & crockery', type: 'single', options: ['Yes, included', 'Staff only', 'Crockery only', 'Not included'] },
    ],
  },
  Photography: {
    title: 'About your photography',
    subtitle: 'Tell couples about your style and gear.',
    fields: [
      { key: 'shootStyles', label: 'Shoot style', type: 'multi', options: ['Candid', 'Traditional', 'Cinematic', 'Fine Art', 'Documentary', 'Photojournalistic'] },
      { key: 'shootsVideo', label: 'Do you shoot video?', type: 'single', options: ['Yes', 'No', 'Add-on'] },
      { key: 'equipment', label: 'Equipment', type: 'multi', options: ['DSLR', 'Mirrorless', 'Drone', 'Gimbal', 'Studio Lights', 'LED Panels'] },
      { key: 'deliveryDays', label: 'Typical delivery time', type: 'single', options: ['15 days', '30 days', '45 days', '60 days', '90 days'] },
    ],
  },
  Decor: {
    title: 'About your decor',
    subtitle: 'Help couples visualise your work.',
    fields: [
      { key: 'decorSpeciality', label: 'Speciality', type: 'multi', options: ['Floral', 'Fabric & Drapes', 'LED & Lighting', 'Traditional Mandap', 'Modern Minimal', 'Stage Design', 'Ceiling Work'] },
      { key: 'flowerSource', label: 'Flowers', type: 'single', options: ['Fresh flowers', 'Artificial', 'Mix of both'] },
      { key: 'setupTeamSize', label: 'Setup team size', type: 'single', options: ['2-4 people', '5-8 people', '8-15 people', '15+ people'] },
      { key: 'teardownIncluded', label: 'Teardown included', type: 'single', options: ['Yes, included', 'Extra charge', 'Not available'] },
    ],
  },
  Makeup: {
    title: 'About your makeup services',
    subtitle: 'Couples want to know your style and products.',
    fields: [
      { key: 'makeupType', label: 'Makeup type', type: 'multi', options: ['HD', 'Airbrush', 'Traditional', 'Natural Glam', 'South Indian Bridal', 'Minimalist'] },
      { key: 'hairStyling', label: 'Hair styling', type: 'single', options: ['Included', 'Add-on', 'Not available'] },
      { key: 'travelToVenue', label: 'Travel to venue', type: 'single', options: ['Yes, included', 'Yes, extra charge', 'Studio only'] },
    ],
  },
  Mehendi: {
    title: 'About your mehendi',
    subtitle: 'Let couples know your style and coverage.',
    fields: [
      { key: 'designStyles', label: 'Design style', type: 'multi', options: ['Rajasthani', 'Arabic', 'Contemporary', 'Indo-Arabic', 'Minimalist', 'Bridal Heavy'] },
      { key: 'maxGuestsPerEvent', label: 'Max guests per event', type: 'single', options: ['Bride only', '5', '10', '15', '20', '30', '50+'] },
      { key: 'travelToVenue', label: 'Travel to venue', type: 'single', options: ['Yes, included', 'Yes, extra charge', 'No'] },
      { key: 'groomMehendi', label: 'Groom mehendi', type: 'single', options: ['Yes', 'Add-on', 'No'] },
    ],
  },
  'DJ / Music': {
    title: 'About your music services',
    subtitle: 'Tell couples what kind of experience you create.',
    fields: [
      { key: 'performanceType', label: 'Performance type', type: 'multi', options: ['DJ', 'Live Band', 'Dhol', 'Nadaswaram', 'Classical', 'Singer', 'Instrumental'] },
      { key: 'genres', label: 'Music genres', type: 'multi', options: ['Bollywood', 'EDM', 'Sufi', 'Classical', 'Punjabi', 'International', 'Telugu', 'Tamil'] },
      { key: 'ownSoundSystem', label: 'Own sound system', type: 'single', options: ['Yes, included', 'Available at extra cost', 'No'] },
      { key: 'providesEmcee', label: 'Emcee / Host', type: 'single', options: ['Yes, included', 'Add-on', 'Not available'] },
    ],
  },
  Pandit: {
    title: 'About your services',
    subtitle: 'Help couples find the right purohit for their traditions.',
    fields: [
      { key: 'traditions', label: 'Traditions', type: 'multi', options: ['Telugu Brahmin', 'Telugu Niyogi', 'Telugu Kamma', 'Telugu Reddy', 'Arya Vysya', 'Multi-tradition', 'North Indian', 'Other'] },
      { key: 'languages', label: 'Languages', type: 'multi', options: ['Telugu', 'Sanskrit', 'Hindi', 'Tamil', 'Kannada', 'English'] },
      { key: 'samagriIncluded', label: 'Pooja samagri', type: 'single', options: ['Included', 'Available at extra cost', 'Not included'] },
      { key: 'travelOutsideCity', label: 'Travel outside city', type: 'single', options: ['Yes', 'Up to 50km', 'Up to 100km', 'No'] },
    ],
  },
  Invitations: {
    title: 'About your invitations',
    subtitle: 'Help couples understand your design and delivery.',
    fields: [
      { key: 'inviteTypes', label: 'Invitation type', type: 'multi', options: ['Printed card', 'Boxed invite', 'Digital only', 'Scroll', 'Eco-friendly', 'Acrylic', 'MDF'] },
      { key: 'designApproach', label: 'Design', type: 'single', options: ['In-house custom', 'Template-based', 'Client provides design'] },
      { key: 'minOrderQty', label: 'Min order quantity', type: 'single', options: ['No minimum', '25', '50', '100', '200'] },
      { key: 'deliveryTimeline', label: 'Delivery timeline', type: 'single', options: ['7 days', '14 days', '21 days', '30 days'] },
    ],
  },
  Banjantrilu: {
    title: 'About your banjantrilu',
    subtitle: 'Tell couples about your ensemble and tradition.',
    fields: [
      { key: 'instruments', label: 'Instruments', type: 'multi', options: ['Nadaswaram', 'Dhol', 'Tavil', 'Sannai', 'Mela Talam', 'Tabla', 'Mridangam', 'Shehnai'] },
      { key: 'ensembleSize', label: 'Ensemble size', type: 'single', options: ['Solo', '2-3 artists', '4-6 artists', '7-10 artists', '10+ artists'] },
      { key: 'ceremoniesPlayed', label: 'Ceremonies covered', type: 'multi', options: ['Baraat / Procession', 'Muhurtham', 'Mangalasnanam', 'Pelli Koduku/Kuthuru', 'Reception entry', 'Talambralu'] },
      { key: 'travelToVenue', label: 'Travel to venue', type: 'single', options: ['Yes, included', 'Yes, extra charge', 'Within city only'] },
      { key: 'traditionalAttire', label: 'Traditional attire', type: 'single', options: ['Always worn', 'On request', 'Modern attire'] },
    ],
  },
  Reels: {
    title: 'About your reels',
    subtitle: 'Tell couples about your style and turnaround.',
    fields: [
      { key: 'reelStyles', label: 'Reel style', type: 'multi', options: ['Cinematic', 'Candid', 'Trend-based', 'Story-driven', 'Couple POV', 'Vintage Film', 'Highlight Cuts'] },
      { key: 'platforms', label: 'Delivery platforms', type: 'multi', options: ['Instagram', 'YouTube Shorts', 'Facebook', 'WhatsApp', 'Raw files'] },
      { key: 'turnaroundTime', label: 'Turnaround time', type: 'single', options: ['Same day', '24 hours', '3 days', '7 days', '14 days'] },
      { key: 'equipment', label: 'Equipment', type: 'multi', options: ['Mirrorless', 'Gimbal', 'Drone', 'Action Cam', 'Smartphone Pro', 'LED Panels'] },
      { key: 'musicLicensing', label: 'Music licensing', type: 'single', options: ['Royalty-free included', 'Couple provides', 'Add-on'] },
    ],
  },
  'Hair Stylist': {
    title: 'About your hair styling',
    subtitle: 'Help brides understand your style and services.',
    fields: [
      { key: 'styleTypes', label: 'Specialities', type: 'multi', options: ['Traditional Braids', 'Updos & Buns', 'Curls', 'Sleek Straight', 'Hair Accessories Styling', 'Floral Hair Setup', 'Modern Glam'] },
      { key: 'hairExtensions', label: 'Hair extensions', type: 'single', options: ['Included', 'Add-on', 'Couple provides', 'Not used'] },
      { key: 'travelToVenue', label: 'Travel to venue', type: 'single', options: ['Yes, included', 'Yes, extra charge', 'Studio only'] },
      { key: 'productsUsed', label: 'Products used', type: 'multi', options: ['L\'Oréal', 'Schwarzkopf', 'Wella', 'Streax', 'Matrix', 'Olaplex', 'Mix of brands'] },
      { key: 'familyHair', label: 'Family hair styling', type: 'single', options: ['Yes, included', 'Add-on', 'Not available'] },
    ],
  },
  'Saree Draping': {
    title: 'About your saree draping',
    subtitle: 'Tell brides about your draping styles and service.',
    fields: [
      { key: 'drapingStyles', label: 'Draping styles', type: 'multi', options: ['Nivi (Andhra)', 'Bengali', 'Maharashtrian Nauvari', 'Gujarati Seedha Pallu', 'Lehenga Saree', 'Mermaid', 'Butterfly', 'Modern Fusion'] },
      { key: 'timePerDrape', label: 'Time per drape', type: 'single', options: ['15 min', '20 min', '30 min', '45 min'] },
      { key: 'travelToVenue', label: 'Travel to venue', type: 'single', options: ['Yes, included', 'Yes, extra charge', 'Studio only'] },
      { key: 'pinsAndAccessories', label: 'Pins & accessories', type: 'single', options: ['Included', 'Add-on', 'Bride provides'] },
      { key: 'familyDraping', label: 'Family / guests', type: 'single', options: ['Bride only', 'Bride + 3', 'Bride + 5', 'Bride + 10', 'Unlimited'] },
    ],
  },
  'Live Stalls': {
    title: 'About your live stall',
    subtitle: 'Help couples understand the experience you bring to their event.',
    fields: [
      { key: 'stallTypes', label: 'What stalls do you offer?', type: 'multi', options: ['Live Paintings / Portraits', 'Caricatures', 'Bangle Stall', 'Live Mehendi (guest)', 'Saree Draping', 'Tarot / Astrology', 'Pottery / Craft Station', 'Calligraphy / Name Personalization', 'Temporary Tattoo Artist', 'Photo Booth (Instant Prints)'] },
      { key: 'artistsAvailable', label: 'Artists / staff on duty', type: 'single', options: ['Solo', '2 artists', '3-4 artists', '5+ artists'] },
      { key: 'minDuration', label: 'Minimum service duration', type: 'single', options: ['1 hour', '2 hours', '3 hours', '4 hours', 'Full event'] },
      { key: 'travelToVenue', label: 'Travel to venue', type: 'single', options: ['Within city included', 'Up to 50km', 'Up to 100km', 'Extra charge'] },
      { key: 'materialsProvided', label: 'Materials / supplies', type: 'single', options: ['Included', 'Partial', 'Couple provides'] },
    ],
  },
  'Hosts / Entertainers': {
    title: 'About your performance',
    subtitle: 'Tell couples about the entertainment you bring.',
    fields: [
      { key: 'performanceTypes', label: 'What do you do?', type: 'multi', options: ['Magician', 'Mentalist', 'Anchor / MC', 'Stand-up Comedian', 'Sufi / Ghazal Singer', 'Folk Dancers', 'Mixology / Bartender Show', 'Mimicry Artist', 'Game Show Host', 'Karaoke Host', 'Live Music (Instrumental)'] },
      { key: 'groupSize', label: 'Group size', type: 'single', options: ['Solo', '2-3 performers', '4-6 performers', '7+ performers'] },
      { key: 'languages', label: 'Languages', type: 'multi', options: ['Telugu', 'Hindi', 'English', 'Tamil', 'Kannada', 'Bilingual'] },
      { key: 'audienceFit', label: 'Audience fit', type: 'multi', options: ['Family-friendly', 'Adult / Cocktail', 'Kids-focused', 'Multi-generational'] },
      { key: 'travelToVenue', label: 'Travel to venue', type: 'single', options: ['Within city included', 'Up to 50km', 'Up to 100km', 'Extra charge'] },
    ],
  },
  'Wedding Props': {
    title: 'About your wedding props',
    subtitle: 'Help couples find the right traditional and decorative items.',
    fields: [
      { key: 'propCategories', label: 'What props do you offer?', type: 'multi', options: ['Aduthera (Bridal Seat)', 'Pelli Butta', 'Pelli Pendiri', 'Coconut Painting', 'Talambralu Plates', 'Mangalasnanam Vessels', 'Pendyala (Wedding Pot)', 'Kalasham Set', 'Garlands', 'Plantain Leaves & Bananas', 'Photo Booth Backdrops', 'Decorative Umbrellas', 'Welcome Signage', 'Couple Chairs / Thrones', 'Decorative Pots & Bowls'] },
      { key: 'serviceModel', label: 'Rental or sale?', type: 'single', options: ['Rental only', 'Sale only', 'Both rental and sale'] },
      { key: 'deliveryModel', label: 'Delivery', type: 'single', options: ['Delivery & pickup included', 'Delivery only', 'Pickup from store only', 'Extra charge'] },
      { key: 'customization', label: 'Customization', type: 'single', options: ['Custom designs available', 'Limited customization', 'Standard catalog only'] },
    ],
  },
}

// ─── LISTING CONFIG ─────────────────────────

export const LISTING_CONFIG: Record<string, CategoryListingConfig> = {
  Venue: {
    styles: ['Royal Heritage', 'Garden Party', 'Modern Rooftop', 'Rustic Farmhouse', 'Beachside', 'Palace', 'Boutique Hotel'],
    inclusions: ['AC Hall', 'Parking', 'Valet', 'Bridal Suite', 'Guest Rooms', 'Sound System', 'In-house Catering', 'Generator Backup', 'Lawn Area', 'Pool Access', 'Elevator', 'Wi-Fi', 'CCTV', 'Security', 'Furniture', 'Basic Lighting', 'Cleaning'],
    priceRange: { min: 100000, max: 5000000, step: 50000 },
    steps: [
      {
        title: 'Venue details',
        subtitle: 'Describe this specific venue offering.',
        fields: [
          { key: 'venueType', label: 'Venue type', type: 'single', options: ['Banquet Hall', 'Farmhouse', 'Resort', 'Hotel', 'Lawn', 'Palace', 'Rooftop', 'Convention Center'] },
          { key: 'setting', label: 'Setting', type: 'single', options: ['Indoor', 'Outdoor', 'Both'] },
          { key: 'capacity', label: 'Guest capacity', type: 'slider', sliderMin: 50, sliderMax: 2000, sliderStep: 50, sliderUnit: 'guests' },
        ],
      },
      {
        title: 'Rooms & parking',
        subtitle: 'Let couples know what extras come with the venue.',
        fields: [
          { key: 'parkingSpots', label: 'Parking', type: 'single', options: ['No parking', '20 cars', '50 cars', '100 cars', '200+ cars'] },
          { key: 'valetParking', label: 'Is valet parking available?', type: 'single', options: ['Yes', 'No'], visibleWhen: { key: 'parkingSpots', notEquals: 'No parking' } },
          { key: 'complimentaryRooms', label: 'Are complimentary rooms available?', type: 'single', options: ['Yes', 'No'] },
          { key: 'complimentaryRoomsCount', label: 'How many?', type: 'number', numberMin: 1, numberMax: 50, numberStep: 1, numberUnit: 'rooms', visibleWhen: { key: 'complimentaryRooms', equals: 'Yes' } },
        ],
      },
      {
        title: 'Policies',
        subtitle: 'Let couples know the rules upfront.',
        fields: [
          { key: 'foodPolicy', label: 'Food policy', type: 'single', options: ['Veg only', 'Non-veg allowed'] },
          { key: 'alcoholPolicy', label: 'Alcohol', type: 'single', options: ['Allowed', 'Not allowed', 'BYOB only'] },
          { key: 'outsideCatering', label: 'Outside catering', type: 'single', options: ['Allowed', 'Not allowed', 'In-house mandatory'] },
          { key: 'musicRestriction', label: 'Music time restriction', type: 'single', options: ['No restriction', 'Till 10 PM', 'Till 12 AM', '24hr allowed'] },
        ],
      },
    ],
  },
  Catering: {
    styles: ['North Indian', 'South Indian', 'Multi-Cuisine', 'Rajasthani', 'Mughlai', 'Continental', 'Fusion'],
    inclusions: ['Welcome Drinks', 'Starters', 'Main Course', 'Desserts', 'Live Counters', 'Chaat Station', 'Ice Cream Bar', 'Paan Counter', 'Crockery & Cutlery', 'Service Staff', 'Water & Soft Drinks', 'Dosa Counter', 'Juice Bar', 'Cleaning'],
    priceRange: { min: 300, max: 5000, step: 100 },
    steps: [
      {
        title: 'Menu details',
        subtitle: 'What are you serving?',
        fields: [
          { key: 'servingStyle', label: 'Serving style', type: 'single', options: ['Buffet', 'Banti Bojanalu'] },
          { key: 'cuisineTypes', label: 'Cuisine', type: 'multi', options: ['Andhra Style', 'Godavari Style', 'Rayalaseema Style', 'Telangana Style', 'Hyderabadi', 'Pure-Veg Traditional', 'Others'] },
          { key: 'foodType', label: 'Food type', type: 'single', options: ['Veg only', 'Non-veg', 'Both'] },
          { key: 'menuItems', label: 'Items in menu', type: 'single', options: ['10', '15', '20', '25', '30+'] },
          { key: 'liveCounters', label: 'Live counters', type: 'single', options: ['None', '1', '2', '3', '4+'] },
        ],
      },
      {
        title: 'Capacity & service',
        subtitle: 'How many can you serve?',
        fields: [
          { key: 'minPlates', label: 'Min plate count', type: 'single', options: ['50', '100', '200', '300', '500'] },
          { key: 'maxPlates', label: 'Max plate count', type: 'single', options: ['300', '500', '1000', '2000', 'No limit'] },
          { key: 'teamSize', label: 'Team on event day', type: 'single', options: ['5-10 staff', '10-20 staff', '20-40 staff', '40+ staff'] },
          { key: 'staffIncluded', label: 'Service staff', type: 'single', options: ['Included', 'Extra charge', 'Not available'] },
          { key: 'crockeryIncluded', label: 'Crockery & cutlery', type: 'single', options: ['Included', 'Extra charge', 'Client provides'] },
          { key: 'specialCounters', label: 'Special counters', type: 'multi', options: ['Chaat Station', 'Ice Cream Bar', 'Paan Counter', 'Dessert Bar', 'Juice Bar', 'Dosa Counter', 'Pasta Counter'] },
        ],
      },
    ],
  },
  Photography: {
    styles: ['Candid + Cinematic', 'Traditional + Posed', 'Documentary', 'Fine Art', 'Photojournalistic'],
    inclusions: ['Candid Photos', 'Traditional Photos', 'Drone Shots', 'Pre-Wedding Shoot', 'Album', 'Highlight Reel', 'Full Video', 'Photo Booth', 'Same-Day Edit', 'USB Drive', 'Google Drive', 'Raw Files'],
    priceRange: { min: 30000, max: 500000, step: 10000 },
    steps: [
      {
        title: 'Coverage details',
        subtitle: 'What does this package cover?',
        fields: [
          { key: 'coverageType', label: 'Coverage type', type: 'single', options: ['Photo only', 'Video only', 'Photo + Video'] },
          { key: 'shootStyles', label: 'Shoot style', type: 'multi', options: ['Candid', 'Traditional', 'Cinematic', 'Documentary', 'Fine Art'] },
          { key: 'coverageHours', label: 'Coverage hours', type: 'single', options: ['4h', '6h', '8h', '10h', '12h', 'Full day'] },
          { key: 'photographers', label: 'Photographers', type: 'number', numberMin: 1, numberMax: 10, numberStep: 1 },
          { key: 'videographers', label: 'Videographers', type: 'number', numberMin: 0, numberMax: 10, numberStep: 1 },
          { key: 'liveCoverage', label: 'Live coverage / streaming', type: 'single', options: ['Yes, included', 'Add-on', 'Not available'] },
        ],
      },
      {
        title: 'Deliverables',
        subtitle: 'What do couples get?',
        fields: [
          { key: 'editedPhotos', label: 'Edited photos', type: 'single', options: ['200', '500', '800', '1000', 'All'] },
          { key: 'highlightReel', label: 'Highlight reel', type: 'single', options: ['Not included', '3 min', '5 min', '10 min'] },
          { key: 'fullVideo', label: 'Full ceremony video', type: 'single', options: ['Yes', 'No'] },
          { key: 'preWedding', label: 'Pre-wedding shoot', type: 'single', options: ['Included', 'Add-on', 'Not available'] },
          { key: 'droneShots', label: 'Drone shots', type: 'single', options: ['Included', 'Add-on', 'Not available'] },
          { key: 'sameDayEdit', label: 'Same-day edit', type: 'single', options: ['Yes', 'No'] },
          { key: 'deliveryFormat', label: 'Delivery format', type: 'single', options: ['USB Drive', 'Google Drive', 'Both'] },
          { key: 'deliveryDays', label: 'Delivery timeline', type: 'single', options: ['15 days', '30 days', '45 days', '60 days'] },
          { key: 'albums', label: 'Albums', type: 'single', options: ['Not included', '1 album', '2 albums', '3 albums'] },
        ],
      },
    ],
  },
  Decor: {
    styles: ['Floral Luxury', 'Modern Minimalist', 'Traditional', 'Rustic', 'Royal Heritage', 'Bohemian', 'Temple Traditional'],
    inclusions: ['Stage Setup', 'Mandap', 'Flower Arrangements', 'LED Lighting', 'Drapes & Fabrics', 'Table Centerpieces', 'Entrance Decor', 'Photo Booth', 'Ceiling Decor', 'Aisle Decor', 'Candle Setup', 'Fairy Lights'],
    priceRange: { min: 50000, max: 800000, step: 25000 },
    steps: [
      {
        title: 'Decor details',
        subtitle: 'What does this setup cover?',
        fields: [
          { key: 'decorType', label: 'Decor coverage', type: 'single', options: ['Full venue', 'Stage only', 'Mandap only', 'Entrance + Stage', 'Specific area'] },
          { key: 'decorSpeciality', label: 'Style speciality', type: 'multi', options: ['Floral', 'Fabric & Drapes', 'LED & Lighting', 'Traditional Mandap', 'Modern Minimal', 'Stage Design', 'Ceiling Work'] },
          { key: 'flowerType', label: 'Flowers', type: 'single', options: ['Fresh flowers', 'Artificial', 'Mix of both'] },
          { key: 'ledLighting', label: 'LED / Lighting', type: 'single', options: ['Included', 'Add-on', 'Not included'] },
          { key: 'propsIncluded', label: 'Decor props', type: 'single', options: ['All props included', 'Selected props only', 'Couple sources separately'] },
        ],
      },
      {
        title: 'Setup & logistics',
        subtitle: 'How does the setup work?',
        fields: [
          { key: 'setupArea', label: 'Setup area', type: 'single', options: ['Small (hall)', 'Medium (lawn)', 'Large (full venue)'] },
          { key: 'setupTeamSize', label: 'Setup team size', type: 'single', options: ['2-4 people', '5-8 people', '8-15 people', '15+ people'] },
          { key: 'setupTime', label: 'Setup time needed', type: 'single', options: ['4 hours', '6 hours', '8 hours', '12 hours', '1 day'] },
          { key: 'teardownIncluded', label: 'Teardown included', type: 'single', options: ['Yes', 'Extra charge', 'Not included'] },
          { key: 'reusableElements', label: 'Elements', type: 'single', options: ['All fresh (premium)', 'Mix of fresh & reusable', 'Reusable (budget-friendly)'] },
        ],
      },
    ],
  },
  Makeup: {
    styles: ['HD Airbrush', 'Natural Glam', 'Traditional', 'Bridal Heavy', 'South Indian Bridal', 'Minimalist'],
    inclusions: ['Bridal Makeup', 'Engagement Look', 'Reception Look', 'Hair Styling', 'Draping', 'Touch-Up Kit', 'False Lashes', 'Nail Art', 'Family Makeup', 'Pre-Bridal Facial', 'Contact Lenses'],
    priceRange: { min: 10000, max: 200000, step: 5000 },
    steps: [
      {
        title: 'Service details',
        subtitle: 'What does this package include?',
        fields: [
          { key: 'looksIncluded', label: 'Looks included', type: 'single', options: ['1 look', '2 looks', '3 looks', '4 looks'] },
          { key: 'makeupType', label: 'Makeup type', type: 'single', options: ['HD', 'Airbrush', 'Traditional', 'Natural'] },
          { key: 'teamSize', label: 'Team on event day', type: 'single', options: ['Solo', '2 artists', '3 artists', '4+ artists'] },
          { key: 'hairStyling', label: 'Hair styling', type: 'single', options: ['Included', 'Add-on', 'Not included'] },
          { key: 'draping', label: 'Saree/lehenga draping', type: 'single', options: ['Included', 'Add-on', 'Not included'] },
        ],
      },
      {
        title: 'Products & extras',
        subtitle: 'Let brides know the details.',
        fields: [
          { key: 'products', label: 'Products used', type: 'multi', options: ['MAC', 'Bobbi Brown', 'Charlotte Tilbury', 'Huda Beauty', 'Kryolan', 'Lakme', 'Mix of brands'] },
          { key: 'trialSession', label: 'Trial session', type: 'single', options: ['Included', 'Extra cost', 'Not available'] },
          { key: 'falseLashes', label: 'False lashes', type: 'single', options: ['Included', 'Add-on', 'Not included'] },
          { key: 'travelToVenue', label: 'Travel to venue', type: 'single', options: ['Included', 'Extra charge', 'Studio only'] },
          { key: 'familyMakeup', label: 'Family/bridesmaid makeup', type: 'single', options: ['Available', 'Not available'] },
        ],
      },
    ],
  },
  Mehendi: {
    styles: ['Rajasthani Bridal', 'Arabic Fusion', 'Contemporary', 'Traditional', 'Indo-Arabic', 'Minimalist'],
    inclusions: ['Bridal Full Hands', 'Bridal Full Feet', 'Guest Mehendi', 'Groom Mehendi', 'Glitter Add-On', 'White Mehendi', 'Baby Shower Design', 'Touch-Up'],
    priceRange: { min: 5000, max: 100000, step: 2500 },
    steps: [
      {
        title: 'Design details',
        subtitle: 'What does this package cover?',
        fields: [
          { key: 'designStyles', label: 'Design style', type: 'multi', options: ['Rajasthani', 'Arabic', 'Contemporary', 'Indo-Arabic', 'Minimalist'] },
          { key: 'bridalCoverage', label: 'Bridal coverage', type: 'single', options: ['Full hands + Full feet', 'Full hands only', 'Half hands', 'Simple'] },
          { key: 'complexity', label: 'Complexity', type: 'single', options: ['Intricate bridal', 'Medium detail', 'Simple & elegant'] },
        ],
      },
      {
        title: 'Capacity & extras',
        subtitle: 'How many people can you cover?',
        fields: [
          { key: 'additionalGuests', label: 'Additional guests covered', type: 'single', options: ['Bride only', '5', '10', '15', '20', '30', 'Unlimited'] },
          { key: 'brideTime', label: 'Time for bride', type: 'single', options: ['2 hours', '3 hours', '4 hours', '5+ hours'] },
          { key: 'teamSize', label: 'Team on event day', type: 'single', options: ['Solo', '2 artists', '3-4 artists', '5+ artists'] },
          { key: 'groomMehendi', label: 'Groom mehendi', type: 'single', options: ['Included', 'Add-on', 'Not available'] },
          { key: 'glitterAddon', label: 'Glitter/stone add-on', type: 'single', options: ['Included', 'Add-on', 'Not available'] },
          { key: 'whiteMehendi', label: 'White mehendi', type: 'single', options: ['Available', 'Not available'] },
          { key: 'conesIncluded', label: 'Mehendi cones', type: 'single', options: ['Included', 'Add-on', 'Not included'] },
          { key: 'travelToVenue', label: 'Travel to venue', type: 'single', options: ['Included', 'Extra charge', 'No'] },
        ],
      },
    ],
  },
  'DJ / Music': {
    styles: ['Bollywood + EDM', 'Sufi + Bollywood', 'Classical Fusion', 'Live Band', 'International'],
    inclusions: ['Sound System', 'DJ Console', 'LED Lights', 'Fog Machine', 'Dance Floor', 'Emcee', 'Live Dhol', 'Karaoke', 'Wireless Mics', 'Subwoofer', 'Laser Lights'],
    priceRange: { min: 20000, max: 300000, step: 5000 },
    steps: [
      {
        title: 'Performance details',
        subtitle: 'What kind of show do you put on?',
        fields: [
          { key: 'performanceType', label: 'Type', type: 'multi', options: ['DJ', 'Live Band', 'Dhol', 'Classical', 'Singer', 'Instrumental'] },
          { key: 'genres', label: 'Music genres', type: 'multi', options: ['Bollywood', 'EDM', 'Sufi', 'Classical', 'Punjabi', 'Telugu', 'International'] },
          { key: 'performanceHours', label: 'Performance hours', type: 'single', options: ['2h', '3h', '4h', '5h', '6h+'] },
          { key: 'teamSize', label: 'Team on event day', type: 'single', options: ['Solo DJ', '2 performers', '3-5 performers', '6+ performers'] },
          { key: 'songRequests', label: 'Song requests', type: 'single', options: ['Accepted', 'Set playlist only'] },
        ],
      },
      {
        title: 'Equipment & extras',
        subtitle: 'What gear comes with this?',
        fields: [
          { key: 'soundSystem', label: 'Sound system', type: 'single', options: ['Included (own)', 'Extra cost', "Use venue's"] },
          { key: 'wattage', label: 'Sound coverage', type: 'single', options: ['Up to 1000W', 'Up to 2000W', 'Up to 5000W', '10000W+'] },
          { key: 'lighting', label: 'Lighting', type: 'multi', options: ['LED lights', 'Lasers', 'Fog machine', 'Dance floor lights', 'Fairy lights'] },
          { key: 'emcee', label: 'Emcee / Host', type: 'single', options: ['Included', 'Add-on', 'Not available'] },
          { key: 'liveDhol', label: 'Live dhol', type: 'single', options: ['Included', 'Add-on', 'Not available'] },
          { key: 'wirelessMics', label: 'Wireless mics', type: 'single', options: ['1', '2', '3', 'None'] },
        ],
      },
    ],
  },
  Pandit: {
    styles: ['Telugu Traditional', 'Vedic', 'Arya Vysya', 'Multi-tradition', 'North Indian'],
    inclusions: ['Full Ceremony', 'Homam Setup', 'Muhurtham Consultation', 'Ganapathi Puja', 'Pooja Samagri', 'Mangala Vaadyam', 'Talambralu', 'Jeelakarra Bellam', 'Saptapadi', 'Appaginthalu', 'Gruha Pravesham'],
    priceRange: { min: 5000, max: 100000, step: 2500 },
    steps: [
      {
        title: 'Ceremony details',
        subtitle: 'What ceremonies does this cover?',
        fields: [
          { key: 'tradition', label: 'Tradition', type: 'single', options: ['Telugu Brahmin', 'Telugu Niyogi', 'Arya Vysya', 'Multi-tradition', 'North Indian', 'Other'] },
          { key: 'ceremonies', label: 'Ceremonies covered', type: 'multi', options: ['Ganapathi Puja', 'Punyahavachanam', 'Haldi', 'Bottu', 'Snathakam', 'Kashi Yatra', 'Mangalsutra Dharana', 'Talambralu', 'Jeelakarra Bellam', 'Saptapadi', 'Appaginthalu', 'Gruha Pravesham', 'Engagement', 'Satyanarayana Vratham'] },
          { key: 'duration', label: 'Ceremony duration', type: 'single', options: ['1 hour', '2 hours', '3 hours', '4 hours', 'Full day'] },
          { key: 'languages', label: 'Languages', type: 'multi', options: ['Telugu', 'Sanskrit', 'Hindi', 'Tamil', 'Kannada', 'English'] },
        ],
      },
      {
        title: 'Logistics',
        subtitle: 'What else is included?',
        fields: [
          { key: 'samagri', label: 'Pooja samagri', type: 'single', options: ['Included', 'Extra cost', 'Not included'] },
          { key: 'homamSetup', label: 'Homam / Agni setup', type: 'single', options: ['Included', 'Client provides'] },
          { key: 'muhurthamConsult', label: 'Muhurtham consultation', type: 'single', options: ['Included', 'Add-on', 'Not available'] },
          { key: 'teamSize', label: 'Team on event day', type: 'single', options: ['Solo', 'Pandit + 1 assistant', 'Pandit + 2 assistants', 'Pandit + 3+ assistants'] },
          { key: 'travel', label: 'Travel outside city', type: 'single', options: ['Yes', 'Up to 50km', 'Up to 100km', 'No'] },
        ],
      },
    ],
  },
  Invitations: {
    styles: ['Luxury Boxed', 'Digital Only', 'Eco-Friendly', 'Traditional Print', 'Designer', 'Acrylic'],
    inclusions: ['Design', 'Printing', 'Box Packaging', 'Digital Version', 'RSVP Tracking', 'Envelope', 'Wax Seal', 'Ribbon', 'Sweet Box', 'Delivery'],
    priceRange: { min: 50, max: 2000, step: 50 },
    steps: [
      {
        title: 'Invitation details',
        subtitle: 'What type of invitation is this?',
        fields: [
          { key: 'inviteType', label: 'Type', type: 'single', options: ['Printed card', 'Boxed invite', 'Digital only', 'Scroll', 'Eco-friendly', 'Acrylic', 'MDF'] },
          { key: 'design', label: 'Design', type: 'single', options: ['In-house custom', 'Template-based', 'Client provides design'] },
          { key: 'customization', label: 'Customization', type: 'single', options: ['Full custom design', 'Name, date, venue only', 'Limited changes'] },
          { key: 'languages', label: 'Languages', type: 'multi', options: ['English', 'Hindi', 'Telugu', 'Tamil', 'Kannada', 'Urdu', 'Bilingual'] },
        ],
      },
      {
        title: 'Order & delivery',
        subtitle: 'Quantities and timelines.',
        fields: [
          { key: 'minQty', label: 'Min order', type: 'single', options: ['No minimum', '25', '50', '100', '200'] },
          { key: 'maxQty', label: 'Max order', type: 'single', options: ['200', '500', '1000', 'No limit'] },
          { key: 'deliveryTimeline', label: 'Delivery timeline', type: 'single', options: ['7 days', '14 days', '21 days', '30 days'] },
          { key: 'deliveryMode', label: 'Delivery', type: 'single', options: ['Included (within city)', 'Extra charge', 'Pickup only'] },
          { key: 'digitalVersion', label: 'Digital version', type: 'single', options: ['Included', 'Add-on', 'Not available'] },
        ],
      },
      {
        title: 'Packaging extras',
        subtitle: 'The finishing touches.',
        fields: [
          { key: 'envelope', label: 'Envelope', type: 'single', options: ['Included', 'Add-on', 'Not included'] },
          { key: 'boxPackaging', label: 'Box / packaging', type: 'single', options: ['Included', 'Add-on', 'Not included'] },
          { key: 'sweetBox', label: 'Sweet box option', type: 'single', options: ['Available', 'Not available'] },
          { key: 'waxSeal', label: 'Wax seal / ribbon', type: 'single', options: ['Included', 'Add-on', 'Not available'] },
          { key: 'rsvpTracking', label: 'RSVP tracking (digital)', type: 'single', options: ['Included', 'Not available'] },
        ],
      },
    ],
  },
  Banjantrilu: {
    styles: ['Traditional Telugu', 'South Indian Classical', 'Carnatic Fusion', 'Procession Special', 'Temple Style'],
    inclusions: ['Nadaswaram', 'Dhol', 'Tavil', 'Sannai', 'Mela Talam', 'Traditional Attire', 'Travel within City', 'Mangalasnanam Set', 'Baraat Set', 'Muhurtham Set', 'Stage Setup'],
    priceRange: { min: 5000, max: 80000, step: 2500 },
    steps: [
      {
        title: 'Ensemble details',
        subtitle: 'What does this package cover?',
        fields: [
          { key: 'instruments', label: 'Instruments', type: 'multi', options: ['Nadaswaram', 'Dhol', 'Tavil', 'Sannai', 'Mela Talam', 'Tabla', 'Mridangam', 'Shehnai'] },
          { key: 'ensembleSize', label: 'Group size', type: 'single', options: ['Solo', '2-3 artists', '4-6 artists', '7-10 artists', '10+ artists'] },
          { key: 'ceremoniesCovered', label: 'Ceremonies covered', type: 'multi', options: ['Baraat / Procession', 'Muhurtham', 'Mangalasnanam', 'Pelli Koduku/Kuthuru', 'Reception entry', 'Talambralu'] },
          { key: 'performanceDuration', label: 'Performance duration', type: 'single', options: ['1 hour', '2 hours', '3 hours', '4 hours', 'Full ceremony'] },
        ],
      },
      {
        title: 'Logistics & extras',
        subtitle: 'What else comes with this?',
        fields: [
          { key: 'travelIncluded', label: 'Travel', type: 'single', options: ['Within city included', 'Up to 50km', 'Up to 100km', 'Extra charge'] },
          { key: 'attire', label: 'Attire', type: 'single', options: ['Traditional included', 'Modern attire', 'Couple provides'] },
          { key: 'soundAmplification', label: 'Sound amplification', type: 'single', options: ['Included', 'Add-on', "Use venue's"] },
          { key: 'rehearsal', label: 'Pre-event rehearsal', type: 'single', options: ['Included', 'Add-on', 'Not available'] },
        ],
      },
    ],
  },
  Reels: {
    styles: ['Cinematic', 'Trend-based', 'Story-driven', 'Couple POV', 'Vintage Film', 'Highlight Cuts'],
    inclusions: ['Pre-Wedding Reel', 'Wedding Day Reel', 'Reception Reel', 'Same-Day Edit', 'Music Licensing', 'Captions / Subtitles', 'Raw Footage', 'Multiple Aspect Ratios', 'Trending Audio', 'Drone Footage'],
    priceRange: { min: 15000, max: 250000, step: 5000 },
    steps: [
      {
        title: 'Coverage details',
        subtitle: 'What does this package cover?',
        fields: [
          { key: 'reelsIncluded', label: 'Reels included', type: 'single', options: ['1 reel', '2 reels', '3 reels', '5 reels', '5+ reels'] },
          { key: 'reelStyles', label: 'Style', type: 'multi', options: ['Cinematic', 'Candid', 'Trend-based', 'Story-driven', 'Couple POV', 'Vintage Film'] },
          { key: 'reelDuration', label: 'Reel duration', type: 'single', options: ['Under 30s', '30-60s', '60-90s', '90s+'] },
          { key: 'coverageHours', label: 'On-site coverage', type: 'single', options: ['2h', '4h', '6h', '8h', 'Full day'] },
          { key: 'crewSize', label: 'Crew size', type: 'single', options: ['1', '2', '3', '4+'] },
          { key: 'equipment', label: 'Equipment used', type: 'multi', options: ['Mirrorless', 'Gimbal', 'Drone', 'Action Cam', 'Smartphone Pro', 'LED Panels'] },
        ],
      },
      {
        title: 'Deliverables',
        subtitle: 'What do couples receive?',
        fields: [
          { key: 'turnaroundTime', label: 'Turnaround', type: 'single', options: ['Same day', '24 hours', '3 days', '7 days', '14 days'] },
          { key: 'platforms', label: 'Platforms delivered', type: 'multi', options: ['Instagram', 'YouTube Shorts', 'Facebook', 'WhatsApp', 'Raw files'] },
          { key: 'aspectRatios', label: 'Aspect ratios', type: 'multi', options: ['9:16 Vertical', '1:1 Square', '16:9 Landscape'] },
          { key: 'droneFootage', label: 'Drone footage', type: 'single', options: ['Included', 'Add-on', 'Not available'] },
          { key: 'sameDayEdit', label: 'Same-day reel', type: 'single', options: ['Yes', 'No'] },
          { key: 'music', label: 'Music', type: 'single', options: ['Royalty-free included', 'Trending audio', 'Couple provides'] },
        ],
      },
    ],
  },
  'Hair Stylist': {
    styles: ['Traditional South Indian', 'Modern Glam', 'Boho Floral', 'Sleek & Polished', 'Vintage Curls'],
    inclusions: ['Bridal Hair', 'Engagement Look', 'Reception Look', 'Hair Extensions', 'Floral Setup', 'Hair Accessories Setup', 'Family Hair', 'Touch-Up Kit', 'Pre-Bridal Hair Care', 'Travel to Venue'],
    priceRange: { min: 5000, max: 80000, step: 2500 },
    steps: [
      {
        title: 'Service details',
        subtitle: 'What does this package include?',
        fields: [
          { key: 'looksIncluded', label: 'Looks included', type: 'single', options: ['1 look', '2 looks', '3 looks', '4 looks'] },
          { key: 'styleTypes', label: 'Style', type: 'multi', options: ['Traditional Braids', 'Updos & Buns', 'Curls', 'Sleek Straight', 'Floral Hair Setup', 'Modern Glam'] },
          { key: 'teamSize', label: 'Team on event day', type: 'single', options: ['Solo', '2 stylists', '3 stylists', '4+ stylists'] },
          { key: 'hairExtensions', label: 'Hair extensions', type: 'single', options: ['Included', 'Add-on', 'Couple provides', 'Not used'] },
          { key: 'accessoriesIncluded', label: 'Hair accessories (pins, clips, jewellery)', type: 'single', options: ['Included', 'Add-on', 'Couple provides', 'Not used'] },
          { key: 'accessorySetup', label: 'Accessory / floral setup', type: 'single', options: ['Included', 'Add-on', 'Not available'] },
        ],
      },
      {
        title: 'Products & logistics',
        subtitle: 'The finer details.',
        fields: [
          { key: 'products', label: 'Products used', type: 'multi', options: ['L\'Oréal', 'Schwarzkopf', 'Wella', 'Streax', 'Matrix', 'Olaplex', 'Mix of brands'] },
          { key: 'trialSession', label: 'Trial session', type: 'single', options: ['Included', 'Extra cost', 'Not available'] },
          { key: 'travelToVenue', label: 'Travel to venue', type: 'single', options: ['Included', 'Extra charge', 'Studio only'] },
          { key: 'familyHair', label: 'Family hair styling', type: 'single', options: ['Available', 'Add-on', 'Not available'] },
          { key: 'preBridalCare', label: 'Pre-bridal hair care', type: 'single', options: ['Included', 'Add-on', 'Not available'] },
        ],
      },
    ],
  },
  'Live Stalls': {
    styles: ['Live Paintings / Portraits', 'Caricatures', 'Bangle Stall', 'Live Mehendi (guest)', 'Saree Draping', 'Tarot / Astrology', 'Pottery / Craft Station', 'Calligraphy / Name Personalization', 'Temporary Tattoo Artist', 'Photo Booth (Instant Prints)'],
    inclusions: ['Materials Included', 'Setup Table & Chairs', 'Backdrop / Signage', 'Take-Home Gift for Guests', 'Branded Attire', 'Live Demo', 'Custom Theme Setup', 'Background Music', 'Power Strip / Lighting', 'Travel Within City'],
    priceRange: { min: 3000, max: 100000, step: 1000 },
    steps: [
      {
        title: 'Stall details',
        subtitle: 'What kind of stall is this?',
        fields: [
          { key: 'stallType', label: 'Stall type', type: 'single', options: ['Live Paintings / Portraits', 'Caricatures', 'Bangle Stall', 'Live Mehendi (guest)', 'Saree Draping', 'Tarot / Astrology', 'Pottery / Craft Station', 'Calligraphy / Name Personalization', 'Temporary Tattoo Artist', 'Photo Booth (Instant Prints)'] },
          { key: 'artistsOnDuty', label: 'Artists on duty', type: 'single', options: ['1', '2', '3', '4+'] },
          { key: 'duration', label: 'Stall duration', type: 'single', options: ['1 hour', '2 hours', '3 hours', '4 hours', 'Full event'] },
          { key: 'guestsPerHour', label: 'Guests served per hour', type: 'single', options: ['Under 10', '10-20', '20-40', '40+'] },
        ],
      },
      {
        title: 'Setup & extras',
        subtitle: 'What logistics are involved?',
        fields: [
          { key: 'setupNeeded', label: 'What setup is needed?', type: 'multi', options: ['Table + chairs', 'Power outlet', 'Backdrop wall', 'Lighting', 'Branded signage', 'Background music', 'Dedicated area'] },
          { key: 'materialsIncluded', label: 'Materials', type: 'single', options: ['All included', 'Partial', 'Couple provides'] },
          { key: 'takeHomeGift', label: 'Take-home gift for guests', type: 'single', options: ['Included', 'Add-on', 'Not available'] },
          { key: 'attire', label: 'Attire', type: 'single', options: ['Traditional', 'Casual', 'Branded uniform', 'Theme-appropriate'] },
          { key: 'travel', label: 'Travel', type: 'single', options: ['Within city included', 'Up to 50km', 'Up to 100km', 'Extra charge'] },
        ],
      },
    ],
  },
  'Hosts / Entertainers': {
    styles: ['Magician', 'Mentalist', 'Anchor / MC', 'Stand-up Comedian', 'Sufi / Ghazal Singer', 'Folk Dancers', 'Mixology / Bartender Show', 'Mimicry Artist', 'Game Show Host', 'Karaoke Host', 'Live Music (Instrumental)'],
    inclusions: ['Sound System', 'Costumes / Props', 'Customized Script', 'Bilingual Performance', 'Pre-event Rehearsal', 'Audience Interaction', 'Branded Signage', 'Travel Within City', 'Sound Check Before Event'],
    priceRange: { min: 10000, max: 300000, step: 5000 },
    steps: [
      {
        title: 'Performance details',
        subtitle: 'What does this act cover?',
        fields: [
          { key: 'performanceType', label: 'Type', type: 'single', options: ['Magician', 'Mentalist', 'Anchor / MC', 'Stand-up Comedian', 'Sufi / Ghazal Singer', 'Folk Dancers', 'Mixology / Bartender Show', 'Mimicry Artist', 'Game Show Host', 'Karaoke Host', 'Live Music (Instrumental)'] },
          { key: 'duration', label: 'Performance duration', type: 'single', options: ['30 min', '1 hour', '2 hours', '3 hours', 'Full event'] },
          { key: 'groupSize', label: 'Group size', type: 'single', options: ['Solo', '2-3 performers', '4-6 performers', '7+ performers'] },
          { key: 'languages', label: 'Performance language', type: 'multi', options: ['Telugu', 'Hindi', 'English', 'Tamil', 'Kannada', 'Bilingual'] },
        ],
      },
      {
        title: 'Logistics & extras',
        subtitle: 'What else comes with this?',
        fields: [
          { key: 'soundSystem', label: 'Sound system', type: 'single', options: ['Included (own)', 'Available at extra cost', "Use venue's"] },
          { key: 'customScript', label: 'Custom script / content', type: 'single', options: ['Included', 'Add-on', 'Standard set'] },
          { key: 'rehearsal', label: 'Pre-event rehearsal', type: 'single', options: ['Included', 'Add-on', 'Not available'] },
          { key: 'audienceFit', label: 'Audience fit', type: 'multi', options: ['Family-friendly', 'Adult / Cocktail', 'Kids-focused'] },
          { key: 'travel', label: 'Travel', type: 'single', options: ['Within city included', 'Up to 50km', 'Up to 100km', 'Extra charge'] },
        ],
      },
    ],
  },
  'Wedding Props': {
    styles: ['Traditional Telugu', 'Modern Fusion', 'Premium Heritage', 'Eco-friendly', 'Custom Designed'],
    inclusions: ['Delivery within city', 'Setup at venue', 'Take-down after event', 'Customizable design', 'Hand-painted', 'Includes accessories', 'Photographer-friendly', 'Branded signage', 'Rental insurance', 'Damage protection'],
    priceRange: { min: 1000, max: 100000, step: 500 },
    steps: [
      {
        title: 'Prop details',
        subtitle: 'What does this listing include?',
        fields: [
          { key: 'propType', label: 'Which prop', type: 'single', options: ['Aduthera (Bridal Seat)', 'Pelli Butta', 'Pelli Pendiri', 'Coconut Painting', 'Talambralu Plates', 'Mangalasnanam Vessels', 'Pendyala (Wedding Pot)', 'Kalasham Set', 'Garlands', 'Plantain Leaves & Bananas', 'Photo Booth Backdrops', 'Decorative Umbrellas', 'Welcome Signage', 'Couple Chairs / Thrones', 'Decorative Pots & Bowls', 'Custom Combo'] },
          { key: 'quantity', label: 'Quantity', type: 'single', options: ['1 piece', '2 pieces', 'Set of 4', 'Set of 8', 'Set of 12', 'Custom set'] },
          { key: 'material', label: 'Material', type: 'single', options: ['Wood', 'Bamboo', 'Metal', 'Clay', 'Fabric', 'Mixed materials'] },
          { key: 'condition', label: 'Condition', type: 'single', options: ['Brand new', 'Like new', 'Well maintained'] },
        ],
      },
      {
        title: 'Service & delivery',
        subtitle: 'How does the booking work?',
        fields: [
          { key: 'serviceModel', label: 'Rental or sale', type: 'single', options: ['Rental', 'Sale', 'Both available'] },
          { key: 'delivery', label: 'Delivery', type: 'single', options: ['Within city included', 'Delivery extra charge', 'Pickup from store only'] },
          { key: 'setup', label: 'Setup at venue', type: 'single', options: ['Included', 'Add-on', 'Not available'] },
          { key: 'customization', label: 'Customization', type: 'single', options: ['Custom design available', 'Limited customization', 'Standard catalog only'] },
          { key: 'pickup', label: 'Return / pickup (rentals)', type: 'single', options: ['Vendor picks up', 'Couple returns', 'Not applicable (sale)'] },
        ],
      },
    ],
  },
  'Saree Draping': {
    styles: ['Nivi Classic', 'Bengali Traditional', 'Lehenga Saree', 'Mermaid Drape', 'Maharashtrian Nauvari', 'Modern Fusion'],
    inclusions: ['Bridal Drape', 'Reception Drape', 'Engagement Drape', 'Pins & Safety Pins', 'Pleat Setting', 'Family Drapes', 'Pre-Drape Consultation', 'Touch-Up On-Site', 'Travel to Venue'],
    priceRange: { min: 2000, max: 40000, step: 500 },
    steps: [
      {
        title: 'Service details',
        subtitle: 'What does this package cover?',
        fields: [
          { key: 'drapesIncluded', label: 'Drapes included', type: 'single', options: ['1 drape', '2 drapes', '3 drapes', '4+ drapes'] },
          { key: 'drapingStyles', label: 'Styles offered', type: 'multi', options: ['Nivi (Andhra)', 'Bengali', 'Maharashtrian Nauvari', 'Gujarati Seedha Pallu', 'Lehenga Saree', 'Mermaid', 'Butterfly', 'Modern Fusion'] },
          { key: 'timePerDrape', label: 'Time per drape', type: 'single', options: ['15 min', '20 min', '30 min', '45 min'] },
          { key: 'teamSize', label: 'Team on event day', type: 'single', options: ['Solo', '2 drapers', '3 drapers', '4+ drapers'] },
          { key: 'pleatSetting', label: 'Custom pleat setting', type: 'single', options: ['Included', 'Add-on', 'Standard only'] },
        ],
      },
      {
        title: 'Extras & logistics',
        subtitle: 'How does service work?',
        fields: [
          { key: 'pins', label: 'Pins & accessories', type: 'single', options: ['Included', 'Add-on', 'Bride provides'] },
          { key: 'travelToVenue', label: 'Travel to venue', type: 'single', options: ['Included', 'Extra charge', 'Studio only'] },
          { key: 'familyDrapes', label: 'Family / guest drapes', type: 'single', options: ['Bride only', 'Bride + 3', 'Bride + 5', 'Bride + 10', 'Unlimited add-on'] },
          { key: 'consultation', label: 'Pre-event consultation', type: 'single', options: ['Included', 'Add-on', 'Not available'] },
          { key: 'touchUp', label: 'On-site touch-up', type: 'single', options: ['Included', 'Add-on', 'Not available'] },
        ],
      },
    ],
  },
}

// ─── RITUALS / EVENTS ───────────────────────

/** All rituals/events a listing can be tagged for (used for couple-vendor matching) */
export const RITUALS = ['Engagement', 'Pelli Choopulu', 'Bottu', 'Haldi', 'Mehendi', 'Sangeeth', 'Pelli (Wedding)', 'Reception']

/** Get the listing config for a category, with a safe fallback */
export function getListingConfig(category: string): CategoryListingConfig {
  return LISTING_CONFIG[category] || LISTING_CONFIG['Photography']
}

/** Get the onboarding config for a category, with a safe fallback */
export function getOnboardingConfig(category: string): CategoryOnboardingConfig | null {
  return ONBOARDING_CONFIG[category] || null
}
