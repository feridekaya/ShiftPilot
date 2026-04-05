/**
 * İş günü tarihi hesaplama.
 *
 * Kural: Eğer yerel saat cutoffHour'dan küçükse (örn. 04:00),
 * o işlem bir önceki takvim gününe ait sayılır.
 *
 * Örnek (cutoff=4):
 *   03 Nisan 01:30 → "2026-04-02"  (hâlâ 2 Nisan iş günü)
 *   03 Nisan 04:00 → "2026-04-03"  (yeni iş günü başladı)
 */
export function getBusinessDate(cutoffHour = 4): string {
  const now = new Date();
  if (now.getHours() < cutoffHour) {
    const prev = new Date(now);
    prev.setDate(prev.getDate() - 1);
    return prev.toLocaleDateString('en-CA'); // YYYY-MM-DD
  }
  return now.toLocaleDateString('en-CA');
}
