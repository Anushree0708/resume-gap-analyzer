import { useState, useRef } from 'react';
import { analyzeResume } from '../api/client';
import type { AnalyzeResult } from '../types';

const MAX_FILE_SIZE_MB = 10;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

function ScoreBar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-600">{label}</span>
        <span className="font-semibold">{value.toFixed(1)}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div
          className="bg-indigo-600 h-2.5 rounded-full transition-all duration-700"
          style={{ width: `${Math.min(value, 100)}%` }}
        />
      </div>
    </div>
  );
}

function SkillBadges({
  skills,
  color,
}: {
  skills: string[];
  color: 'green' | 'red';
}) {
  const cls =
    color === 'green'
      ? 'bg-green-100 text-green-800 border border-green-300'
      : 'bg-red-100 text-red-800 border border-red-300';

  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {skills.length === 0 ? (
        <span className="text-gray-400 text-sm">None</span>
      ) : (
        skills.map((s) => (
          <span key={s} className={`text-xs px-2 py-1 rounded-full font-medium ${cls}`}>
            {s}
          </span>
        ))
      )}
    </div>
  );
}

export default function AnalyzePage() {
  const [file, setFile] = useState<File | null>(null);
  const [jd, setJd] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalyzeResult | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0] ?? null;

    if (!selected) return;

    if (!selected.name.toLowerCase().endsWith('.pdf')) {
      setError('Only PDF files are supported.');
      setFile(null);
      e.target.value = '';
      return;
    }

    if (selected.size > MAX_FILE_SIZE_BYTES) {
      setError(`File size must be under ${MAX_FILE_SIZE_MB} MB.`);
      setFile(null);
      e.target.value = '';
      return;
    }

    setError(null);
    setFile(selected);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!file) {
      setError('Please upload a PDF resume.');
      return;
    }

    if (!jd.trim()) {
      setError('Please enter a job description.');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = await analyzeResume(file, jd.trim());
      setResult(data);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Analyze Resume</h1>
        <p className="text-gray-500 mt-1">
          Upload your PDF resume and paste the job description to see your match score.
        </p>
      </div>

      {result && (
        <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 space-y-6">
          <div className="text-center">
            <div className="text-6xl font-extrabold text-indigo-600">
              {result.final_match_score.toFixed(1)}%
            </div>
            <div className="text-gray-500 mt-1 text-sm font-medium uppercase tracking-wider">
              Overall Match Score
            </div>
          </div>

          <div className="space-y-3">
            <ScoreBar label="Skill Match Score" value={result.skill_match_score} />
            <ScoreBar label="Cosine Similarity Score" value={result.cosine_similarity_score} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold text-gray-700">✅ Matching Skills</h3>
              <SkillBadges skills={result.matched_skills} color="green" />
            </div>

            <div>
              <h3 className="font-semibold text-gray-700">❌ Missing Skills</h3>
              <SkillBadges skills={result.missing_skills} color="red" />
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 space-y-6">

        {/* FILE UPLOAD */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Resume (PDF, max {MAX_FILE_SIZE_MB} MB)
          </label>

          <div
            className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center cursor-pointer hover:border-indigo-400"
            onClick={() => fileInputRef.current?.click()}
          >

            {/* Hidden real input */}
            <input
              ref={fileInputRef}
              id="resume-file"
              type="file"
              accept=".pdf,application/pdf"
              onChange={handleFileChange}
              className="hidden"
            />

            {file ? (
              <div>
                <div className="text-indigo-600 font-medium">📎 {file.name}</div>
                <div className="text-gray-400 text-xs">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </div>
              </div>
            ) : (
              <div>
                <div className="text-gray-400 text-2xl">📄</div>
                <div className="text-gray-500 text-sm">
                  Click to upload or drag & drop
                </div>
                <div className="text-gray-400 text-xs">
                  PDF only · Max {MAX_FILE_SIZE_MB} MB
                </div>
              </div>
            )}
          </div>
        </div>

        {/* JOB DESCRIPTION */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Job Description
          </label>

          <textarea
            value={jd}
            onChange={(e) => setJd(e.target.value)}
            rows={8}
            placeholder="Paste the full job description here..."
            className="w-full rounded-xl border border-gray-300 px-4 py-3"
          />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl"
        >
          {loading ? "Analyzing..." : "Analyze"}
        </button>
      </form>
    </div>
  );
}