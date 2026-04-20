// ────────────────────────────────────────────
// Category-specific configuration for vendor
// onboarding and listing creation.
// All fields are selectable (chips/toggles/sliders).
// ────────────────────────────────────────────

export interface SelectField {
  key: string
  label: string
  type: 'single' | 'multi' | 'toggle' | 'slider'
  options?: string[]
  /** For toggle fields */
  toggleLabels?: [string, string]
  /** For slider fields */
  sliderMin?: number
  sliderMax?: number
  sliderStep?: number
  sliderUnit?: string
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
      { key: 'productsUsed', label: 'Products used', type: 'multi', options: ['MAC', 'Bobbi Brown', 'Charlotte Tilbury', 'Huda Beauty', 'Kryolan', 'Lakme', 'Mix of brands'] },
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
    subtitle: 'Help couples find the right fit for their traditions.',
    fields: [
      { key: 'traditions', label: 'Traditions', type: 'multi', options: ['Vedic', 'South Indian', 'Bengali', 'Marwari', 'Punjabi', 'Gujarati', 'Multi-tradition'] },
      { key: 'languages', label: 'Languages', type: 'multi', options: ['Hindi', 'Telugu', 'Sanskrit', 'Tamil', 'Bengali', 'English', 'Kannada'] },
      { key: 'samagriIncluded', label: 'Samagri (puja materials)', type: 'single', options: ['Included', 'Available at extra cost', 'Not included'] },
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
}

// ─── LISTING CONFIG ─────────────────────────

export const LISTING_CONFIG: Record<string, CategoryListingConfig> = {
  Venue: {
    styles: ['Royal Heritage', 'Garden Party', 'Modern Rooftop', 'Rustic Farmhouse', 'Beachside', 'Palace', 'Boutique Hotel'],
    inclusions: ['AC Hall', 'Parking', 'Valet', 'Bridal Suite', 'Guest Rooms', 'Sound System', 'In-house Catering', 'Generator Backup', 'Lawn Area', 'Pool Access', 'Elevator', 'Wi-Fi', 'CCTV', 'Security', 'Furniture', 'Basic Lighting', 'Cleaning'],
    priceRange: { min: 100000, max: 2000000, step: 50000 },
    steps: [
      {
        title: 'Venue details',
        subtitle: 'Describe this specific venue offering.',
        fields: [
          { key: 'venueType', label: 'Venue type', type: 'single', options: ['Banquet Hall', 'Farmhouse', 'Resort', 'Hotel', 'Lawn', 'Palace', 'Rooftop', 'Convention Center'] },
          { key: 'setting', label: 'Setting', type: 'single', options: ['Indoor', 'Outdoor', 'Both'] },
          { key: 'capacity', label: 'Guest capacity', type: 'slider', sliderMin: 50, sliderMax: 2000, sliderStep: 50, sliderUnit: 'guests' },
          { key: 'roomsAvailable', label: 'Rooms available', type: 'single', options: ['None', '1-5', '5-10', '10-20', '20+'] },
          { key: 'parkingSpots', label: 'Parking', type: 'single', options: ['No parking', '20 cars', '50 cars', '100 cars', '200+ cars'] },
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
          { key: 'cuisineTypes', label: 'Cuisine', type: 'multi', options: ['South Indian', 'North Indian', 'Mughlai', 'Rajasthani', 'Multi-Cuisine', 'Continental', 'Chinese', 'Fusion'] },
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
          { key: 'photographers', label: 'Photographers', type: 'single', options: ['1', '2', '3'] },
          { key: 'videographers', label: 'Videographers', type: 'single', options: ['0', '1', '2'] },
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
          { key: 'flowerType', label: 'Flowers', type: 'single', options: ['Fresh flowers', 'Artificial', 'Mix of both'] },
          { key: 'ledLighting', label: 'LED / Lighting', type: 'single', options: ['Included', 'Add-on', 'Not included'] },
        ],
      },
      {
        title: 'Setup & logistics',
        subtitle: 'How does the setup work?',
        fields: [
          { key: 'setupArea', label: 'Setup area', type: 'single', options: ['Small (hall)', 'Medium (lawn)', 'Large (full venue)'] },
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
          { key: 'groomMehendi', label: 'Groom mehendi', type: 'single', options: ['Included', 'Add-on', 'Not available'] },
          { key: 'glitterAddon', label: 'Glitter/stone add-on', type: 'single', options: ['Included', 'Add-on', 'Not available'] },
          { key: 'whiteMehendi', label: 'White mehendi', type: 'single', options: ['Available', 'Not available'] },
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
    styles: ['Vedic Rituals', 'South Indian', 'Bengali', 'Marwari', 'Multi-tradition'],
    inclusions: ['Full Ceremony', 'Havan Setup', 'Muhurat Consultation', 'Ganesh Puja', 'Samagri Included', 'Multi-Language', 'Varmala Ceremony', 'Vidai Rituals', 'Griha Pravesh'],
    priceRange: { min: 5000, max: 100000, step: 2500 },
    steps: [
      {
        title: 'Ceremony details',
        subtitle: 'What ceremonies does this cover?',
        fields: [
          { key: 'tradition', label: 'Tradition', type: 'single', options: ['Vedic', 'South Indian', 'Bengali', 'Marwari', 'Punjabi', 'Gujarati', 'Multi-tradition'] },
          { key: 'ceremonies', label: 'Ceremonies covered', type: 'multi', options: ['Ganesh Puja', 'Haldi', 'Wedding Main', 'Varmala', 'Pheras', 'Vidai', 'Griha Pravesh', 'Engagement', 'Satyanarayan Puja'] },
          { key: 'duration', label: 'Ceremony duration', type: 'single', options: ['1 hour', '2 hours', '3 hours', '4 hours', 'Full day'] },
          { key: 'languages', label: 'Languages', type: 'multi', options: ['Hindi', 'Telugu', 'Sanskrit', 'Tamil', 'Bengali', 'English', 'Kannada'] },
        ],
      },
      {
        title: 'Logistics',
        subtitle: 'What else is included?',
        fields: [
          { key: 'samagri', label: 'Samagri (puja materials)', type: 'single', options: ['Included', 'Extra cost', 'Not included'] },
          { key: 'havanKund', label: 'Havan kund setup', type: 'single', options: ['Included', 'Client provides'] },
          { key: 'muhuratConsult', label: 'Muhurat consultation', type: 'single', options: ['Included', 'Add-on', 'Not available'] },
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
}

// ─── RITUALS / EVENTS ───────────────────────

/** All rituals/events a listing can be tagged for (used for couple-vendor matching) */
export const RITUALS = ['Engagement', 'Pelli Choopulu', 'Haldi', 'Mehendi', 'Sangeet', 'Wedding', 'Reception']

/** Get the listing config for a category, with a safe fallback */
export function getListingConfig(category: string): CategoryListingConfig {
  return LISTING_CONFIG[category] || LISTING_CONFIG['Photography']
}

/** Get the onboarding config for a category, with a safe fallback */
export function getOnboardingConfig(category: string): CategoryOnboardingConfig | null {
  return ONBOARDING_CONFIG[category] || null
}
