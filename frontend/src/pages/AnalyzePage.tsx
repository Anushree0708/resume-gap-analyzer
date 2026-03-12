import { useState, useRef } from "react";
import { analyzeResume } from "../api/client";
import type { AnalyzeResult } from "../types";

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

function SkillBadges({ skills, color }: { skills: string[]; color: "green" | "red" }) {
  const cls =
    color === "green"
      ? "bg-green-100 text-green-800 border border-green-300"
      : "bg-red-100 text-red-800 border border-red-300";

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
  const [file, setFile]       = useState<File | null>(null);
  const [jd, setJd]           = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const [result, setResult]   = useState<AnalyzeResult | null>(null);
  const fileInputRef          = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0] ?? null;
    if (!selected) return;

    if (!selected.name.toLowerCase().endsWith(".pdf")) {
      setError("Only PDF files are supported.");
      setFile(null);
      return;
    }
    if (selected.size > MAX_FILE_SIZE_BYTES) {
      setError(`File size must be under ${MAX_FILE_SIZE_MB} MB.`);
      setFile(null);
      return;
    }
    setError(null);
    setFile(selected);
  }

  async function handleSubmit() {
    if (!file)       { setError("Please upload a PDF resume."); return; }
    if (!jd.trim())  { setError("Please enter a job description."); return; }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = await analyzeResume(file, jd.trim());
      setResult(data);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 space-y-8">

      <div>
        <h1 className="text-3xl font-bold text-gray-900">Analyze Resume</h1>
        <p className="text-gray-500 mt-1">Upload your PDF resume and paste the job description.</p>
      </div>

      {/* Results card */}
      {result && (
        <div className="bg-white rounded-2xl shadow-md border p-6 space-y-6">

          {/* Overall score */}
          <div className="text-center">
            <div className="text-6xl font-extrabold text-indigo-600">
              {result.final_match_score.toFixed(1)}%
            </div>
            <div className="text-gray-500 text-sm">Overall Match Score</div>
          </div>

          {/* Score breakdown bars */}
          <div className="space-y-4">
            <ScoreBar label="Skill Match"          value={result.skill_match_score} />
            <ScoreBar label="Cosine Similarity"    value={result.cosine_similarity_score} />
            <ScoreBar label="Experience Match"     value={result.experience_score} />   {/* NEW */}
          </div>

          {/* Experience note */}
          {result.experience_note && (
            <div className="bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-3 text-sm text-indigo-800">
              <span className="font-semibold">Experience: </span>{result.experience_note}
            </div>
          )}

          {/* Skills */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold">✅ Matching Skills</h3>
              <SkillBadges skills={result.matched_skills} color="green" />
            </div>
            <div>
              <h3 className="font-semibold">❌ Missing Skills</h3>
              <SkillBadges skills={result.missing_skills} color="red" />
            </div>
          </div>

        </div>
      )}

      {/* Upload form */}
      <div className="bg-white rounded-2xl shadow-md border p-6 space-y-6">

        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          onChange={handleFileChange}
          className="hidden"
        />

        <div
          className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center cursor-pointer hover:border-indigo-400"
          onClick={() => fileInputRef.current?.click()}
        >
          {file ? (
            <div>
              <div className="text-indigo-600 font-medium">📎 {file.name}</div>
              <div className="text-gray-400 text-xs">{(file.size / 1024 / 1024).toFixed(2)} MB</div>
            </div>
          ) : (
            <div>
              <div className="text-gray-400 text-2xl">📄</div>
              <div className="text-gray-500 text-sm">Click to upload PDF</div>
            </div>
          )}
        </div>

        <textarea
          value={jd}
          onChange={(e) => setJd(e.target.value)}
          rows={8}
          placeholder="Paste job description here..."
          className="w-full rounded-xl border border-gray-300 px-4 py-3"
        />

        {error && <div className="text-red-600 text-sm">{error}</div>}

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-semibold py-3 rounded-xl"
        >
          {loading ? "Analyzing..." : "Analyze"}
        </button>

      </div>
    </div>
  );
}
