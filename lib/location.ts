// ============================================================
// PIXMART — Location Engine & Distance Calculation (Haversine)
// ============================================================

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface CityLocationPreset {
  city: string;
  district: string;
  region: string;
  latitude: number;
  longitude: number;
}

// Indonesian location presets for easy seller listing & fallback buyer location
export const INDONESIAN_LOCATIONS: CityLocationPreset[] = [
  {
    city: "Jakarta Selatan",
    district: "Kebayoran Baru",
    region: "DKI Jakarta",
    latitude: -6.2415,
    longitude: 106.7978,
  },
  {
    city: "Jakarta Selatan",
    district: "Blok M / Melawai",
    region: "DKI Jakarta",
    latitude: -6.2443,
    longitude: 106.7992,
  },
  {
    city: "Jakarta Pusat",
    district: "Menteng / Thamrin",
    region: "DKI Jakarta",
    latitude: -6.1925,
    longitude: 106.8239,
  },
  {
    city: "Jakarta Barat",
    district: "Puri Kembangan",
    region: "DKI Jakarta",
    latitude: -6.1878,
    longitude: 106.7354,
  },
  {
    city: "Bandung",
    district: "Coblong / Dago",
    region: "Jawa Barat",
    latitude: -6.8856,
    longitude: 107.6136,
  },
  {
    city: "Bandung",
    district: "Cihampelas",
    region: "Jawa Barat",
    latitude: -6.8974,
    longitude: 107.6047,
  },
  {
    city: "Surabaya",
    district: "Gubeng / Tegalsari",
    region: "Jawa Timur",
    latitude: -7.2654,
    longitude: 112.7521,
  },
  {
    city: "Surabaya",
    district: "Mulyorejo / Timur",
    region: "Jawa Timur",
    latitude: -7.2601,
    longitude: 112.7915,
  },
  {
    city: "Yogyakarta",
    district: "Danurejan / Malioboro",
    region: "DI Yogyakarta",
    latitude: -7.7928,
    longitude: 110.3658,
  },
  {
    city: "Buleleng",
    district: "Gerokgak",
    region: "Bali",
    latitude: -8.1963,
    longitude: 114.7958,
  },
  {
    city: "Denpasar",
    district: "Denpasar Selatan",
    region: "Bali",
    latitude: -8.6705,
    longitude: 115.2126,
  },
  {
    city: "Semarang",
    district: "Semarang Tengah",
    region: "Jawa Tengah",
    latitude: -6.9826,
    longitude: 110.4203,
  },
  {
    city: "Malang",
    district: "Klojen",
    region: "Jawa Timur",
    latitude: -7.9797,
    longitude: 112.6304,
  },
];

/**
 * Calculate distance between two coordinates in kilometers using Haversine formula
 */
export function calculateDistanceKm(
  coord1: Coordinates,
  coord2: Coordinates
): number {
  const R = 6371; // Earth radius in kilometers
  const dLat = toRad(coord2.latitude - coord1.latitude);
  const dLon = toRad(coord2.longitude - coord1.longitude);

  const lat1 = toRad(coord1.latitude);
  const lat2 = toRad(coord2.latitude);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Format distance into human-readable string:
 * - < 1 km: e.g. "800 m"
 * - >= 1 km: e.g. "2.4 km"
 */
export function formatDistance(distanceKm: number | null | undefined): string {
  if (distanceKm === null || distanceKm === undefined || isNaN(distanceKm)) {
    return "Jarak tidak diketahui";
  }
  if (distanceKm < 1) {
    const meters = Math.max(50, Math.round(distanceKm * 1000));
    return `${meters} m`;
  }
  return `${distanceKm.toFixed(1)} km`;
}

/**
 * Helper to fuzz / obscure exact coordinates to ensure privacy.
 * Adds random slight offset (~300-800m) so seller home/exact spot is never disclosed.
 */
export function obscureCoordinates(coords: Coordinates): Coordinates {
  // 0.005 degrees is approx 550 meters
  const latOffset = (Math.random() - 0.5) * 0.008;
  const lngOffset = (Math.random() - 0.5) * 0.008;
  return {
    latitude: Number((coords.latitude + latOffset).toFixed(4)),
    longitude: Number((coords.longitude + lngOffset).toFixed(4)),
  };
}
