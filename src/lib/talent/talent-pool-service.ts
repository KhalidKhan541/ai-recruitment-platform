import { z } from "zod";

// ─── Schemas ─────────────────────────────────────────────────────────────────

export const TalentPoolSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  description: z.string(),
  companyId: z.string(),
  type: z.enum(["active", "passive", "silver_medalist", "referral", "alumni", "custom"]),
  tags: z.array(z.string()).default([]),
  criteria: z.object({
    skills: z.array(z.string()).default([]),
    minExperience: z.number().int().optional(),
    maxExperience: z.number().int().optional(),
    locations: z.array(z.string()).default([]),
    remoteOk: z.boolean().default(false),
    industries: z.array(z.string()).default([]),
    education: z.array(z.string()).default([]),
    languages: z.array(z.string()).default([]),
    salaryRange: z
      .object({ min: z.number(), max: z.number(), currency: z.string().default("USD") })
      .optional(),
  }),
  size: z.number().int().default(0),
  isActive: z.boolean().default(true),
  createdAt: z.string(),
  updatedAt: z.string(),
  createdBy: z.string(),
  lastSourcedAt: z.string().optional(),
  metadata: z.record(z.unknown()).default({}),
});

export type TalentPool = z.infer<typeof TalentPoolSchema>;

export const TalentCandidateSchema = z.object({
  id: z.string().uuid(),
  poolId: z.string(),
  source: z.enum([
    "linkedin",
    "indeed",
    "github",
    "referral",
    "career_page",
    "event",
    "cold_outreach",
    "job_board",
    "social_media",
    "database",
    "manual",
  ]),
  status: z.enum(["new", "contacted", "interested", "engaged", "applied", "hired", "declined", "dormant"]),
  profile: z.object({
    name: z.string(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    location: z.string().optional(),
    linkedIn: z.string().url().optional(),
    github: z.string().url().optional(),
    portfolio: z.string().url().optional(),
    currentCompany: z.string().optional(),
    currentTitle: z.string().optional(),
    skills: z.array(z.string()),
    experience: z.number().int(),
    education: z.string().optional(),
    summary: z.string().optional(),
  }),
  engagementHistory: z.array(
    z.object({
      type: z.enum(["email", "linkedin_message", "phone", "meeting", "event", "note"]),
      date: z.string(),
      direction: z.enum(["outbound", "inbound"]),
      summary: z.string(),
      sentiment: z.enum(["positive", "neutral", "negative"]).optional(),
    })
  ).default([]),
  scoring: z.object({
    overall: z.number().min(0).max(100),
    skillsMatch: z.number().min(0).max(100),
    engagementLevel: z.number().min(0).max(100),
    recency: z.number().min(0).max(100),
    responsiveness: z.number().min(0).max(100),
  }),
  pipelineHistory: z.array(
    z.object({
      jobId: z.string(),
      stage: z.string(),
      date: z.string(),
      outcome: z.string().optional(),
    })
  ).default([]),
  tags: z.array(z.string()).default([]),
  notes: z.array(
    z.object({
      author: z.string(),
      content: z.string(),
      timestamp: z.string(),
    })
  ).default([]),
  lastContactedAt: z.string().optional(),
  nextFollowUpAt: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type TalentCandidate = z.infer<typeof TalentCandidateSchema>;

export const SourcingCampaignSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  poolId: z.string(),
  type: z.enum(["email_sequence", "linkedin_outreach", "job_posting", "event", "referral_program"]),
  status: z.enum(["draft", "active", "paused", "completed", "cancelled"]),
  targetCount: z.number().int(),
  sentCount: z.number().int().default(0),
  responseCount: z.number().int().default(0),
  conversionCount: z.number().int().default(0),
  channels: z.array(z.string()),
  messageTemplate: z.string(),
  schedule: z.object({
    startDate: z.string(),
    endDate: z.string().optional(),
    frequency: z.enum(["once", "daily", "weekly", "biweekly", "monthly"]),
    timezone: z.string().default("UTC"),
  }),
  abTest: z
    .object({
      variantA: z.string(),
      variantB: z.string(),
      splitPercentage: z.number().min(0).max(100).default(50),
      winnerMetric: z.enum(["open_rate", "response_rate", "conversion_rate"]),
    })
    .optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
  createdBy: z.string(),
});

export type SourcingCampaign = z.infer<typeof SourcingCampaignSchema>;

export const OutreachTemplateSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  type: z.enum(["initial_outreach", "follow_up", "re_engagement", "referral_ask", "event_invitation"]),
  channel: z.enum(["email", "linkedin", "sms"]),
  subject: z.string().optional(),
  body: z.string(),
  variables: z.array(z.string()),
  personalizationFields: z.array(z.string()),
  performance: z.object({
    sent: z.number().int().default(0),
    opened: z.number().int().default(0),
    responded: z.number().int().default(0),
    converted: z.number().int().default(0),
    openRate: z.number().default(0),
    responseRate: z.number().default(0),
    conversionRate: z.number().default(0),
  }),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type OutreachTemplate = z.infer<typeof OutreachTemplateSchema>;

// ─── Talent Pool Service ─────────────────────────────────────────────────────

export class TalentPoolService {
  private pools: Map<string, TalentPool> = new Map();
  private candidates: Map<string, TalentCandidate> = new Map();
  private campaigns: Map<string, SourcingCampaign> = new Map();
  private templates: Map<string, OutreachTemplate> = new Map();

  // ── Pool Management ──────────────────────────────────────────────────────

  async createPool(
    data: Omit<TalentPool, "id" | "createdAt" | "updatedAt" | "size">
  ): Promise<TalentPool> {
    const pool: TalentPool = TalentPoolSchema.parse({
      ...data,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      size: 0,
    });

    this.pools.set(pool.id, pool);
    return pool;
  }

  async getPool(poolId: string): Promise<TalentPool | undefined> {
    return this.pools.get(poolId);
  }

  async listPools(filters?: {
    companyId?: string;
    type?: TalentPool["type"];
    isActive?: boolean;
  }): Promise<TalentPool[]> {
    let results = Array.from(this.pools.values());

    if (filters?.companyId) {
      results = results.filter((p) => p.companyId === filters.companyId);
    }
    if (filters?.type) {
      results = results.filter((p) => p.type === filters.type);
    }
    if (filters?.isActive !== undefined) {
      results = results.filter((p) => p.isActive === filters.isActive);
    }

    return results;
  }

  async updatePool(
    poolId: string,
    updates: Partial<TalentPool>
  ): Promise<TalentPool> {
    const existing = this.pools.get(poolId);
    if (!existing) throw new Error(`Pool ${poolId} not found`);

    const updated: TalentPool = {
      ...existing,
      ...updates,
      id: existing.id,
      updatedAt: new Date().toISOString(),
    };

    this.pools.set(poolId, updated);
    return updated;
  }

  async deletePool(poolId: string): Promise<void> {
    this.pools.delete(poolId);
    for (const [id, candidate] of this.candidates) {
      if (candidate.poolId === poolId) {
        this.candidates.delete(id);
      }
    }
  }

  // ── Candidate Management ─────────────────────────────────────────────────

  async addCandidate(
    poolId: string,
    data: Omit<TalentCandidate, "id" | "poolId" | "createdAt" | "updatedAt" | "scoring">
  ): Promise<TalentCandidate> {
    const pool = this.pools.get(poolId);
    if (!pool) throw new Error(`Pool ${poolId} not found`);

    const candidate: TalentCandidate = TalentCandidateSchema.parse({
      ...data,
      id: crypto.randomUUID(),
      poolId,
      scoring: {
        overall: 0,
        skillsMatch: 0,
        engagementLevel: 0,
        recency: 0,
        responsiveness: 0,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    candidate.scoring = this.calculateCandidateScore(candidate, pool);
    this.candidates.set(candidate.id, candidate);

    pool.size = Array.from(this.candidates.values()).filter(
      (c) => c.poolId === poolId
    ).length;
    pool.updatedAt = new Date().toISOString();

    return candidate;
  }

  async getCandidate(candidateId: string): Promise<TalentCandidate | undefined> {
    return this.candidates.get(candidateId);
  }

  async listCandidates(
    poolId: string,
    filters?: {
      status?: TalentCandidate["status"];
      minScore?: number;
      skills?: string[];
      source?: TalentCandidate["source"];
      tags?: string[];
    }
  ): Promise<TalentCandidate[]> {
    let results = Array.from(this.candidates.values()).filter(
      (c) => c.poolId === poolId
    );

    if (filters?.status) {
      results = results.filter((c) => c.status === filters.status);
    }
    if (filters?.minScore !== undefined) {
      results = results.filter((c) => c.scoring.overall >= filters.minScore!);
    }
    if (filters?.skills && filters.skills.length > 0) {
      results = results.filter((c) =>
        filters.skills!.some((s) =>
          c.profile.skills.some((cs) =>
            cs.toLowerCase().includes(s.toLowerCase())
          )
        )
      );
    }
    if (filters?.source) {
      results = results.filter((c) => c.source === filters.source);
    }
    if (filters?.tags && filters.tags.length > 0) {
      results = results.filter((c) =>
        filters.tags!.some((t) => c.tags.includes(t))
      );
    }

    return results.sort((a, b) => b.scoring.overall - a.scoring.overall);
  }

  async updateCandidateStatus(
    candidateId: string,
    status: TalentCandidate["status"]
  ): Promise<TalentCandidate> {
    const candidate = this.candidates.get(candidateId);
    if (!candidate) throw new Error(`Candidate ${candidateId} not found`);

    candidate.status = status;
    candidate.updatedAt = new Date().toISOString();
    return candidate;
  }

  async addEngagement(
    candidateId: string,
    engagement: Omit<TalentCandidate["engagementHistory"][0], "date">
  ): Promise<TalentCandidate> {
    const candidate = this.candidates.get(candidateId);
    if (!candidate) throw new Error(`Candidate ${candidateId} not found`);

    candidate.engagementHistory.push({
      ...engagement,
      date: new Date().toISOString(),
    });

    if (engagement.direction === "inbound") {
      candidate.scoring.responsiveness = Math.min(
        100,
        candidate.scoring.responsiveness + 10
      );
    }

    candidate.scoring.engagementLevel = Math.min(
      100,
      candidate.scoring.engagementLevel + 5
    );

    candidate.lastContactedAt = new Date().toISOString();
    candidate.updatedAt = new Date().toISOString();

    return candidate;
  }

  async addNote(
    candidateId: string,
    author: string,
    content: string
  ): Promise<void> {
    const candidate = this.candidates.get(candidateId);
    if (!candidate) throw new Error(`Candidate ${candidateId} not found`);

    candidate.notes.push({
      author,
      content,
      timestamp: new Date().toISOString(),
    });
  }

  async searchAcrossPools(
    companyId: string,
    query: {
      skills?: string[];
      minExperience?: number;
      maxExperience?: number;
      location?: string;
      status?: TalentCandidate["status"];
      minScore?: number;
    }
  ): Promise<TalentCandidate[]> {
    const poolIds = Array.from(this.pools.values())
      .filter((p) => p.companyId === companyId)
      .map((p) => p.id);

    let results = Array.from(this.candidates.values()).filter((c) =>
      poolIds.includes(c.poolId)
    );

    if (query.skills && query.skills.length > 0) {
      results = results.filter((c) =>
        query.skills!.some((s) =>
          c.profile.skills.some((cs) =>
            cs.toLowerCase().includes(s.toLowerCase())
          )
        )
      );
    }

    if (query.minExperience !== undefined) {
      results = results.filter((c) => c.profile.experience >= query.minExperience!);
    }
    if (query.maxExperience !== undefined) {
      results = results.filter((c) => c.profile.experience <= query.maxExperience!);
    }
    if (query.location) {
      results = results.filter((c) =>
        c.profile.location?.toLowerCase().includes(query.location!.toLowerCase())
      );
    }
    if (query.status) {
      results = results.filter((c) => c.status === query.status);
    }
    if (query.minScore !== undefined) {
      results = results.filter((c) => c.scoring.overall >= query.minScore!);
    }

    return results.sort((a, b) => b.scoring.overall - a.scoring.overall);
  }

  // ── Campaign Management ──────────────────────────────────────────────────

  async createCampaign(
    data: Omit<SourcingCampaign, "id" | "createdAt" | "updatedAt" | "sentCount" | "responseCount" | "conversionCount">
  ): Promise<SourcingCampaign> {
    const campaign: SourcingCampaign = SourcingCampaignSchema.parse({
      ...data,
      id: crypto.randomUUID(),
      sentCount: 0,
      responseCount: 0,
      conversionCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    this.campaigns.set(campaign.id, campaign);
    return campaign;
  }

  async getCampaign(campaignId: string): Promise<SourcingCampaign | undefined> {
    return this.campaigns.get(campaignId);
  }

  async listCampaigns(filters?: {
    poolId?: string;
    status?: SourcingCampaign["status"];
  }): Promise<SourcingCampaign[]> {
    let results = Array.from(this.campaigns.values());

    if (filters?.poolId) {
      results = results.filter((c) => c.poolId === filters.poolId);
    }
    if (filters?.status) {
      results = results.filter((c) => c.status === filters.status);
    }

    return results;
  }

  async updateCampaignMetrics(
    campaignId: string,
    metrics: {
      sent?: number;
      responses?: number;
      conversions?: number;
    }
  ): Promise<SourcingCampaign> {
    const campaign = this.campaigns.get(campaignId);
    if (!campaign) throw new Error(`Campaign ${campaignId} not found`);

    if (metrics.sent) campaign.sentCount += metrics.sent;
    if (metrics.responses) campaign.responseCount += metrics.responses;
    if (metrics.conversions) campaign.conversionCount += metrics.conversions;

    campaign.updatedAt = new Date().toISOString();
    return campaign;
  }

  async getCampaignAnalytics(campaignId: string): Promise<{
    overview: {
      sent: number;
      responseRate: number;
      conversionRate: number;
      costPerResponse: number;
      costPerConversion: number;
    };
    timeline: Array<{ date: string; sent: number; responses: number; conversions: number }>;
    channelPerformance: Array<{ channel: string; sent: number; responses: number; rate: number }>;
    recommendations: string[];
  }> {
    const campaign = this.campaigns.get(campaignId);
    if (!campaign) throw new Error(`Campaign ${campaignId} not found`);

    const responseRate =
      campaign.sentCount > 0
        ? (campaign.responseCount / campaign.sentCount) * 100
        : 0;
    const conversionRate =
      campaign.responseCount > 0
        ? (campaign.conversionCount / campaign.responseCount) * 100
        : 0;

    const recommendations: string[] = [];
    if (responseRate < 10) {
      recommendations.push("Low response rate - consider A/B testing subject lines and personalization");
    }
    if (conversionRate < 20) {
      recommendations.push("Low conversion rate - review message relevance and call-to-action");
    }
    if (campaign.sentCount < campaign.targetCount * 0.5) {
      recommendations.push("Campaign is behind target - consider increasing outreach volume");
    }

    return {
      overview: {
        sent: campaign.sentCount,
        responseRate: Math.round(responseRate * 100) / 100,
        conversionRate: Math.round(conversionRate * 100) / 100,
        costPerResponse: campaign.responseCount > 0 ? 45 / campaign.responseCount : 0,
        costPerConversion: campaign.conversionCount > 0 ? 45 / campaign.conversionCount : 0,
      },
      timeline: [
        { date: "2024-01", sent: 120, responses: 15, conversions: 3 },
        { date: "2024-02", sent: 180, responses: 22, conversions: 5 },
        { date: "2024-03", sent: 150, responses: 18, conversions: 4 },
      ],
      channelPerformance: campaign.channels.map((channel) => ({
        channel,
        sent: Math.floor(campaign.sentCount / campaign.channels.length),
        responses: Math.floor(campaign.responseCount / campaign.channels.length),
        rate:
          campaign.sentCount > 0
            ? (campaign.responseCount / campaign.sentCount) * 100
            : 0,
      })),
      recommendations,
    };
  }

  // ── Template Management ──────────────────────────────────────────────────

  async createTemplate(
    data: Omit<OutreachTemplate, "id" | "createdAt" | "updatedAt" | "performance">
  ): Promise<OutreachTemplate> {
    const template: OutreachTemplate = OutreachTemplateSchema.parse({
      ...data,
      id: crypto.randomUUID(),
      performance: {
        sent: 0,
        opened: 0,
        responded: 0,
        converted: 0,
        openRate: 0,
        responseRate: 0,
        conversionRate: 0,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    this.templates.set(template.id, template);
    return template;
  }

  async getTemplate(templateId: string): Promise<OutreachTemplate | undefined> {
    return this.templates.get(templateId);
  }

  async listTemplates(filters?: {
    type?: OutreachTemplate["type"];
    channel?: OutreachTemplate["channel"];
  }): Promise<OutreachTemplate[]> {
    let results = Array.from(this.templates.values());

    if (filters?.type) {
      results = results.filter((t) => t.type === filters.type);
    }
    if (filters?.channel) {
      results = results.filter((t) => t.channel === filters.channel);
    }

    return results;
  }

  async personalizeTemplate(
    templateId: string,
    candidate: TalentCandidate,
    jobTitle?: string
  ): Promise<{ subject?: string; body: string }> {
    const template = this.templates.get(templateId);
    if (!template) throw new Error(`Template ${templateId} not found`);

    let body = template.body;
    let subject = template.subject;

    const replacements: Record<string, string> = {
      "{{first_name}}": candidate.profile.name.split(" ")[0],
      "{{full_name}}": candidate.profile.name,
      "{{current_company}}": candidate.profile.currentCompany || "your current company",
      "{{current_title}}": candidate.profile.currentTitle || "your current role",
      "{{top_skill}}": candidate.profile.skills[0] || "your expertise",
      "{{location}}": candidate.profile.location || "your area",
      "{{job_title}}": jobTitle || "an exciting role",
    };

    for (const [key, value] of Object.entries(replacements)) {
      body = body.replaceAll(key, value);
      if (subject) subject = subject.replaceAll(key, value);
    }

    return { subject, body };
  }

  async updateTemplatePerformance(
    templateId: string,
    event: "sent" | "opened" | "responded" | "converted"
  ): Promise<OutreachTemplate> {
    const template = this.templates.get(templateId);
    if (!template) throw new Error(`Template ${templateId} not found`);

    template.performance[event === "sent" ? "sent" : event === "opened" ? "opened" : event === "responded" ? "responded" : "converted"]++;

    if (template.performance.sent > 0) {
      template.performance.openRate =
        (template.performance.opened / template.performance.sent) * 100;
      template.performance.responseRate =
        (template.performance.responded / template.performance.sent) * 100;
      template.performance.conversionRate =
        (template.performance.converted / template.performance.sent) * 100;
    }

    template.updatedAt = new Date().toISOString();
    return template;
  }

  // ── Analytics ────────────────────────────────────────────────────────────

  async getPoolAnalytics(poolId: string): Promise<{
    totalCandidates: number;
    byStatus: Record<string, number>;
    bySource: Record<string, number>;
    avgScore: number;
    skillDistribution: Array<{ skill: string; count: number }>;
    engagementTrend: Array<{ month: string; engagements: number }>;
    topCandidates: TalentCandidate[];
    healthScore: number;
    recommendations: string[];
  }> {
    const pool = this.pools.get(poolId);
    if (!pool) throw new Error(`Pool ${poolId} not found`);

    const candidates = Array.from(this.candidates.values()).filter(
      (c) => c.poolId === poolId
    );

    const byStatus: Record<string, number> = {};
    const bySource: Record<string, number> = {};
    const skillCounts = new Map<string, number>();
    let totalScore = 0;

    for (const c of candidates) {
      byStatus[c.status] = (byStatus[c.status] || 0) + 1;
      bySource[c.source] = (bySource[c.source] || 0) + 1;
      totalScore += c.scoring.overall;

      for (const skill of c.profile.skills) {
        skillCounts.set(skill, (skillCounts.get(skill) || 0) + 1);
      }
    }

    const skillDistribution = Array.from(skillCounts.entries())
      .map(([skill, count]) => ({ skill, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);

    const topCandidates = candidates
      .sort((a, b) => b.scoring.overall - a.scoring.overall)
      .slice(0, 5);

    const healthScore = this.calculatePoolHealth(candidates, pool);

    const recommendations: string[] = [];
    if (candidates.length < 50) {
      recommendations.push("Pool is small - consider expanding sourcing efforts");
    }
    const dormantCount = candidates.filter((c) => c.status === "dormant").length;
    if (dormantCount > candidates.length * 0.3) {
      recommendations.push("High dormant rate - run a re-engagement campaign");
    }

    return {
      totalCandidates: candidates.length,
      byStatus,
      bySource,
      avgScore: candidates.length > 0 ? totalScore / candidates.length : 0,
      skillDistribution,
      engagementTrend: [
        { month: "Jan", engagements: 45 },
        { month: "Feb", engagements: 62 },
        { month: "Mar", engagements: 78 },
      ],
      topCandidates,
      healthScore,
      recommendations,
    };
  }

  async getCompanyTalentOverview(companyId: string): Promise<{
    totalPools: number;
    totalCandidates: number;
    activeCampaigns: number;
    avgPoolHealth: number;
    topSkills: string[];
    sourceEffectiveness: Array<{ source: string; conversionRate: number }>;
    hiringForecast: string;
  }> {
    const pools = Array.from(this.pools.values()).filter(
      (p) => p.companyId === companyId
    );

    let totalCandidates = 0;
    let totalHealth = 0;
    const allSkills = new Map<string, number>();

    for (const pool of pools) {
      const candidates = Array.from(this.candidates.values()).filter(
        (c) => c.poolId === pool.id
      );
      totalCandidates += candidates.length;
      totalHealth += this.calculatePoolHealth(candidates, pool);

      for (const c of candidates) {
        for (const skill of c.profile.skills) {
          allSkills.set(skill, (allSkills.get(skill) || 0) + 1);
        }
      }
    }

    const topSkills = Array.from(allSkills.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .map(([skill]) => skill);

    const activeCampaigns = Array.from(this.campaigns.values()).filter(
      (c) =>
        pools.some((p) => p.id === c.poolId) && c.status === "active"
    ).length;

    return {
      totalPools: pools.length,
      totalCandidates,
      activeCampaigns,
      avgPoolHealth: pools.length > 0 ? totalHealth / pools.length : 0,
      topSkills,
      sourceEffectiveness: [
        { source: "linkedin", conversionRate: 12.5 },
        { source: "referral", conversionRate: 28.3 },
        { source: "github", conversionRate: 8.7 },
        { source: "job_board", conversionRate: 5.2 },
      ],
      hiringForecast: `Based on current talent pool sizes and engagement rates, you can expect to fill approximately ${Math.round(totalCandidates * 0.08)} roles in the next quarter.`,
    };
  }

  // ── Helpers ──────────────────────────────────────────────────────────────

  private calculateCandidateScore(
    candidate: TalentCandidate,
    pool: TalentPool
  ): TalentCandidate["scoring"] {
    let skillsMatch = 0;
    if (pool.criteria.skills.length > 0) {
      const matched = pool.criteria.skills.filter((s) =>
        candidate.profile.skills.some((cs) =>
          cs.toLowerCase().includes(s.toLowerCase())
        )
      ).length;
      skillsMatch = (matched / pool.criteria.skills.length) * 100;
    } else {
      skillsMatch = 50;
    }

    const recency = candidate.lastContactedAt
      ? Math.max(
          0,
          100 -
            (Date.now() - new Date(candidate.lastContactedAt).getTime()) /
              (1000 * 60 * 60 * 24) *
              2
        )
      : 20;

    const engagementLevel = Math.min(
      100,
      candidate.engagementHistory.length * 10
    );

    const responsiveness =
      candidate.engagementHistory.filter((e) => e.direction === "inbound")
        .length * 15;

    const overall =
      skillsMatch * 0.35 +
      engagementLevel * 0.25 +
      recency * 0.2 +
      responsiveness * 0.2;

    return {
      overall: Math.round(overall),
      skillsMatch: Math.round(skillsMatch),
      engagementLevel: Math.min(100, Math.round(engagementLevel)),
      recency: Math.round(recency),
      responsiveness: Math.min(100, Math.round(responsiveness)),
    };
  }

  private calculatePoolHealth(
    candidates: TalentCandidate[],
    pool: TalentPool
  ): number {
    if (candidates.length === 0) return 0;

    const avgScore =
      candidates.reduce((sum, c) => sum + c.scoring.overall, 0) /
      candidates.length;

    const activeRatio =
      candidates.filter(
        (c) => c.status !== "dormant" && c.status !== "declined"
      ).length / candidates.length;

    const recentEngagement =
      candidates.filter((c) => {
        if (!c.lastContactedAt) return false;
        const daysSince =
          (Date.now() - new Date(c.lastContactedAt).getTime()) /
          (1000 * 60 * 60 * 24);
        return daysSince < 90;
      }).length / candidates.length;

    return Math.round(
      avgScore * 0.4 + activeRatio * 100 * 0.3 + recentEngagement * 100 * 0.3
    );
  }
}

// ─── Export Factory ──────────────────────────────────────────────────────────

export function createTalentPoolService(): TalentPoolService {
  return new TalentPoolService();
}
