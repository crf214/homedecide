// src/lib/defaults.ts
// Called when a new user registers to seed their criteria

export const DEFAULT_CRITERIA = [
  { name: 'Layout & flow',             category: 'Layout & space',     ratingType: 'num'  as const, weight: 2,   required: true,  position: 0,  description: 'How well does the floor plan work for daily living?' },
  { name: 'Use of space',              category: 'Layout & space',     ratingType: 'num'  as const, weight: 1.5, required: true,  position: 1,  description: 'Efficient use of sq footage, storage, room proportions.' },
  { name: 'Natural light',             category: 'Layout & space',     ratingType: 'num'  as const, weight: 2,   required: true,  position: 2,  description: 'Quality and quantity of natural light. Aspect.' },
  { name: 'Privacy',                   category: 'Layout & space',     ratingType: 'num'  as const, weight: 1.5, required: true,  position: 3,  description: 'From neighbours, street, overlooking windows, garden.' },
  { name: 'Ability to hang art',       category: 'Layout & space',     ratingType: 'star' as const, weight: 1,   required: false, position: 4,  description: 'Wall space, ceiling height, surface quality.' },
  { name: 'Finishes quality',          category: 'Condition & fabric', ratingType: 'num'  as const, weight: 1.5, required: true,  position: 5,  description: 'Kitchen, bathrooms, flooring, joinery.' },
  { name: 'Insulation & glazing',      category: 'Condition & fabric', ratingType: 'num'  as const, weight: 2,   required: true,  position: 6,  description: 'Draught proofing, glazing, loft & wall insulation.' },
  { name: 'Heating system',            category: 'Condition & fabric', ratingType: 'num'  as const, weight: 1.5, required: true,  position: 7,  description: 'Boiler age, radiators, underfloor heating.' },
  { name: 'Renovation required',       category: 'Condition & fabric', ratingType: 'num'  as const, weight: 2,   required: true,  position: 8,  description: '10 = move-in ready, 1 = full gut renovation needed.' },
  { name: 'Structural condition',      category: 'Condition & fabric', ratingType: 'num'  as const, weight: 2,   required: true,  position: 9,  description: 'Roof, walls, damp, subsidence, chimney.' },
  { name: 'Position in neighbourhood', category: 'Location',           ratingType: 'num'  as const, weight: 2,   required: true,  position: 10, description: 'Quiet street, aspect, proximity to parks.' },
  { name: 'Public transport access',   category: 'Location',           ratingType: 'num'  as const, weight: 2,   required: true,  position: 11, description: 'Walking distance to tube/rail/bus.' },
  { name: 'Airport access',            category: 'Location',           ratingType: 'num'  as const, weight: 1,   required: false, position: 12, description: 'Time/ease to nearest major airport.' },
  { name: 'Running errands ease',      category: 'Location',           ratingType: 'num'  as const, weight: 1.5, required: true,  position: 13, description: 'Supermarket, pharmacy, cafés within walking distance.' },
  { name: 'Commute to work',           category: 'Lifestyle fit',      ratingType: 'num'  as const, weight: 2,   required: false, position: 14, description: 'Door-to-door commute time and reliability.' },
  { name: 'Hosting guests/family',     category: 'Lifestyle fit',      ratingType: 'num'  as const, weight: 1.5, required: true,  position: 15, description: 'Spare bedroom, living space, hosting dinners.' },
  { name: 'Outdoor space',             category: 'Lifestyle fit',      ratingType: 'num'  as const, weight: 1.5, required: true,  position: 16, description: 'Garden, terrace, balcony — size, quality, orientation.' },
  { name: 'Parking',                   category: 'Lifestyle fit',      ratingType: 'star' as const, weight: 1,   required: false, position: 17, description: 'Off-street parking, garage, EV charging potential.' },
]
