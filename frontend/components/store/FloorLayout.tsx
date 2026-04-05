'use client';

import ZoneCard, { ZoneEmployee } from './ZoneCard';
import { Zone } from '@/types';

export type ZoneData = Record<number, ZoneEmployee[]>; // zone.id → employees

interface FloorLayoutProps {
  zones: Zone[];
  data: ZoneData;
}

const ACCENTS = ['amber', 'indigo', 'emerald', 'violet', 'rose', 'cyan', 'teal', 'orange', 'slate'];

export default function FloorLayout({ zones, data }: FloorLayoutProps) {
  if (zones.length === 0) {
    return (
      <p className="text-center text-slate-600 py-10 text-sm">
        Henüz bölge eklenmemiş.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
      {zones.map((z, i) => (
        <ZoneCard
          key={z.id}
          label={z.name}
          employees={data[z.id] ?? []}
          accent={ACCENTS[i % ACCENTS.length]}
        />
      ))}
    </div>
  );
}
