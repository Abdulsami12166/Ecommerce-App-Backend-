// Simple geo helpers used for UI preview calculations.

const toRad = deg => (deg * Math.PI) / 180;
const toDeg = rad => (rad * 180) / Math.PI;

// Returns destination coordinate given a start, distance in meters and bearing in degrees.
// Bearing: 0 = North, 90 = East, 180 = South, 270 = West.
export const destinationPoint = ({ latitude, longitude }, distanceMeters, bearingDegrees) => {
  const R = 6371000; // earth radius in meters

  const φ1 = toRad(latitude);
  const λ1 = toRad(longitude);
  const θ = toRad(bearingDegrees);

  const δ = distanceMeters / R;

  const sinφ1 = Math.sin(φ1);
  const cosφ1 = Math.cos(φ1);
  const sinδ = Math.sin(δ);
  const cosδ = Math.cos(δ);

  const φ2 = Math.asin(sinφ1 * cosδ + cosφ1 * sinδ * Math.cos(θ));
  const λ2 = λ1 + Math.atan2(Math.sin(θ) * sinδ * cosφ1, cosδ - sinφ1 * Math.sin(φ2));

  return {
    latitude: toDeg(φ2),
    longitude: toDeg(λ2),
  };
};

