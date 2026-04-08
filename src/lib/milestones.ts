export interface Milestone {
  label: string
  description: string
  daysFromBooking: number // days after booking when this milestone is expected
}

// Category-specific milestones
const milestonesMap: Record<string, Milestone[]> = {
  Venue: [
    { label: 'Slot Booked', description: 'Booking confirmed, advance paid', daysFromBooking: 0 },
    { label: 'Site Visit', description: 'Visit venue with family', daysFromBooking: 7 },
    { label: 'Layout Finalized', description: 'Seating, stage & decor layout confirmed', daysFromBooking: 30 },
    { label: '50% Payment', description: 'Second installment due', daysFromBooking: 45 },
    { label: 'Final Walkthrough', description: 'Pre-event check with venue manager', daysFromBooking: -3 },
    { label: 'Event Day', description: 'Setup begins at venue', daysFromBooking: -1 },
  ],
  Catering: [
    { label: 'Slot Booked', description: 'Booking confirmed, advance paid', daysFromBooking: 0 },
    { label: 'Menu Tasting', description: 'Sample menu with family', daysFromBooking: 14 },
    { label: 'Menu Finalized', description: 'Final dishes & guest count confirmed', daysFromBooking: 30 },
    { label: '50% Payment', description: 'Second installment due', daysFromBooking: 40 },
    { label: 'Final Headcount', description: 'Confirm exact guest numbers', daysFromBooking: -7 },
    { label: 'Kitchen Prep', description: 'Catering team begins prep', daysFromBooking: -1 },
  ],
  Decor: [
    { label: 'Slot Booked', description: 'Booking confirmed, advance paid', daysFromBooking: 0 },
    { label: 'Mood Board Review', description: 'Review theme, colors & props', daysFromBooking: 10 },
    { label: 'Design Approved', description: 'Final decor layout signed off', daysFromBooking: 25 },
    { label: '50% Payment', description: 'Second installment due', daysFromBooking: 35 },
    { label: 'Setup Day', description: 'Decor team begins on-site setup', daysFromBooking: -1 },
  ],
  Photography: [
    { label: 'Slot Booked', description: 'Booking confirmed, advance paid', daysFromBooking: 0 },
    { label: 'Pre-Wedding Shoot', description: 'Couple photoshoot scheduled', daysFromBooking: 21 },
    { label: 'Shot List Finalized', description: 'Must-have moments confirmed', daysFromBooking: -14 },
    { label: 'Full Payment', description: 'Balance payment due', daysFromBooking: -7 },
    { label: 'Event Day', description: 'Photographer arrives for coverage', daysFromBooking: -1 },
    { label: 'Delivery', description: 'Photos & album delivered', daysFromBooking: 30 },
  ],
  Mehendi: [
    { label: 'Slot Booked', description: 'Booking confirmed, advance paid', daysFromBooking: 0 },
    { label: 'Design Selection', description: 'Choose bridal mehendi patterns', daysFromBooking: 14 },
    { label: 'Full Payment', description: 'Balance payment due', daysFromBooking: -7 },
    { label: 'Mehendi Day', description: 'Artist arrives for application', daysFromBooking: -1 },
  ],
  Makeup: [
    { label: 'Slot Booked', description: 'Booking confirmed, advance paid', daysFromBooking: 0 },
    { label: 'Trial Session', description: 'Bridal makeup trial run', daysFromBooking: 14 },
    { label: 'Look Finalized', description: 'Final looks & products confirmed', daysFromBooking: -14 },
    { label: 'Full Payment', description: 'Balance payment due', daysFromBooking: -5 },
    { label: 'Event Day', description: 'MUA arrives for bridal prep', daysFromBooking: -1 },
  ],
  'DJ / Music': [
    { label: 'Slot Booked', description: 'Booking confirmed, advance paid', daysFromBooking: 0 },
    { label: 'Playlist Shared', description: 'Share must-play & do-not-play lists', daysFromBooking: 14 },
    { label: 'Sound Check', description: 'Equipment & venue sound test', daysFromBooking: -2 },
    { label: 'Event Day', description: 'DJ setup & soundcheck', daysFromBooking: -1 },
  ],
  Pandit: [
    { label: 'Slot Booked', description: 'Booking confirmed, advance paid', daysFromBooking: 0 },
    { label: 'Rituals Discussed', description: 'Ceremony flow & customs finalized', daysFromBooking: 14 },
    { label: 'Muhurat Confirmed', description: 'Auspicious timings set', daysFromBooking: -7 },
    { label: 'Ceremony Day', description: 'Pandit arrives for rituals', daysFromBooking: -1 },
  ],
  Invitations: [
    { label: 'Slot Booked', description: 'Booking confirmed, advance paid', daysFromBooking: 0 },
    { label: 'Design Proof', description: 'First draft of invitation design', daysFromBooking: 7 },
    { label: 'Design Approved', description: 'Final design signed off', daysFromBooking: 14 },
    { label: 'Printing Starts', description: 'Cards sent to print', daysFromBooking: 18 },
    { label: 'Delivered', description: 'Invitations ready for distribution', daysFromBooking: 28 },
  ],
}

// Default milestones for any category not explicitly mapped
const defaultMilestones: Milestone[] = [
  { label: 'Slot Booked', description: 'Booking confirmed, advance paid', daysFromBooking: 0 },
  { label: 'Initial Discussion', description: 'Requirements & details discussed', daysFromBooking: 7 },
  { label: '50% Payment', description: 'Second installment due', daysFromBooking: 30 },
  { label: 'Final Confirmation', description: 'All details locked in', daysFromBooking: -7 },
  { label: 'Event Day', description: 'Vendor arrives on-site', daysFromBooking: -1 },
]

export function getMilestones(categoryLabel: string): Milestone[] {
  return milestonesMap[categoryLabel] || defaultMilestones
}

// For mock: simulate which milestones are completed (first one always done since booked)
export function getCompletedCount(categoryLabel: string): number {
  // In a real app this comes from backend. For mock, always just the first milestone.
  return 1
}
