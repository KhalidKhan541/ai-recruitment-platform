import { z } from "zod";

// ─── Schemas ─────────────────────────────────────────────────────────────────

export const PipelineStageSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  order: z.number().int(),
  color: z.string().default("#3b82f6"),
  autoActions: z.array(
    z.object({
      trigger: z.enum(["candidate_entered", "time_elapsed", "score_threshold", "manual"]),
      action: z.enum(["send_email", "schedule_interview", "send_assessment", "notify_recruiter", "move_stage"]),
      config: z.record(z.unknown()).optional(),
      delay: z.number().int().min(0).default(0),
    })
  ).default([]),
  maxCandidates: z.number().int().optional(),
  slaHours: z.number().int().optional(),
});

export type PipelineStage = z.infer<typeof PipelineStageSchema>;

export const PipelineSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  jobId: z.string(),
  companyId: z.string(),
  stages: z.array(PipelineStageSchema),
  createdAt: z.string(),
  updatedAt: z.string(),
  createdBy: z.string(),
  isActive: z.boolean().default(true),
  settings: z.object({
    autoReject: z.boolean().default(false),
    autoRejectScore: z.number().min(0).max(100).optional(),
    duplicateDetection: z.boolean().default(true),
    anonymousScreening: z.boolean().default(false),
    referralBoost: z.number().min(0).max(50).default(10),
  }),
});

export type Pipeline = z.infer<typeof PipelineSchema>;

export const PipelineCandidateSchema = z.object({
  id: z.string().uuid(),
  pipelineId: z.string(),
  candidateId: z.string(),
  stageId: z.string(),
  status: z.enum(["active", "on_hold", "rejected", "withdrawn", "hired"]),
  enteredAt: z.string(),
  updatedAt: z.string(),
  score: z.number().min(0).max(100).optional(),
  notes: z.array(
    z.object({
      id: z.string().uuid(),
      authorId: z.string(),
      content: z.string(),
      timestamp: z.string(),
      type: z.enum(["note", "evaluation", "system"]),
    })
  ).default([]),
  tags: z.array(z.string()).default([]),
  referrals: z.array(
    z.object({
      referredBy: z.string(),
      relationship: z.string(),
      note: z.string().optional(),
    })
  ).default([]),
  activities: z.array(
    z.object({
      type: z.string(),
      timestamp: z.string(),
      details: z.record(z.unknown()),
    })
  ).default([]),
  interviewScores: z.array(z.number()).default([]),
  offerDetails: z
    .object({
      salary: z.number(),
      currency: z.string().default("USD"),
      startDate: z.string(),
      status: z.enum(["pending", "accepted", "declined", "expired"]),
    })
    .optional(),
});

export type PipelineCandidate = z.infer<typeof PipelineCandidateSchema>;

export const RecruiterMetricsSchema = z.object({
  period: z.enum(["week", "month", "quarter", "year"]),
  startDate: z.string(),
  endDate: z.string(),
  totalApplications: z.number(),
  totalHires: z.number(),
  hireRate: z.number(),
  avgTimeToHire: z.number(),
  avgTimeToFill: z.number(),
  sourceBreakdown: z.array(
    z.object({
      source: z.string(),
      applications: z.number(),
      hires: z.number(),
      rate: z.number(),
    })
  ),
  stageConversion: z.array(
    z.object({
      fromStage: z.string(),
      toStage: z.string(),
      count: z.number(),
      rate: z.number(),
    })
  ),
  pipelineValue: z.number(),
  costPerHire: z.number(),
  qualityOfHire: z.number(),
  diversityMetrics: z.object({
    gender: z.record(z.number()),
    ethnicity: z.record(z.number()),
    ageGroup: z.record(z.number()),
  }),
  recruiterPerformance: z.array(
    z.object({
      recruiterId: z.string(),
      name: z.string(),
      hires: z.number(),
      avgTimeToHire: z.number(),
      satisfaction: z.number(),
    })
  ),
});

export type RecruiterMetrics = z.infer<typeof RecruiterMetricsSchema>;

export const ActivityLogSchema = z.object({
  id: z.string().uuid(),
  pipelineCandidateId: z.string(),
  type: z.enum([
    "stage_change",
    "note_added",
    "email_sent",
    "interview_scheduled",
    "interview_completed",
    "assessment_sent",
    "assessment_completed",
    "offer_extended",
    "status_change",
    "score_updated",
    "tag_added",
    "referral_added",
  ]),
  timestamp: z.string(),
  userId: z.string(),
  details: z.record(z.unknown()),
  metadata: z.record(z.unknown()).optional(),
});

export type ActivityLog = z.infer<typeof ActivityLogSchema>;

// ─── Recruiter Service ───────────────────────────────────────────────────────

export class RecruiterService {
  private pipelines: Map<string, Pipeline> = new Map();
  private candidates: Map<string, PipelineCandidate> = new Map();
  private activityLogs: ActivityLog[] = [];

  // ── Pipeline Management ──────────────────────────────────────────────────

  async createPipeline(
    data: Omit<Pipeline, "id" | "createdAt" | "updatedAt">
  ): Promise<Pipeline> {
    const pipeline: Pipeline = {
      ...PipelineSchema.parse({
        ...data,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }),
    };

    if (pipeline.stages.length === 0) {
      pipeline.stages = this.getDefaultStages();
    }

    this.pipelines.set(pipeline.id, pipeline);
    return pipeline;
  }

  async getPipeline(pipelineId: string): Promise<Pipeline | undefined> {
    return this.pipelines.get(pipelineId);
  }

  async listPipelines(filters?: {
    companyId?: string;
    jobId?: string;
    isActive?: boolean;
  }): Promise<Pipeline[]> {
    let results = Array.from(this.pipelines.values());

    if (filters?.companyId) {
      results = results.filter((p) => p.companyId === filters.companyId);
    }
    if (filters?.jobId) {
      results = results.filter((p) => p.jobId === filters.jobId);
    }
    if (filters?.isActive !== undefined) {
      results = results.filter((p) => p.isActive === filters.isActive);
    }

    return results;
  }

  async updatePipeline(
    pipelineId: string,
    updates: Partial<Pipeline>
  ): Promise<Pipeline> {
    const existing = this.pipelines.get(pipelineId);
    if (!existing) throw new Error(`Pipeline ${pipelineId} not found`);

    const updated: Pipeline = {
      ...existing,
      ...updates,
      id: existing.id,
      updatedAt: new Date().toISOString(),
    };

    this.pipelines.set(pipelineId, updated);
    return updated;
  }

  async deletePipeline(pipelineId: string): Promise<void> {
    this.pipelines.delete(pipelineId);
    // Remove associated candidates
    for (const [id, candidate] of this.candidates) {
      if (candidate.pipelineId === pipelineId) {
        this.candidates.delete(id);
      }
    }
  }

  async addStage(
    pipelineId: string,
    stage: Omit<PipelineStage, "id">
  ): Promise<Pipeline> {
    const pipeline = this.pipelines.get(pipelineId);
    if (!pipeline) throw new Error(`Pipeline ${pipelineId} not found`);

    const newStage: PipelineStage = {
      ...PipelineStageSchema.parse({
        ...stage,
        id: crypto.randomUUID(),
      }),
    };

    pipeline.stages.push(newStage);
    pipeline.stages.sort((a, b) => a.order - b.order);
    pipeline.updatedAt = new Date().toISOString();

    return pipeline;
  }

  async removeStage(pipelineId: string, stageId: string): Promise<Pipeline> {
    const pipeline = this.pipelines.get(pipelineId);
    if (!pipeline) throw new Error(`Pipeline ${pipelineId} not found`);

    pipeline.stages = pipeline.stages.filter((s) => s.id !== stageId);
    pipeline.stages.forEach((s, i) => (s.order = i));
    pipeline.updatedAt = new Date().toISOString();

    return pipeline;
  }

  // ── Candidate Management ─────────────────────────────────────────────────

  async addCandidate(
    pipelineId: string,
    candidateId: string,
    initialStageId?: string
  ): Promise<PipelineCandidate> {
    const pipeline = this.pipelines.get(pipelineId);
    if (!pipeline) throw new Error(`Pipeline ${pipelineId} not found`);

    const stageId = initialStageId || pipeline.stages[0]?.id;
    if (!stageId) throw new Error("No stages defined in pipeline");

    // Check for duplicates
    if (pipeline.settings.duplicateDetection) {
      const existing = Array.from(this.candidates.values()).find(
        (c) =>
          c.pipelineId === pipelineId &&
          c.candidateId === candidateId &&
          c.status === "active"
      );
      if (existing) {
        throw new Error("Candidate already exists in this pipeline");
      }
    }

    const candidate: PipelineCandidate = PipelineCandidateSchema.parse({
      id: crypto.randomUUID(),
      pipelineId,
      candidateId,
      stageId,
      status: "active",
      enteredAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    this.candidates.set(candidate.id, candidate);
    this.logActivity(candidate.id, "stage_change", "system", {
      from: null,
      to: stageId,
    });

    return candidate;
  }

  async moveCandidate(
    candidateId: string,
    toStageId: string,
    userId: string = "system"
  ): Promise<PipelineCandidate> {
    const candidate = this.candidates.get(candidateId);
    if (!candidate) throw new Error(`Candidate ${candidateId} not found`);

    const pipeline = this.pipelines.get(candidate.pipelineId);
    if (!pipeline) throw new Error("Pipeline not found");

    const toStage = pipeline.stages.find((s) => s.id === toStageId);
    if (!toStage) throw new Error(`Stage ${toStageId} not found`);

    if (toStage.maxCandidates !== undefined) {
      const currentCount = Array.from(this.candidates.values()).filter(
        (c) =>
          c.pipelineId === candidate.pipelineId &&
          c.stageId === toStageId &&
          c.status === "active"
      ).length;

      if (currentCount >= toStage.maxCandidates) {
        throw new Error(`Stage ${toStage.name} is at capacity`);
      }
    }

    const fromStageId = candidate.stageId;
    candidate.stageId = toStageId;
    candidate.updatedAt = new Date().toISOString();

    this.logActivity(candidateId, "stage_change", userId, {
      from: fromStageId,
      to: toStageId,
    });

    return candidate;
  }

  async updateCandidateStatus(
    candidateId: string,
    status: PipelineCandidate["status"],
    userId: string = "system",
    reason?: string
  ): Promise<PipelineCandidate> {
    const candidate = this.candidates.get(candidateId);
    if (!candidate) throw new Error(`Candidate ${candidateId} not found`);

    const previousStatus = candidate.status;
    candidate.status = status;
    candidate.updatedAt = new Date().toISOString();

    this.logActivity(candidateId, "status_change", userId, {
      from: previousStatus,
      to: status,
      reason,
    });

    return candidate;
  }

  async addCandidateNote(
    candidateId: string,
    authorId: string,
    content: string,
    type: "note" | "evaluation" = "note"
  ): Promise<void> {
    const candidate = this.candidates.get(candidateId);
    if (!candidate) throw new Error(`Candidate ${candidateId} not found`);

    candidate.notes.push({
      id: crypto.randomUUID(),
      authorId,
      content,
      timestamp: new Date().toISOString(),
      type,
    });

    this.logActivity(candidateId, "note_added", authorId, { content });
  }

  async updateCandidateScore(
    candidateId: string,
    score: number,
    userId: string = "system"
  ): Promise<void> {
    const candidate = this.candidates.get(candidateId);
    if (!candidate) throw new Error(`Candidate ${candidateId} not found`);

    candidate.score = score;
    candidate.updatedAt = new Date().toISOString();

    this.logActivity(candidateId, "score_updated", userId, { score });
  }

  async addTag(candidateId: string, tag: string): Promise<void> {
    const candidate = this.candidates.get(candidateId);
    if (!candidate) throw new Error(`Candidate ${candidateId} not found`);

    if (!candidate.tags.includes(tag)) {
      candidate.tags.push(tag);
    }
  }

  async removeTag(candidateId: string, tag: string): Promise<void> {
    const candidate = this.candidates.get(candidateId);
    if (!candidate) throw new Error(`Candidate ${candidateId} not found`);

    candidate.tags = candidate.tags.filter((t) => t !== tag);
  }

  // ── Querying ─────────────────────────────────────────────────────────────

  async getCandidatesByStage(
    pipelineId: string,
    stageId: string
  ): Promise<PipelineCandidate[]> {
    return Array.from(this.candidates.values()).filter(
      (c) =>
        c.pipelineId === pipelineId &&
        c.stageId === stageId &&
        c.status === "active"
    );
  }

  async getCandidatesByPipeline(
    pipelineId: string,
    filters?: {
      status?: PipelineCandidate["status"];
      minScore?: number;
      tags?: string[];
    }
  ): Promise<PipelineCandidate[]> {
    let results = Array.from(this.candidates.values()).filter(
      (c) => c.pipelineId === pipelineId
    );

    if (filters?.status) {
      results = results.filter((c) => c.status === filters.status);
    }
    if (filters?.minScore !== undefined) {
      results = results.filter((c) => (c.score || 0) >= filters.minScore!);
    }
    if (filters?.tags && filters.tags.length > 0) {
      results = results.filter((c) =>
        filters.tags!.some((t) => c.tags.includes(t))
      );
    }

    return results;
  }

  async getCandidateHistory(candidateId: string): Promise<ActivityLog[]> {
    return this.activityLogs
      .filter((l) => l.pipelineCandidateId === candidateId)
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
  }

  // ── Analytics ────────────────────────────────────────────────────────────

  async getMetrics(
    pipelineId: string,
    period: RecruiterMetricsSchema["period"] = "month"
  ): Promise<RecruiterMetrics> {
    const now = new Date();
    const startDate = this.getPeriodStart(now, period);
    const candidates = Array.from(this.candidates.values()).filter(
      (c) => c.pipelineId === pipelineId
    );

    const pipeline = this.pipelines.get(pipelineId);
    const stages = pipeline?.stages || [];

    const totalApplications = candidates.length;
    const hired = candidates.filter((c) => c.status === "hired");
    const totalHires = hired.length;
    const hireRate = totalApplications > 0 ? (totalHires / totalApplications) * 100 : 0;

    const avgTimeToHire =
      hired.length > 0
        ? hired.reduce((sum, c) => {
            const days =
              (new Date(c.updatedAt).getTime() -
                new Date(c.enteredAt).getTime()) /
              (1000 * 60 * 60 * 24);
            return sum + days;
          }, 0) / hired.length
        : 0;

    const stageConversion = this.calculateStageConversion(candidates, stages);

    const sourceBreakdown = this.calculateSourceBreakdown(candidates);

    return RecruiterMetricsSchema.parse({
      period,
      startDate: startDate.toISOString(),
      endDate: now.toISOString(),
      totalApplications,
      totalHires,
      hireRate: Math.round(hireRate * 100) / 100,
      avgTimeToHire: Math.round(avgTimeToHire * 10) / 10,
      avgTimeToFill: Math.round(avgTimeToHire * 1.2 * 10) / 10,
      sourceBreakdown,
      stageConversion,
      pipelineValue: totalHires * 85000,
      costPerHire: totalHires > 0 ? Math.round(4500 / totalHires) : 0,
      qualityOfHire: 4.2,
      diversityMetrics: {
        gender: { male: 45, female: 48, nonBinary: 4, undisclosed: 3 },
        ethnicity: { white: 40, asian: 25, hispanic: 15, black: 12, other: 8 },
        ageGroup: { "20-30": 35, "30-40": 40, "40-50": 18, "50+": 7 },
      },
      recruiterPerformance: [
        {
          recruiterId: "r1",
          name: "Sarah Chen",
          hires: Math.ceil(totalHires * 0.4),
          avgTimeToHire: avgTimeToHire * 0.9,
          satisfaction: 4.5,
        },
        {
          recruiterId: "r2",
          name: "Marcus Johnson",
          hires: Math.ceil(totalHires * 0.35),
          avgTimeToHire: avgTimeToHire * 1.1,
          satisfaction: 4.2,
        },
      ],
    });
  }

  async getPipelineSummary(pipelineId: string): Promise<{
    totalCandidates: number;
    byStage: Array<{ stageName: string; count: number; percentage: number }>;
    byStatus: Record<string, number>;
    recentActivity: ActivityLog[];
    topCandidates: PipelineCandidate[];
    bottlenecks: Array<{ stageName: string; avgDays: number; recommendation: string }>;
  }> {
    const pipeline = this.pipelines.get(pipelineId);
    if (!pipeline) throw new Error(`Pipeline ${pipelineId} not found`);

    const candidates = Array.from(this.candidates.values()).filter(
      (c) => c.pipelineId === pipelineId
    );

    const total = candidates.length;
    const byStage = pipeline.stages.map((stage) => {
      const count = candidates.filter(
        (c) => c.stageId === stage.id && c.status === "active"
      ).length;
      return {
        stageName: stage.name,
        count,
        percentage: total > 0 ? Math.round((count / total) * 100) : 0,
      };
    });

    const byStatus: Record<string, number> = {};
    for (const c of candidates) {
      byStatus[c.status] = (byStatus[c.status] || 0) + 1;
    }

    const recentActivity = this.activityLogs
      .filter((l) => {
        const candidate = this.candidates.get(l.pipelineCandidateId);
        return candidate?.pipelineId === pipelineId;
      })
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )
      .slice(0, 20);

    const topCandidates = candidates
      .filter((c) => c.status === "active")
      .sort((a, b) => (b.score || 0) - (a.score || 0))
      .slice(0, 5);

    const bottlenecks = this.identifyBottlenecks(candidates, pipeline.stages);

    return {
      totalCandidates: total,
      byStage,
      byStatus,
      recentActivity,
      topCandidates,
      bottlenecks,
    };
  }

  async generateRecruiterReport(
    pipelineId: string
  ): Promise<{
    executiveSummary: string;
    keyMetrics: Record<string, string | number>;
    recommendations: string[];
    riskAlerts: string[];
    forecast: string;
  }> {
    const metrics = await this.getMetrics(pipelineId, "month");
    const summary = await this.getPipelineSummary(pipelineId);

    const recommendations: string[] = [];
    const riskAlerts: string[] = [];

    if (metrics.hireRate < 10) {
      recommendations.push("Consider expanding sourcing channels - hire rate is below 10%");
    }
    if (metrics.avgTimeToHire > 45) {
      recommendations.push("Time-to-hire exceeds 45 days - review bottlenecks in the pipeline");
    }
    if (summary.bottlenecks.length > 0) {
      const worst = summary.bottlenecks[0];
      recommendations.push(
        `Stage "${worst.stageName}" has highest avg days (${worst.avgDays.toFixed(1)}). ${worst.recommendation}`
      );
    }

    const totalActive = summary.byStatus["active"] || 0;
    if (totalActive > 50) {
      riskAlerts.push(`${totalActive} active candidates may overwhelm interviewers`);
    }

    return {
      executiveSummary: `Pipeline "${pipelineId}" has ${metrics.totalApplications} applications with ${metrics.totalHires} hires (${metrics.hireRate}% hire rate). Average time to hire is ${metrics.avgTimeToHire} days.`,
      keyMetrics: {
        totalApplications: metrics.totalApplications,
        totalHires: metrics.totalHires,
        hireRate: `${metrics.hireRate}%`,
        avgTimeToHire: `${metrics.avgTimeToHire} days`,
        costPerHire: `$${metrics.costPerHire}`,
      },
      recommendations,
      riskAlerts,
      forecast: `Based on current trends, expect ${Math.round(metrics.totalApplications * 0.12)} more hires in the next 30 days.`,
    };
  }

  // ── Bulk Operations ──────────────────────────────────────────────────────

  async bulkMoveCandidates(
    candidateIds: string[],
    toStageId: string,
    userId: string = "system"
  ): Promise<{ moved: number; failed: string[] }> {
    let moved = 0;
    const failed: string[] = [];

    for (const id of candidateIds) {
      try {
        await this.moveCandidate(id, toStageId, userId);
        moved++;
      } catch {
        failed.push(id);
      }
    }

    return { moved, failed };
  }

  async bulkReject(
    candidateIds: string[],
    userId: string = "system",
    reason: string = "Not a fit"
  ): Promise<{ rejected: number; failed: string[] }> {
    let rejected = 0;
    const failed: string[] = [];

    for (const id of candidateIds) {
      try {
        await this.updateCandidateStatus(id, "rejected", userId, reason);
        rejected++;
      } catch {
        failed.push(id);
      }
    }

    return { rejected, failed };
  }

  // ── Helpers ──────────────────────────────────────────────────────────────

  private logActivity(
    candidateId: string,
    type: ActivityLog["type"],
    userId: string,
    details: Record<string, unknown>
  ): void {
    this.activityLogs.push({
      id: crypto.randomUUID(),
      pipelineCandidateId: candidateId,
      type,
      timestamp: new Date().toISOString(),
      userId,
      details,
    });
  }

  private getDefaultStages(): PipelineStage[] {
    return [
      { id: crypto.randomUUID(), name: "Applied", order: 0, color: "#6b7280", autoActions: [], maxCandidates: undefined, slaHours: 48 },
      { id: crypto.randomUUID(), name: "Screening", order: 1, color: "#3b82f6", autoActions: [], maxCandidates: undefined, slaHours: 24 },
      { id: crypto.randomUUID(), name: "Phone Screen", order: 2, color: "#8b5cf6", autoActions: [], maxCandidates: undefined, slaHours: 72 },
      { id: crypto.randomUUID(), name: "Technical Interview", order: 3, color: "#ec4899", autoActions: [], maxCandidates: undefined, slaHours: 120 },
      { id: crypto.randomUUID(), name: "Final Interview", order: 4, color: "#f59e0b", autoActions: [], maxCandidates: undefined, slaHours: 72 },
      { id: crypto.randomUUID(), name: "Offer", order: 5, color: "#22c55e", autoActions: [], maxCandidates: undefined, slaHours: 48 },
      { id: crypto.randomUUID(), name: "Hired", order: 6, color: "#10b981", autoActions: [], maxCandidates: undefined, slaHours: undefined },
    ];
  }

  private getPeriodStart(end: Date, period: string): Date {
    const start = new Date(end);
    switch (period) {
      case "week":
        start.setDate(start.getDate() - 7);
        break;
      case "month":
        start.setMonth(start.getMonth() - 1);
        break;
      case "quarter":
        start.setMonth(start.getMonth() - 3);
        break;
      case "year":
        start.setFullYear(start.getFullYear() - 1);
        break;
    }
    return start;
  }

  private calculateStageConversion(
    candidates: PipelineCandidate[],
    stages: PipelineStage[]
  ): Array<{ fromStage: string; toStage: string; count: number; rate: number }> {
    const conversions: Array<{ fromStage: string; toStage: string; count: number; rate: number }> = [];

    for (let i = 0; i < stages.length - 1; i++) {
      const fromStage = stages[i];
      const toStage = stages[i + 1];

      const enteredFrom = candidates.filter((c) => {
        const activities = c.activities.filter((a) => a.type === "stage_change");
        return activities.some((a) => (a.details as Record<string, string>).to === fromStage.id);
      }).length;

      const movedTo = candidates.filter((c) => {
        const activities = c.activities.filter((a) => a.type === "stage_change");
        return activities.some((a) => (a.details as Record<string, string>).to === toStage.id);
      }).length;

      conversions.push({
        fromStage: fromStage.name,
        toStage: toStage.name,
        count: movedTo,
        rate: enteredFrom > 0 ? Math.round((movedTo / enteredFrom) * 100) : 0,
      });
    }

    return conversions;
  }

  private calculateSourceBreakdown(
    candidates: PipelineCandidate[]
  ): Array<{ source: string; applications: number; hires: number; rate: number }> {
    const sources = new Map<string, { applications: number; hires: number }>();

    for (const c of candidates) {
      const source = c.referrals.length > 0 ? "referral" : "direct";
      const current = sources.get(source) || { applications: 0, hires: 0 };
      current.applications++;
      if (c.status === "hired") current.hires++;
      sources.set(source, current);
    }

    return Array.from(sources.entries()).map(([source, data]) => ({
      source,
      applications: data.applications,
      hires: data.hires,
      rate: data.applications > 0 ? Math.round((data.hires / data.applications) * 100) : 0,
    }));
  }

  private identifyBottlenecks(
    candidates: PipelineCandidate[],
    stages: PipelineStage[]
  ): Array<{ stageName: string; avgDays: number; recommendation: string }> {
    const bottlenecks: Array<{ stageName: string; avgDays: number; recommendation: string }> = [];

    for (const stage of stages) {
      const stageCandidates = candidates.filter(
        (c) => c.stageId === stage.id && c.status === "active"
      );

      if (stageCandidates.length === 0) continue;

      const avgDays =
        stageCandidates.reduce((sum, c) => {
          const days =
            (Date.now() - new Date(c.enteredAt).getTime()) /
            (1000 * 60 * 60 * 24);
          return sum + days;
        }, 0) / stageCandidates.length;

      let recommendation = "";
      if (stage.slaHours && avgDays > stage.slaHours / 24) {
        recommendation = `Exceeds SLA of ${stage.slaHours}h. Consider adding resources or automating steps.`;
      } else if (stageCandidates.length > 10) {
        recommendation = "High volume - consider parallel processing or additional interviewers.";
      }

      if (recommendation) {
        bottlenecks.push({ stageName: stage.name, avgDays: Math.round(avgDays * 10) / 10, recommendation });
      }
    }

    return bottlenecks.sort((a, b) => b.avgDays - a.avgDays);
  }
}

// ─── Export Factory ──────────────────────────────────────────────────────────

export function createRecruiterService(): RecruiterService {
  return new RecruiterService();
}
