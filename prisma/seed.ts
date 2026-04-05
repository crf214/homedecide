// prisma/seed.ts
// Run with: npx prisma db seed
// This seeds default criteria for new users — called after registration

export const DEFAULT_CRITERIA = [
  // Layout & Space
  { name: 'Layout & flow',         category: 'Layout & space',     ratingType: 'num',  weight: 2,   required: true,  position: 0,  description: 'How well does the floor plan work for daily living? Flow between rooms.' },
  { name: 'Use of space',          category: 'Layout & space',     ratingType: 'num',  weight: 1.5, required: true,  position: 1,  description: 'Efficient use of sq footage, storage, room proportions, ceiling height.' },
  { name: 'Natural light',         category: 'Layout & space',     ratingType: 'num',  weight: 2,   required: true,  position: 2,  description: 'Quality and quantity of natural light throughout the day. Aspect.' },
  { name: 'Privacy',               category: 'Layout & space',     ratingType: 'num',  weight: 1.5, required: true,  position: 3,  description: 'From neighbours, street-level, overlooking windows, garden.' },
  { name: 'Ability to hang art',   category: 'Layout & space',     ratingType: 'star', weight: 1,   required: false, position: 4,  description: 'Wall space, ceiling height, surface quality, lighting for art.' },

  // Condition & Fabric
  { name: 'Finishes quality',      category: 'Condition & fabric', ratingType: 'num',  weight: 1.5, required: true,  position: 5,  description: 'Kitchen, bathrooms, flooring, joinery, paintwork quality.' },
  { name: 'Insulation & glazing',  category: 'Condition & fabric', ratingType: 'num',  weight: 2,   required: true,  position: 6,  description: 'Draught proofing, double/triple glazing, loft & wall insulation.' },
  { name: 'Heating system',        category: 'Condition & fabric', ratingType: 'num',  weight: 1.5, required: true,  position: 7,  description: 'Boiler age & type, radiators, underfloor heating, running cost estimate.' },
  { name: 'Renovation required',   category: 'Condition & fabric', ratingType: 'num',  weight: 2,   required: true,  position: 8,  description: '10 = move-in ready, 1 = full gut renovation needed.' },
  { name: 'Structural condition',  category: 'Condition & fabric', ratingType: 'num',  weight: 2,   required: true,  position: 9,  description: 'Roof, walls, damp, subsidence risk, chimney, foundations.' },

  // Location
  { name: 'Position in neighbourhood', category: 'Location',       ratingType: 'num',  weight: 2,   required: true,  position: 10, description: 'Quiet street, corner plot, aspect, proximity to parks & green space.' },
  { name: 'Public transport access',   category: 'Location',       ratingType: 'num',  weight: 2,   required: true,  position: 11, description: 'Walking distance to tube/rail/bus. 10 = excellent connections.' },
  { name: 'Airport access',            category: 'Location',       ratingType: 'num',  weight: 1,   required: false, position: 12, description: 'Time and ease of reaching nearest major airport (Heathrow, Gatwick, etc.).' },
  { name: 'Running errands ease',      category: 'Location',       ratingType: 'num',  weight: 1.5, required: true,  position: 13, description: 'Supermarket, pharmacy, post office, cafés within walking distance.' },

  // Lifestyle fit
  { name: 'Commute to work',       category: 'Lifestyle fit',      ratingType: 'num',  weight: 2,   required: false, position: 14, description: 'Door-to-door commute time, reliability, and comfort.' },
  { name: 'Hosting guests/family', category: 'Lifestyle fit',      ratingType: 'num',  weight: 1.5, required: true,  position: 15, description: 'Spare bedroom, living space, ability to host dinner parties.' },
  { name: 'Outdoor space',         category: 'Lifestyle fit',      ratingType: 'num',  weight: 1.5, required: true,  position: 16, description: 'Garden, terrace, balcony — size, quality, privacy, orientation.' },
  { name: 'Parking',               category: 'Lifestyle fit',      ratingType: 'star', weight: 1,   required: false, position: 17, description: 'Off-street parking, garage, permit zone, EV charging potential.' },
];
