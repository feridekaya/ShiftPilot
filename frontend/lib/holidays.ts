export interface Holiday {
  date: string;   // YYYY-MM-DD
  name: string;
  type: 'national' | 'religious' | 'arife';
}

// Sabit millî ve resmî tatiller (her yıl aynı gün)
function fixedHolidays(year: number): Holiday[] {
  return [
    { date: `${year}-01-01`, name: 'Yılbaşı',                                    type: 'national' },
    { date: `${year}-04-23`, name: 'Ulusal Egemenlik ve Çocuk Bayramı',           type: 'national' },
    { date: `${year}-05-01`, name: 'Emek ve Dayanışma Günü',                      type: 'national' },
    { date: `${year}-05-19`, name: "Atatürk'ü Anma, Gençlik ve Spor Bayramı",    type: 'national' },
    { date: `${year}-07-15`, name: 'Demokrasi ve Millî Birlik Günü',              type: 'national' },
    { date: `${year}-08-30`, name: 'Zafer Bayramı',                               type: 'national' },
    { date: `${year}-10-29`, name: 'Cumhuriyet Bayramı',                          type: 'national' },
  ];
}

// Dini tatiller yıl bazında (Hicri takvime göre değişir)
const RELIGIOUS_HOLIDAYS: Holiday[] = [
  // 2025
  { date: '2025-03-29', name: 'Ramazan Bayramı Arifesi', type: 'arife' },
  { date: '2025-03-30', name: 'Ramazan Bayramı 1. Gün',  type: 'religious' },
  { date: '2025-03-31', name: 'Ramazan Bayramı 2. Gün',  type: 'religious' },
  { date: '2025-04-01', name: 'Ramazan Bayramı 3. Gün',  type: 'religious' },
  { date: '2025-06-05', name: 'Kurban Bayramı Arifesi',  type: 'arife' },
  { date: '2025-06-06', name: 'Kurban Bayramı 1. Gün',   type: 'religious' },
  { date: '2025-06-07', name: 'Kurban Bayramı 2. Gün',   type: 'religious' },
  { date: '2025-06-08', name: 'Kurban Bayramı 3. Gün',   type: 'religious' },
  { date: '2025-06-09', name: 'Kurban Bayramı 4. Gün',   type: 'religious' },

  // 2026
  { date: '2026-03-19', name: 'Ramazan Bayramı Arifesi', type: 'arife' },
  { date: '2026-03-20', name: 'Ramazan Bayramı 1. Gün',  type: 'religious' },
  { date: '2026-03-21', name: 'Ramazan Bayramı 2. Gün',  type: 'religious' },
  { date: '2026-03-22', name: 'Ramazan Bayramı 3. Gün',  type: 'religious' },
  { date: '2026-05-26', name: 'Kurban Bayramı Arifesi',  type: 'arife' },
  { date: '2026-05-27', name: 'Kurban Bayramı 1. Gün',   type: 'religious' },
  { date: '2026-05-28', name: 'Kurban Bayramı 2. Gün',   type: 'religious' },
  { date: '2026-05-29', name: 'Kurban Bayramı 3. Gün',   type: 'religious' },
  { date: '2026-05-30', name: 'Kurban Bayramı 4. Gün',   type: 'religious' },

  // 2027
  { date: '2027-03-08', name: 'Ramazan Bayramı Arifesi', type: 'arife' },
  { date: '2027-03-09', name: 'Ramazan Bayramı 1. Gün',  type: 'religious' },
  { date: '2027-03-10', name: 'Ramazan Bayramı 2. Gün',  type: 'religious' },
  { date: '2027-03-11', name: 'Ramazan Bayramı 3. Gün',  type: 'religious' },
  { date: '2027-05-15', name: 'Kurban Bayramı Arifesi',  type: 'arife' },
  { date: '2027-05-16', name: 'Kurban Bayramı 1. Gün',   type: 'religious' },
  { date: '2027-05-17', name: 'Kurban Bayramı 2. Gün',   type: 'religious' },
  { date: '2027-05-18', name: 'Kurban Bayramı 3. Gün',   type: 'religious' },
  { date: '2027-05-19', name: 'Kurban Bayramı 4. Gün',   type: 'religious' },
];

// Tüm yıllar için tatil listesi
function buildHolidayMap(): Map<string, Holiday> {
  const map = new Map<string, Holiday>();
  for (const year of [2025, 2026, 2027]) {
    for (const h of fixedHolidays(year)) map.set(h.date, h);
  }
  for (const h of RELIGIOUS_HOLIDAYS) map.set(h.date, h);
  return map;
}

const HOLIDAY_MAP = buildHolidayMap();

export function getHoliday(dateStr: string): Holiday | null {
  return HOLIDAY_MAP.get(dateStr) ?? null;
}

export function isHoliday(dateStr: string): boolean {
  return HOLIDAY_MAP.has(dateStr);
}
