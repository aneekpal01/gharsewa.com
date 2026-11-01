import { ServiceCategoryDTO, ServiceDTO, ServiceAreaSummaryDTO } from "./types";

export const SEED_SERVICE_AREAS: ServiceAreaSummaryDTO[] = [
  { id: "00000000-0000-4000-a000-000000000101", name: "MG Marg", slug: "mg-marg", pinCode: "737101" },
  { id: "00000000-0000-4000-a000-000000000102", name: "Lal Bazaar", slug: "lal-bazaar", pinCode: "737101" },
  { id: "00000000-0000-4000-a000-000000000103", name: "Deorali", slug: "deorali", pinCode: "737102" },
  { id: "00000000-0000-4000-a000-000000000104", name: "Tadong", slug: "tadong", pinCode: "737102" },
  { id: "00000000-0000-4000-a000-000000000105", name: "Development Area", slug: "development-area", pinCode: "737101" },
  { id: "00000000-0000-4000-a000-000000000106", name: "Arithang", slug: "arithang", pinCode: "737101" },
];

export const SEED_CATEGORIES: ServiceCategoryDTO[] = [
  {
    id: "00000000-0000-4000-a000-000000000201",
    name: "Electrical work",
    slug: "electrical-work",
    description: "Safe household electrical repairs, switchgear fixes, and wiring maintenance by verified technicians.",
    icon: "bolt",
    displayOrder: 1,
    isActive: true,
  },
  {
    id: "00000000-0000-4000-a000-000000000202",
    name: "Plumbing",
    slug: "plumbing",
    description: "Reliable pipeline leak repairs, tap replacements, and water flow troubleshooting across Gangtok.",
    icon: "drop",
    displayOrder: 2,
    isActive: true,
  },
  {
    id: "00000000-0000-4000-a000-000000000203",
    name: "Home cleaning",
    slug: "home-cleaning",
    description: "Structured deep room and bathroom sanitization designed specifically for hill climate homes.",
    icon: "sparkle",
    displayOrder: 3,
    isActive: true,
  },
  {
    id: "00000000-0000-4000-a000-000000000204",
    name: "Carpentry",
    slug: "carpentry",
    description: "Precision wood adjustments, door alignment, lock fittings, and custom shelf mountings.",
    icon: "tools",
    displayOrder: 4,
    isActive: true,
  },
  {
    id: "00000000-0000-4000-a000-000000000205",
    name: "Appliance repair",
    slug: "appliance-servicing",
    description: "Geyser, water heater, washing machine, and heating appliance diagnostics and repairs.",
    icon: "gear",
    displayOrder: 5,
    isActive: true,
  },
  {
    id: "00000000-0000-4000-a000-000000000206",
    name: "Painting",
    slug: "painting-care",
    description: "Targeted damp wall touch-ups, moisture sealant treatments, and fresh trim painting.",
    icon: "brush",
    displayOrder: 6,
    isActive: true,
  },
];

export const SEED_SERVICES: ServiceDTO[] = [
  {
    id: "00000000-0000-4000-a000-000000000301",
    categoryId: "00000000-0000-4000-a000-000000000201",
    name: "Switchboard & Socket Repair",
    slug: "switchboard-socket-repair",
    shortDescription: "Diagnosis and replacement of faulty switches, sockets, or loose modular wall plates.",
    description:
      "A technician visits your premises to inspect non-functional switches, burnt sockets, or loose connections. We test earthing and ensure all connections are properly isolated and secured according to domestic safety codes.",
    included: [
      "Safety inspection of circuit breaker and line voltage",
      "Repair or replacement of up to 3 standard switches or 1 modular socket board",
      "Loose connection tightening and terminal insulation tape application",
      "Post-repair functional load check",
    ],
    excluded: [
      "Cost of new replacement modular switch panels (charged at actual MRP if requested)",
      "Main distribution panel rewiring or conduit trenching",
      "Inverter motherboard component repair",
    ],
    conditions: [
      "Premises must provide safe access to the main distribution breaker during inspection.",
      "Any required replacement parts must be approved by the customer before installation.",
    ],
    pricingModel: "FLAT",
    basePrice: 249,
    estimatedDurationMinutes: 45,
    isActive: true,
    category: SEED_CATEGORIES[0],
    serviceAreas: SEED_SERVICE_AREAS,
  },
  {
    id: "00000000-0000-4000-a000-000000000302",
    categoryId: "00000000-0000-4000-a000-000000000201",
    name: "Ceiling Fan & Light Fixture Installation",
    slug: "fan-light-fixture-installation",
    shortDescription: "Secure mounting and wiring of ceiling fans, chandeliers, or decorative light fixtures.",
    description:
      "Professional mounting and electrical hook-up for ceiling fans, wall lamps, and LED batten fixtures. We verify ceiling anchor strength and ensure balanced, vibration-free operation.",
    included: [
      "Assembly and ceiling downrod installation of 1 ceiling fan or 2 light fixtures",
      "Proper phase/neutral wiring and regulator terminal connection",
      "Speed check and dynamic balance verification",
      "Tidying up wiring tails and insulation capping",
    ],
    excluded: [
      "New ceiling hook drilling into heavy reinforced concrete (available under civil add-ons)",
      "Supply of step ladders exceeding 10 feet",
      "Supply of decorative fixtures, bulbs, or fans",
    ],
    conditions: [
      "Ceiling junction box and hook must already be installed and structurally sound.",
    ],
    pricingModel: "FLAT",
    basePrice: 299,
    estimatedDurationMinutes: 60,
    isActive: true,
    category: SEED_CATEGORIES[0],
    serviceAreas: SEED_SERVICE_AREAS,
  },
  {
    id: "00000000-0000-4000-a000-000000000303",
    categoryId: "00000000-0000-4000-a000-000000000202",
    name: "Tap, Valve & Pipe Leak Repair",
    slug: "tap-valve-leak-repair",
    shortDescription: "Fix leaking bib cocks, angle valves, shower mixers, and exposed pipeline connections.",
    description:
      "Rapid resolution of continuous drips, leaking spindle washers, worn Teflon seals, and dripping angle valves that lead to water waste and wall dampness.",
    included: [
      "Disassembly and internal washer/cartridge inspection",
      "Replacement of worn spindle or Teflon seal tape",
      "Tightening and pressure check of up to 2 fixture fittings",
      "Basic cleanup around the repair area",
    ],
    excluded: [
      "Concealed pipeline breakage requiring wall chipping or masonry demolition",
      "Replacement brass valves or ceramic mixer cartridges (billed at vendor actuals)",
      "Overhead water tank float-valve replacement",
    ],
    conditions: [
      "Individual or line shut-off valve must be operational to isolate water flow during work.",
    ],
    pricingModel: "FLAT",
    basePrice: 299,
    estimatedDurationMinutes: 45,
    isActive: true,
    category: SEED_CATEGORIES[1],
    serviceAreas: SEED_SERVICE_AREAS,
  },
  {
    id: "00000000-0000-4000-a000-000000000304",
    categoryId: "00000000-0000-4000-a000-000000000202",
    name: "Cistern & Flush System Overhaul",
    slug: "cistern-flush-overhaul",
    shortDescription: "Complete diagnostic and repair of toilet flush tanks, siphons, and slow filling mechanisms.",
    description:
      "Resolve continuous running water, slow cistern refills, or broken flush levers. We adjust water levels, clean internal scale, and align dual-flush buttons.",
    included: [
      "Cistern internal mechanism inspection and descaling",
      "Siphon diaphragm alignment or replacement (standard silicone washer included)",
      "Inlet float valve adjustment for optimal water shutoff",
      "Flush leakage pressure test",
    ],
    excluded: [
      "Entire ceramic cistern replacement or toilet commode unseating",
      "High-end concealed pneumatic dual-flush actuator spare units",
    ],
    conditions: [
      "Water supply to the bathroom must be accessible.",
    ],
    pricingModel: "FLAT",
    basePrice: 349,
    estimatedDurationMinutes: 60,
    isActive: true,
    category: SEED_CATEGORIES[1],
    serviceAreas: SEED_SERVICE_AREAS,
  },
  {
    id: "00000000-0000-4000-a000-000000000305",
    categoryId: "00000000-0000-4000-a000-000000000203",
    name: "Intensive Bathroom Deep Cleaning",
    slug: "bathroom-deep-cleaning",
    shortDescription: "Thorough descaling of wall tiles, sanitization of fixtures, and floor grime removal.",
    description:
      "A deep scrub designed for high-humidity hill bathrooms. Removes stubborn hard-water stains, soap scum, grout discoloration, and sanitizes sanitary ware.",
    included: [
      "Tile wall stain removal and grout scrubbing with eco-safe descalers",
      "Toilet commode, wash basin, and faucet polishing",
      "Mirror, glass partition, and drain cover sanitization",
      "Floor scrubbing and deodorization",
    ],
    excluded: [
      "Regrouting of deteriorated tile joints",
      "Exhaust fan dismantling and electrical rewiring",
      "Removal of permanent acid burns or physical porcelain chips",
    ],
    conditions: [
      "Customer must provide continuous water and electrical connection during cleaning.",
      "Clear personal toiletries and medicines prior to service.",
    ],
    pricingModel: "FLAT",
    basePrice: 599,
    estimatedDurationMinutes: 90,
    isActive: true,
    category: SEED_CATEGORIES[2],
    serviceAreas: SEED_SERVICE_AREAS,
  },
  {
    id: "00000000-0000-4000-a000-000000000306",
    categoryId: "00000000-0000-4000-a000-000000000204",
    name: "Door Alignment & Lock Installation",
    slug: "door-alignment-lock-installation",
    shortDescription: "Fix stuck doors, sagging hinges, and fit new mortise or cylindrical door locks.",
    description:
      "Gangtok weather changes often cause timber expansion and door sticking. We plane door edges, tighten mortise latch pockets, and install fresh locksets.",
    included: [
      "Door edge planing and hinge shimming to eliminate sticking or dragging",
      "Chiseling and installation of 1 mortise lock or cylindrical latch",
      "Striker plate alignment and smooth latching check",
    ],
    excluded: [
      "Cost of lockset hardware and decorative door handles",
      "Entire wooden door frame replacement",
    ],
    conditions: [
      "Customer provides the chosen replacement lock hardware or requests ahead for procurement.",
    ],
    pricingModel: "FLAT",
    basePrice: 449,
    estimatedDurationMinutes: 75,
    isActive: true,
    category: SEED_CATEGORIES[3],
    serviceAreas: SEED_SERVICE_AREAS,
  },
  {
    id: "00000000-0000-4000-a000-000000000307",
    categoryId: "00000000-0000-4000-a000-000000000205",
    name: "Water Geyser Diagnostic & Descaling",
    slug: "water-geyser-diagnostic",
    shortDescription: "Heating element check, thermostat verification, and tank sediment flush.",
    description:
      "Vital preparation for Gangtok winters. We test electrical leakage, descale the storage tank, replace degraded sacrificial anode rods, and calibrate heating controls.",
    included: [
      "Power consumption and heating element resistance test",
      "Thermostat safety cutoff calibration",
      "Drainage and sediment flush of storage geyser tank (up to 25L)",
      "Inlet/outlet safety valve seal check",
    ],
    excluded: [
      "New heating coil or thermostat unit replacement (billed at actuals)",
      "Storage tank inner vessel welding for ruptured tanks",
    ],
    conditions: [
      "Power supply and drainage outlet must be operational at the installation spot.",
    ],
    pricingModel: "INSPECTION_FIRST",
    basePrice: 399,
    estimatedDurationMinutes: 60,
    isActive: true,
    category: SEED_CATEGORIES[4],
    serviceAreas: SEED_SERVICE_AREAS,
  },
  {
    id: "00000000-0000-4000-a000-000000000308",
    categoryId: "00000000-0000-4000-a000-000000000206",
    name: "Damp Wall Sealing & Spot Primer",
    slug: "damp-wall-sealing-primer",
    shortDescription: "Moisture barrier application and plaster scraping on peeling interior wall patches.",
    description:
      "Ideal for hill region masonry experiencing seasonal seepage. We scrape peeling paint flakes, apply anti-fungal barrier coats, and apply damp-block primer.",
    included: [
      "Scraping of loose paint and efflorescence salt on up to 50 sq ft",
      "Anti-fungal solution wash",
      "Application of 1 coat moisture-seal primer",
      "Surface sanding smooth ready for final paint",
    ],
    excluded: [
      "External roof waterproofing or exterior scaffolding work",
      "Full room final colour topcoat painting",
    ],
    conditions: [
      "Source of active running water leakage must be resolved prior to surface treatment.",
    ],
    pricingModel: "BASE_PLUS_HOURLY",
    basePrice: 699,
    estimatedDurationMinutes: 120,
    isActive: true,
    category: SEED_CATEGORIES[5],
    serviceAreas: [
      SEED_SERVICE_AREAS[0], // MG Marg
      SEED_SERVICE_AREAS[1], // Lal Bazaar
      SEED_SERVICE_AREAS[2], // Deorali
      SEED_SERVICE_AREAS[3], // Tadong
    ],
  },
];
