// src/pages/AnalyticsPage.tsx

import { useEffect, useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts';
import { fetchAnalytics, fetchHistory } from '../api/client';

interface HistoryRecord {
  id:               number;
  filename:         string;
  final_score:      number;
  cosine_score:     number;
  skill_score:      number;
  experience_score: number | null;
  created_at:       string;
}

interface AnalyticsData {
  total_resumes: number;
  average_score: number;
  highest_score: number;
  lowest_score:  number;
}

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className={`rounded-2xl border p-5 bg-white shadow-sm flex flex-col gap-1 ${color}`}>
      <div className="text-xs font-semibold uppercase tracking-wider text-gray-500">{label}</div>
      <div className="text-4xl font-extrabold text-gray-900">{value}</div>
    </div>
  );
}

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [history,   setHistory]   = useState<HistoryRecord[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState<string | null>(null);

  useEffect(() => {
    Promise.all([fetchAnalytics(), fetchHistory()])
      .then(([a, h]) => { setAnalytics(a); setHistory(h); })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load analytics.'))
      .finally(() => setLoading(false));
  }, []);

  const chartData = history.map((r, i) => ({
    index: i + 1,
    score: parseFloat(r.final_score.toFixed(1)),
    label: r.filename,
    date:  new Date(r.created_at).toLocaleDateString(),
  }));

  return (
    <div className="max-w-5xl mx-auto px-4 py-10 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
        <p className="text-gray-500 mt-1">Aggregate statistics across all your analyses.</p>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-20 text-gray-400">
          <svg className="animate-spin h-6 w-6 mr-3" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          Loading analytics…
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {!loading && !error && analytics && (
        <>
          {analytics.total_resumes === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <div className="text-4xl mb-3">📊</div>
              <p>No data yet. Analyze a resume to see stats here!</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <StatCard label="Total Analyzed" value={String(analytics.total_resumes)} color="border-indigo-100" />
                <StatCard label="Average Score"  value={`${analytics.average_score}%`}   color="border-blue-100"   />
                <StatCard label="Highest Score"  value={`${analytics.highest_score}%`}   color="border-green-100"  />
                <StatCard label="Lowest Score"   value={`${analytics.lowest_score}%`}    color="border-red-100"    />
              </div>

              {chartData.length > 0 && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                  <h2 className="font-semibold text-gray-700 mb-4">Score Trend Over Time</h2>
                  <ResponsiveContainer width="100%" height={280}>
                    <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis
                        dataKey="index"
                        tick={{ fontSize: 11 }}
                        label={{ value: 'Analysis #', position: 'insideBottomRight', offset: -5, fontSize: 11 }}
                      />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" />
                      <Tooltip
                        formatter={(value) => [`${Number(value).toFixed(1)}%`, 'Score']}
                        labelFormatter={(label) => {
                          const item = chartData[Number(label) - 1];
                          return item ? `#${label} · ${item.date} · ${item.label}` : `#${label}`;
                        }}
                      />
                      <ReferenceLine
                        y={analytics.average_score}
                        stroke="#6366f1"
                        strokeDasharray="4 4"
                        label={{ value: 'Avg', position: 'right', fontSize: 10, fill: '#6366f1' }}
                      />
                      <Line
                        type="monotone"
                        dataKey="score"
                        stroke="#6366f1"
                        strokeWidth={2.5}
                        dot={{ r: 4, fill: '#6366f1' }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}