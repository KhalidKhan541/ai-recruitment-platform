import { useState } from "react";

export interface ResumeData {
  candidateId: string;
  candidateName: string;
  filePath: string;
  fileName: string;
  uploadedAt: string;
  parsedData?: {
    summary?: string;
    experience: {
      company: string;
      title: string;
      startDate: string;
      endDate: string;
      description: string;
      highlights: string[];
    }[];
    education: {
      institution: string;
      degree: string;
      field: string;
      graduationYear: number;
    }[];
    skills: { name: string; proficiency: "beginner" | "intermediate" | "advanced" | "expert"; years?: number }[];
    certifications: { name: string; issuer: string; date: string }[];
    languages: { name: string; proficiency: string }[];
  };
  aiAnalysis?: {
    overallScore: number;
    strengths: string[];
    weaknesses: string[];
    recommendations: string[];
    keywordMatches: { keyword: string; found: boolean; context?: string }[];
    experienceRelevance: number;
    skillsMatch: number;
    educationMatch: number;
  };
  atsScore?: number;
}

interface ResumeViewerProps {
  resume: ResumeData;
  onClose?: () => void;
  onDownload?: () => void;
  onEmail?: () => void;
  jobRequirements?: string[];
}

export function ResumeViewer({
  resume,
  onClose,
  onDownload,
  onEmail,
  jobRequirements = [],
}: ResumeViewerProps) {
  const [activeTab, setActiveTab] = useState<"preview" | "analysis" | "keywords">("preview");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const tabs = [
    { key: "preview" as const, label: "Resume", icon: "📄" },
    { key: "analysis" as const, label: "AI Analysis", icon: "🤖" },
    { key: "keywords" as const, label: "Keywords", icon: "🔍" },
  ];

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-emerald-600";
    if (score >= 60) return "text-amber-600";
    return "text-red-600";
  };

  const getProficiencyColor = (prof: string) => {
    const colors: Record<string, string> = {
      beginner: "bg-gray-200 text-gray-600",
      intermediate: "bg-blue-100 text-blue-700",
      advanced: "bg-indigo-100 text-indigo-700",
      expert: "bg-purple-100 text-purple-700",
    };
    return colors[prof] || "bg-gray-100 text-gray-600";
  };

  const exp = resume.parsedData?.experience || [];
  const edu = resume.parsedData?.education || [];
  const skills = resume.parsedData?.skills || [];
  const certs = resume.parsedData?.certifications || [];
  const langs = resume.parsedData?.languages || [];
  const analysis = resume.aiAnalysis;

  return (
    <div className="flex h-full bg-gray-50 rounded-2xl border border-gray-200 overflow-hidden">
      <div
        className={`flex-1 flex flex-col transition-all ${
          sidebarOpen ? "mr-0" : ""
        }`}
      >
        <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">
              {resume.candidateName
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()
                .slice(0, 2)}
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                {resume.candidateName}
              </h2>
              <p className="text-xs text-gray-500">
                {resume.fileName} · Uploaded{" "}
                {new Date(resume.uploadedAt).toLocaleDateString()}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
              </svg>
            </button>
            <button
              onClick={onDownload}
              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </button>
            <button
              onClick={onEmail}
              className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex border-b border-gray-200 bg-white">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === "preview" && (
            <div className="max-w-3xl mx-auto space-y-8">
              {resume.parsedData?.summary && (
                <section>
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <span className="w-6 h-6 rounded bg-blue-100 flex items-center justify-center text-xs">📝</span>
                    Summary
                  </h3>
                  <p className="text-gray-700 leading-relaxed text-sm">
                    {resume.parsedData.summary}
                  </p>
                </section>
              )}

              {exp.length > 0 && (
                <section>
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <span className="w-6 h-6 rounded bg-purple-100 flex items-center justify-center text-xs">💼</span>
                    Experience
                  </h3>
                  <div className="space-y-5">
                    {exp.map((item, i) => (
                      <div key={i} className="relative pl-6 border-l-2 border-gray-200">
                        <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-white border-2 border-purple-400" />
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-semibold text-gray-900 text-sm">
                              {item.title}
                            </h4>
                            <p className="text-xs text-gray-500">
                              {item.company}
                            </p>
                          </div>
                          <span className="text-xs text-gray-400 whitespace-nowrap">
                            {item.startDate} – {item.endDate}
                          </span>
                        </div>
                        <p className="mt-2 text-sm text-gray-600">
                          {item.description}
                        </p>
                        {item.highlights.length > 0 && (
                          <ul className="mt-2 space-y-1">
                            {item.highlights.map((h, j) => (
                              <li
                                key={j}
                                className="text-sm text-gray-600 flex items-start gap-2"
                              >
                                <span className="text-blue-500 mt-0.5">▸</span>
                                {h}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {edu.length > 0 && (
                <section>
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <span className="w-6 h-6 rounded bg-green-100 flex items-center justify-center text-xs">🎓</span>
                    Education
                  </h3>
                  <div className="space-y-3">
                    {edu.map((item, i) => (
                      <div
                        key={i}
                        className="p-3 bg-white rounded-xl border border-gray-200"
                      >
                        <h4 className="font-semibold text-gray-900 text-sm">
                          {item.degree} in {item.field}
                        </h4>
                        <p className="text-xs text-gray-500">
                          {item.institution} · {item.graduationYear}
                        </p>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {skills.length > 0 && (
                <section>
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <span className="w-6 h-6 rounded bg-orange-100 flex items-center justify-center text-xs">⚡</span>
                    Skills
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {skills.map((skill, i) => (
                      <span
                        key={i}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium ${getProficiencyColor(
                          skill.proficiency
                        )}`}
                      >
                        {skill.name}
                        {skill.years && (
                          <span className="ml-1 opacity-60">
                            · {skill.years}y
                          </span>
                        )}
                      </span>
                    ))}
                  </div>
                </section>
              )}

              {certs.length > 0 && (
                <section>
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <span className="w-6 h-6 rounded bg-cyan-100 flex items-center justify-center text-xs">🏆</span>
                    Certifications
                  </h3>
                  <div className="space-y-2">
                    {certs.map((cert, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between p-3 bg-white rounded-xl border border-gray-200"
                      >
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {cert.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {cert.issuer}
                          </p>
                        </div>
                        <span className="text-xs text-gray-400">
                          {cert.date}
                        </span>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}

          {activeTab === "analysis" && analysis && (
            <div className="max-w-3xl mx-auto space-y-6">
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-white rounded-xl border border-gray-200 text-center">
                  <p className="text-xs text-gray-500 uppercase tracking-wider">
                    Overall
                  </p>
                  <p
                    className={`text-3xl font-bold mt-1 ${getScoreColor(
                      analysis.overallScore
                    )}`}
                  >
                    {analysis.overallScore}
                  </p>
                </div>
                <div className="p-4 bg-white rounded-xl border border-gray-200 text-center">
                  <p className="text-xs text-gray-500 uppercase tracking-wider">
                    Experience
                  </p>
                  <p
                    className={`text-3xl font-bold mt-1 ${getScoreColor(
                      analysis.experienceRelevance
                    )}`}
                  >
                    {analysis.experienceRelevance}
                  </p>
                </div>
                <div className="p-4 bg-white rounded-xl border border-gray-200 text-center">
                  <p className="text-xs text-gray-500 uppercase tracking-wider">
                    Skills Match
                  </p>
                  <p
                    className={`text-3xl font-bold mt-1 ${getScoreColor(
                      analysis.skillsMatch
                    )}`}
                  >
                    {analysis.skillsMatch}
                  </p>
                </div>
              </div>

              {analysis.strengths.length > 0 && (
                <div className="p-5 bg-emerald-50 rounded-xl border border-emerald-200">
                  <h4 className="text-sm font-bold text-emerald-800 mb-3 flex items-center gap-2">
                    <span>✅</span> Strengths
                  </h4>
                  <ul className="space-y-2">
                    {analysis.strengths.map((s, i) => (
                      <li
                        key={i}
                        className="text-sm text-emerald-700 flex items-start gap-2"
                      >
                        <span className="text-emerald-500 mt-0.5">•</span>
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {analysis.weaknesses.length > 0 && (
                <div className="p-5 bg-red-50 rounded-xl border border-red-200">
                  <h4 className="text-sm font-bold text-red-800 mb-3 flex items-center gap-2">
                    <span>⚠️</span> Areas for Improvement
                  </h4>
                  <ul className="space-y-2">
                    {analysis.weaknesses.map((w, i) => (
                      <li
                        key={i}
                        className="text-sm text-red-700 flex items-start gap-2"
                      >
                        <span className="text-red-500 mt-0.5">•</span>
                        {w}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {analysis.recommendations.length > 0 && (
                <div className="p-5 bg-blue-50 rounded-xl border border-blue-200">
                  <h4 className="text-sm font-bold text-blue-800 mb-3 flex items-center gap-2">
                    <span>💡</span> Recommendations
                  </h4>
                  <ul className="space-y-2">
                    {analysis.recommendations.map((r, i) => (
                      <li
                        key={i}
                        className="text-sm text-blue-700 flex items-start gap-2"
                      >
                        <span className="text-blue-500 mt-0.5">•</span>
                        {r}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {activeTab === "keywords" && analysis && (
            <div className="max-w-3xl mx-auto space-y-4">
              <div className="p-4 bg-white rounded-xl border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-bold text-gray-900">
                    Keyword Matching
                  </h4>
                  <span className="text-xs text-gray-500">
                    {analysis.keywordMatches.filter((k) => k.found).length}/
                    {analysis.keywordMatches.length} found
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {analysis.keywordMatches.map((kw, i) => (
                    <span
                      key={i}
                      className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium ${
                        kw.found
                          ? "bg-emerald-100 text-emerald-700 border border-emerald-300"
                          : "bg-red-50 text-red-600 border border-red-200"
                      }`}
                    >
                      {kw.found ? "✓" : "✗"} {kw.keyword}
                    </span>
                  ))}
                </div>
              </div>

              {jobRequirements.length > 0 && (
                <div className="p-4 bg-white rounded-xl border border-gray-200">
                  <h4 className="text-sm font-bold text-gray-900 mb-3">
                    Job Requirements Coverage
                  </h4>
                  <div className="space-y-3">
                    {jobRequirements.map((req, i) => {
                      const matched = analysis.keywordMatches.some(
                        (kw) =>
                          kw.found &&
                          kw.keyword.toLowerCase().includes(req.toLowerCase())
                      );
                      return (
                        <div
                          key={i}
                          className="flex items-start gap-3 p-3 rounded-lg bg-gray-50"
                        >
                          <span
                            className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center text-xs ${
                              matched
                                ? "bg-emerald-100 text-emerald-600"
                                : "bg-red-100 text-red-600"
                            }`}
                          >
                            {matched ? "✓" : "✗"}
                          </span>
                          <span className="text-sm text-gray-700">{req}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {sidebarOpen && (
        <div className="w-80 bg-white border-l border-gray-200 overflow-y-auto">
          <div className="p-5 space-y-5">
            <div>
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                Quick Stats
              </h4>
              <div className="space-y-2">
                {resume.atsScore !== undefined && (
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <span className="text-sm text-gray-600">ATS Score</span>
                    <span
                      className={`text-lg font-bold ${getScoreColor(
                        resume.atsScore
                      )}`}
                    >
                      {resume.atsScore}
                    </span>
                  </div>
                )}
                {analysis && (
                  <>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                      <span className="text-sm text-gray-600">AI Score</span>
                      <span
                        className={`text-lg font-bold ${getScoreColor(
                          analysis.overallScore
                        )}`}
                      >
                        {analysis.overallScore}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                      <span className="text-sm text-gray-600">
                        Experience Relevance
                      </span>
                      <span
                        className={`text-lg font-bold ${getScoreColor(
                          analysis.experienceRelevance
                        )}`}
                      >
                        {analysis.experienceRelevance}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {skills.length > 0 && (
              <div>
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                  Top Skills
                </h4>
                <div className="space-y-2">
                  {skills.slice(0, 8).map((skill, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between"
                    >
                      <span className="text-sm text-gray-700">
                        {skill.name}
                      </span>
                      <div className="w-20 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full"
                          style={{
                            width: `${
                              skill.proficiency === "expert"
                                ? 100
                                : skill.proficiency === "advanced"
                                ? 75
                                : skill.proficiency === "intermediate"
                                ? 50
                                : 25
                            }%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {langs.length > 0 && (
              <div>
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                  Languages
                </h4>
                <div className="space-y-1.5">
                  {langs.map((lang, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="text-gray-700">{lang.name}</span>
                      <span className="text-gray-400 text-xs">
                        {lang.proficiency}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default ResumeViewer;
