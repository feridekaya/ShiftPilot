'use client';

import { useEffect, useState } from 'react';
import { Assignment } from '@/types';
import * as assignmentService from '@/services/assignments';
import Badge from '@/components/ui/Badge';
import Spinner from '@/components/ui/Spinner';

export default function HistoryPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    assignmentService.getAssignments()
      .then(setAssignments)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center mt-20"><Spinner size="lg" /></div>;

  return (
    <div>
      <h1 className="text-xl font-bold mb-6">Görev Geçmişim</h1>
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
            <tr>{['Tarih', 'Görev', 'Bölge', 'Vardiya', 'Durum'].map(h => <th key={h} className="px-4 py-3 text-left">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {assignments.map(a => (
              <tr key={a.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">{a.date}</td>
                <td className="px-4 py-3 font-medium">{a.task.title}</td>
                <td className="px-4 py-3 text-gray-600">{a.zone?.name ?? '-'}</td>
                <td className="px-4 py-3 text-gray-600">{a.shift?.name ?? '-'}</td>
                <td className="px-4 py-3"><Badge status={a.status} /></td>
              </tr>
            ))}
            {assignments.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-gray-400">Henüz görev yok.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
