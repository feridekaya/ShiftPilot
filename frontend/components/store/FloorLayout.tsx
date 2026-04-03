'use client';

import ZoneCard, { ZoneEmployee } from './ZoneCard';

export type ZoneData = Record<string, ZoneEmployee[]>;

interface FloorLayoutProps {
  data: ZoneData;
}

const ZONES = [
  { key: 'arka',   label: 'Arka',        accent: 'amber',   area: 'arka'   },
  { key: 'wck',    label: 'Kadın WC',    accent: 'teal',    area: 'wck'    },
  { key: 'wce',    label: 'Erkek WC',    accent: 'slate',   area: 'wce'    },
  { key: 'wconu',  label: 'WC Önü',      accent: 'slate',   area: 'wconu'  },
  { key: 'orta',   label: 'Orta',        accent: 'indigo',  area: 'orta'   },
  { key: 'giris',  label: 'Giriş',       accent: 'emerald', area: 'giris'  },
  { key: 'yan',    label: 'Yan Dükkan',  accent: 'violet',  area: 'yan'    },
  { key: 'kabile', label: 'Kabile Kafa', accent: 'rose',    area: 'kabile' },
  { key: 'sakin',  label: 'Sakin Salon', accent: 'cyan',    area: 'sakin'  },
];

// Desktop floor plan — 5-column grid matching actual restaurant layout
const GRID_AREAS = `
  "arka   arka   arka   arka   arka"
  "orta   orta   yan    wck    wce"
  "orta   orta   yan    wconu  wconu"
  "giris  giris  yan    kabile kabile"
  "giris  giris  yan    sakin  sakin"
`;

export default function FloorLayout({ data }: FloorLayoutProps) {
  return (
    <>
      {/* ── Desktop: real floor plan grid ── */}
      <div
        className="hidden md:grid w-full"
        style={{
          gridTemplateAreas: GRID_AREAS,
          gridTemplateColumns: '1.1fr 1.1fr 0.85fr 1fr 1fr',
          gridAutoRows: 'minmax(72px, auto)',
          gap: '7px',
        }}
      >
        {ZONES.map(z => (
          <ZoneCard
            key={z.key}
            label={z.label}
            employees={data[z.key] ?? []}
            accent={z.accent}
            style={{ gridArea: z.area }}
          />
        ))}
      </div>

      {/* ── Mobile: 2-column responsive grid ── */}
      <div className="md:hidden grid grid-cols-2 gap-2">
        {/* Arka spans full width */}
        <ZoneCard
          label="Arka"
          employees={data['arka'] ?? []}
          accent="amber"
          className="col-span-2"
          compact
        />
        {/* WC pair */}
        <ZoneCard label="Kadın WC"   employees={data['wck']    ?? []} accent="teal"    compact />
        <ZoneCard label="Erkek WC"   employees={data['wce']    ?? []} accent="slate"   compact />
        {/* WC Önü */}
        <ZoneCard label="WC Önü"     employees={data['wconu']  ?? []} accent="slate"   className="col-span-2" compact />
        {/* Main zones */}
        <ZoneCard label="Orta"       employees={data['orta']   ?? []} accent="indigo"  compact />
        <ZoneCard label="Yan Dükkan" employees={data['yan']    ?? []} accent="violet"  compact />
        <ZoneCard label="Giriş"      employees={data['giris']  ?? []} accent="emerald" compact />
        <ZoneCard label="Kabile Kafa"employees={data['kabile'] ?? []} accent="rose"    compact />
        <ZoneCard label="Sakin Salon"employees={data['sakin']  ?? []} accent="cyan"    className="col-span-2" compact />
      </div>
    </>
  );
}
