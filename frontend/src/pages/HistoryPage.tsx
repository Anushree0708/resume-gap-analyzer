import { useEffect, useState } from 'react';
import { fetchHistory } from '../api/client';
import type { HistoryRecord } from '../types';

function formatDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

function ScorePill({ value }: { value: number }) {
  const color =
    value >= 70 ? 'bg-green-100 text-green-800' :
    value >= 40 ? 'bg-yellow-100 text-yellow-800' :
    'bg-red-100 text-red-800';
  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${color}`}>
      {value.toFixed(1)}%
    </span>
  );
}

export default function HistoryPage() {
  const [records, setRecords] = useState<HistoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  useEffect(() => {
    fetchHistory()
      .then((data) => setRecords([...data].reverse()))
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load history.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-4 py-10 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Analysis History</h1>
        <p className="text-gray-500 mt-1">Your past resume analyses, newest first.</p>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-20 text-gray-400">
          <svg className="animate-spin h-6 w-6 mr-3" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          Loading history…
        </div>
      )}

      {error && (
        <div role="alert" className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {!loading && !error && records.length === 0 && (
        <div className="text-center py-20 text-gray-400">
          <div className="text-4xl mb-3">📭</div>
          <p>No analyses yet. Go to the <strong>Analyze</strong> tab to get started!</p>
        </div>
      )}

      {!loading && records.length > 0 && (
        <div className="overflow-x-auto rounded-2xl border border-gray-200 shadow-sm">
          <table className="min-w-full divide-y divide-gray-100 bg-white">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3 text-left">#</th>
                <th className="px-4 py-3 text-left">Filename</th>
                <th className="px-4 py-3 text-left">Overall</th>
                <th className="px-4 py-3 text-left">Skills</th>
                <th className="px-4 py-3 text-left">Experience</th>  {/* NEW */}
                <th className="px-4 py-3 text-left">Cosine</th>
                <th className="px-4 py-3 text-left">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-sm text-gray-800">
              {records.map((r, idx) => (
                <tr key={r.id} className="hover:bg-indigo-50 transition-colors">
                  <td className="px-4 py-3 text-gray-400">{records.length - idx}</td>
                  <td className="px-4 py-3 font-medium">{r.filename}</td>
                  <td className="px-4 py-3"><ScorePill value={r.final_score} /></td>
                  <td className="px-4 py-3 text-gray-500">{r.skill_score.toFixed(1)}%</td>
                  <td className="px-4 py-3 text-gray-500">   {/* NEW */}
                    {r.experience_score != null ? `${r.experience_score.toFixed(1)}%` : '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-500">{r.cosine_score.toFixed(1)}%</td>
                  <td className="px-4 py-3 text-gray-400 whitespace-nowrap">{formatDate(r.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
