const rad = (deg: number) => (deg * Math.PI) / 180;
const deg = (radians: number) => (radians * 180) / Math.PI;

export type SunTimes = { sunrise: Date; sunset: Date };

/**
 * Amanecer y puesta de sol del día local de `date` (algoritmo de la NOAA, ±2 min).
 * Devuelve null en latitudes donde ese día el sol no sale o no se pone.
 */
export function sunTimes(date: Date, latitude: number, longitude: number): SunTimes | null {
  const y = date.getFullYear();
  const m = date.getMonth();
  const d = date.getDate();
  const dayOfYear = Math.round((Date.UTC(y, m, d) - Date.UTC(y, 0, 1)) / 86_400_000) + 1;
  const g = ((2 * Math.PI) / 365) * (dayOfYear - 1);

  const eqTime =
    229.18 *
    (0.000075 + 0.001868 * Math.cos(g) - 0.032077 * Math.sin(g) - 0.014615 * Math.cos(2 * g) - 0.040849 * Math.sin(2 * g));
  const decl =
    0.006918 -
    0.399912 * Math.cos(g) +
    0.070257 * Math.sin(g) -
    0.006758 * Math.cos(2 * g) +
    0.000907 * Math.sin(2 * g) -
    0.002697 * Math.cos(3 * g) +
    0.00148 * Math.sin(3 * g);

  const cosHourAngle =
    Math.cos(rad(90.833)) / (Math.cos(rad(latitude)) * Math.cos(decl)) - Math.tan(rad(latitude)) * Math.tan(decl);
  if (cosHourAngle < -1 || cosHourAngle > 1) return null;

  const hourAngle = deg(Math.acos(cosHourAngle));
  const solarNoon = 720 - 4 * longitude - eqTime; // minutos desde las 00:00 UTC
  const at = (minutes: number) => new Date(Date.UTC(y, m, d) + minutes * 60_000);
  return { sunrise: at(solarNoon - 4 * hourAngle), sunset: at(solarNoon + 4 * hourAngle) };
}
