// คำนวณระยะทางระหว่างพิกัด GPS 2 จุด (คืนค่าเป็นเมตร) ด้วย Haversine Formula
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // รัศมีของโลก (เมตร)
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) *
      Math.cos(phi2) *
      Math.sin(deltaLambda / 2) *
      Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

// ฟอร์แมตระยะทางให้อ่านง่าย เช่น "85 ม." หรือ "1.4 กม."
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${meters} ม.`;
  }
  return `${(meters / 1000).toFixed(1)} กม.`;
}

// คำนวณ XP ที่ต้องใช้เพื่อเลเวลอัปถัดไป (Level Scaling Formula)
export function getRequiredXpForLevel(level: number): number {
  return Math.round(100 * Math.pow(1.35, level - 1));
}
