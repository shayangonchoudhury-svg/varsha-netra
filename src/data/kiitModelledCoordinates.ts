/**
 * Varshaনেত্র — Georeferenced Demonstration Model for KIIT Campus (Bhubaneswar, Odisha)
 *
 * DATA PROVENANCE NOTICE:
 * Base map geometry is anchored around KIIT University campus area in Bhubaneswar (~20.354° N, 85.818° E).
 * The zone boundary polygons, flow vectors, and drainage alignments defined below are DEMONSTRATION
 * MODELLED COORDINATES engineered to provide spatial context for the deterministic hydrology engine.
 * They are not surveyed institutional GIS boundaries or official campus flood mappings.
 */

export interface ModelledZoneGeo {
  zoneId: string;
  zoneCode: string;
  name: string;
  shortName: string;
  center: [number, number]; // [Latitude, Longitude]
  polygon: [number, number][]; // Array of [Latitude, Longitude] vertices
  elevationMeters: number;
  isCentralDetention?: boolean;
}

export interface ModelledFlowLine {
  id: string;
  fromZoneId: string;
  toZoneId: string;
  coordinates: [number, number][]; // Lat/Lng waypoints
  type: 'surface_vector' | 'storm_conduit';
  label: string;
}

// KIIT University Campus Demonstration Anchor Center
export const KIIT_CAMPUS_GEO_CENTER: [number, number] = [20.3538, 85.8175];
export const KIIT_DEFAULT_ZOOM = 16;
export const KIIT_MIN_ZOOM = 14;
export const KIIT_MAX_ZOOM = 18;

// Demonstration Georeferenced Zone Boundaries around KIIT Campus Sector
export const KIIT_MODELLED_ZONE_GEOS: ModelledZoneGeo[] = [
  {
    zoneId: 'z-gate',
    zoneCode: 'Z1',
    name: 'Main Gate & Welcome Plaza',
    shortName: 'Main Gate',
    center: [20.3510, 85.8162],
    polygon: [
      [20.3518, 85.8152],
      [20.3519, 85.8172],
      [20.3503, 85.8173],
      [20.3502, 85.8153],
    ],
    elevationMeters: 42.0,
  },
  {
    zoneId: 'z-acad',
    zoneCode: 'Z2',
    name: 'Academic Block 3 & Engg Labs',
    shortName: 'Academic Block',
    center: [20.3536, 85.8153],
    polygon: [
      [20.3546, 85.8143],
      [20.3547, 85.8165],
      [20.3527, 85.8166],
      [20.3526, 85.8144],
    ],
    elevationMeters: 44.5,
  },
  {
    zoneId: 'z-sports',
    zoneCode: 'Z3',
    name: 'Sports Complex & Central Stadium',
    shortName: 'Sports Complex',
    center: [20.3564, 85.8202],
    polygon: [
      [20.3575, 85.8188],
      [20.3576, 85.8218],
      [20.3552, 85.8220],
      [20.3551, 85.8190],
    ],
    elevationMeters: 40.2,
  },
  {
    zoneId: 'z-hostel',
    zoneCode: 'Z4',
    name: 'North Residential & Hostel Quad',
    shortName: 'Hostel Quad',
    center: [20.3582, 85.8165],
    polygon: [
      [20.3592, 85.8153],
      [20.3593, 85.8178],
      [20.3571, 85.8179],
      [20.3570, 85.8154],
    ],
    elevationMeters: 46.8,
  },
  {
    zoneId: 'z-lake',
    zoneCode: 'Z5',
    name: 'Eco-Lake & Bio-Retention Catchment',
    shortName: 'Eco-Lake',
    center: [20.3526, 85.8192],
    polygon: [
      [20.3538, 85.8178],
      [20.3539, 85.8208],
      [20.3514, 85.8210],
      [20.3513, 85.8180],
    ],
    elevationMeters: 38.5,
    isCentralDetention: true,
  },
  {
    zoneId: 'z-transit',
    zoneCode: 'Z6',
    name: 'Transit Hub & South Parking Area',
    shortName: 'Transit Hub',
    center: [20.3494, 85.8182],
    polygon: [
      [20.3503, 85.8172],
      [20.3504, 85.8195],
      [20.3485, 85.8196],
      [20.3484, 85.8173],
    ],
    elevationMeters: 39.8,
  },
  {
    zoneId: 'z-innov',
    zoneCode: 'Z7',
    name: 'Innovation Hub & Science Concourse',
    shortName: 'Innovation Hub',
    center: [20.3556, 85.8136],
    polygon: [
      [20.3566, 85.8124],
      [20.3567, 85.8148],
      [20.3546, 85.8149],
      [20.3545, 85.8125],
    ],
    elevationMeters: 45.2,
  },
];

// Modelled Storm Conduits & Flow Vectors (Outputs of hydrological topology model)
export const MODELLED_FLOW_VECTORS: ModelledFlowLine[] = [
  {
    id: 'flow-z4-to-z2',
    fromZoneId: 'z-hostel',
    toZoneId: 'z-acad',
    coordinates: [
      [20.3575, 85.8165],
      [20.3555, 85.8158],
      [20.3540, 85.8155],
    ],
    type: 'surface_vector',
    label: 'MODELLED FLOW: Z4 → Z2 (Elev. Δ 2.3m)',
  },
  {
    id: 'flow-z2-to-z5',
    fromZoneId: 'z-acad',
    toZoneId: 'z-lake',
    coordinates: [
      [20.3535, 85.8155],
      [20.3530, 85.8172],
      [20.3526, 85.8192],
    ],
    type: 'surface_vector',
    label: 'MODELLED FLOW: Z2 → Z5 (Bio-Detention Runoff)',
  },
  {
    id: 'flow-z7-to-z3',
    fromZoneId: 'z-innov',
    toZoneId: 'z-sports',
    coordinates: [
      [20.3556, 85.8136],
      [20.3560, 85.8168],
      [20.3564, 85.8202],
    ],
    type: 'surface_vector',
    label: 'MODELLED FLOW: Z7 → Z3 (Gravity Swale)',
  },
  {
    id: 'flow-z3-to-z5',
    fromZoneId: 'z-sports',
    toZoneId: 'z-lake',
    coordinates: [
      [20.3564, 85.8202],
      [20.3545, 85.8198],
      [20.3526, 85.8192],
    ],
    type: 'surface_vector',
    label: 'MODELLED FLOW: Z3 → Z5 (Peripheral Culvert)',
  },
  {
    id: 'flow-z1-to-z5',
    fromZoneId: 'z-gate',
    toZoneId: 'z-lake',
    coordinates: [
      [20.3510, 85.8162],
      [20.3518, 85.8178],
      [20.3526, 85.8192],
    ],
    type: 'surface_vector',
    label: 'MODELLED FLOW: Z1 → Z5 (Main Plaza Spillway)',
  },
  {
    id: 'flow-z6-to-z5',
    fromZoneId: 'z-transit',
    toZoneId: 'z-lake',
    coordinates: [
      [20.3494, 85.8182],
      [20.3510, 85.8188],
      [20.3526, 85.8192],
    ],
    type: 'surface_vector',
    label: 'MODELLED FLOW: Z6 → Z5 (Transit Infiltration Link)',
  },
];

export const MODELLED_STORM_CONDUITS: ModelledFlowLine[] = [
  {
    id: 'conduit-quad-spine',
    fromZoneId: 'z-hostel',
    toZoneId: 'z-lake',
    coordinates: [
      [20.3582, 85.8165],
      [20.3550, 85.8175],
      [20.3526, 85.8192],
    ],
    type: 'storm_conduit',
    label: 'MODELLED DRAINAGE: North Campus Primary Trunk 900mm',
  },
  {
    id: 'conduit-transit-relief',
    fromZoneId: 'z-transit',
    toZoneId: 'z-lake',
    coordinates: [
      [20.3494, 85.8182],
      [20.3508, 85.8190],
      [20.3526, 85.8192],
    ],
    type: 'storm_conduit',
    label: 'MODELLED DRAINAGE: South Parking Sluice Bypass 600mm',
  },
  {
    id: 'conduit-gate-relief',
    fromZoneId: 'z-gate',
    toZoneId: 'z-lake',
    coordinates: [
      [20.3510, 85.8162],
      [20.3515, 85.8176],
      [20.3526, 85.8192],
    ],
    type: 'storm_conduit',
    label: 'MODELLED DRAINAGE: Main Gate High-Volume Sluice',
  },
];
