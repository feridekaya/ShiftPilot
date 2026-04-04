'use client';

import ZoneCard, { ZoneEmployee } from './ZoneCard';

export type ZoneData = Record<string, ZoneEmployee[]>;
// gridKey → DB'deki zone adı (örn. 'arka' → 'Arka', 'barrun' → 'Bar Run')
export type ActiveZones = Record<string, string>;

interface FloorLayoutProps {
  data: ZoneData;
  activeZones: ActiveZones;
}

// 8-row × 6-col grid
const GRID_AREAS = `
  "arka    arka    arka    arka   arka    arka"
  "arka    arka    arka    arka   arka    arka"
  "orta    orta    barrun  yan    wck     wce"
  "orta    orta    barrun  yan    wconu   wconu"
  "giris   giris   mutrun  yan    kabile  kabile"
  "giris   giris   mutrun  yan    kabile  kabile"
  "giris   giris   mutrun  yan    sakin   sakin"
  "giris   giris   mutrun  yan    sakin   sakin"
`;

const ZONE_ACCENTS: Record<string, string> = {
  arka:    'amber',
  wck:     'teal',
  wce:     'slate',
  wconu:   'slate',
  orta:    'indigo',
  giris:   'emerald',
  barrun:  'orange',
  mutrun:  'amber',
  yan:     'violet',
  kabile:  'rose',
  sakin:   'cyan',
};

// All possible grid keys in layout order (for mobile)
const ALL_KEYS = ['arka', 'wck', 'wce', 'wconu', 'orta', 'barrun', 'mutrun', 'yan', 'giris', 'kabile', 'sakin'];

export default function FloorLayout({ data, activeZones }: FloorLayoutProps) {
  // Only keys that exist in both the grid and the DB zones
  const activeKeys = new Set(Object.keys(activeZones));

  // Build CSS grid-template-areas replacing inactive zones with a dot (.)
  // We need every cell covered — inactive zones become empty (we render nothing, grid area still exists)
  // Actually easier: always render all grid areas but hide inactive ones visually
  // Approach: render all, but skip rendering card if not in activeZones

  return (
    <>
      {/* ── Desktop: real floor plan grid ── */}
      <div
        className="hidden md:grid w-full"
        style={{
          gridTemplateAreas: GRID_AREAS,
          gridTemplateColumns: '1.1fr 1.1fr 0.75fr 0.85fr 1fr 1fr',
          gridAutoRows: 'minmax(68px, auto)',
          gap: '8px',
        }}
      >
        {ALL_KEYS.map(key => {
          if (!activeKeys.has(key)) {
            // Render invisible placeholder to keep grid intact
            return (
              <div
                key={key}
                style={{ gridArea: key }}
                className="rounded-xl border border-slate-800/30 bg-slate-900/20"
              />
            );
          }
          return (
            <ZoneCard
              key={key}
              label={activeZones[key]}
              employees={data[key] ?? []}
              accent={ZONE_ACCENTS[key] ?? 'slate'}
              style={{ gridArea: key }}
            />
          );
        })}
      </div>

      {/* ── Mobile: 2-column responsive grid ── */}
      <div className="md:hidden grid grid-cols-2 gap-2">
        {ALL_KEYS.filter(k => activeKeys.has(k)).map(key => {
          const isFullWidth = key === 'arka' || key === 'wconu' || key === 'giris';
          return (
            <ZoneCard
              key={key}
              label={activeZones[key]}
              employees={data[key] ?? []}
              accent={ZONE_ACCENTS[key] ?? 'slate'}
              className={isFullWidth ? 'col-span-2' : ''}
              compact={key !== 'arka' && key !== 'giris'}
            />
          );
        })}
      </div>
    </>
  );
}
