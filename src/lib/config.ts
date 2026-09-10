import { z } from "zod";

const configSchema = z.object({
  app: z.object({
    name: z.string().default("AI Recruitment Platform"),
    url: z.string().url().default("http://localhost:3000"),
    env: z
      .enum(["development", "staging", "production", "test"])
      .default("development"),
  }),
  auth: z.object({
    secret: z.string().min(1),
    nextAuthUrl: z.string().url(),
    google: z.object({
      clientId: z.string().optional(),
      clientSecret: z.string().optional(),
    }),
    github: z.object({
      clientId: z.string().optional(),
      clientSecret: z.string().optional(),
    }),
  }),
  database: z.object({
    url: z.string().url(),
  }),
  redis: z.object({
    url: z.string().url().optional(),
  }),
  ai: z.object({
    openaiApiKey: z.string().optional(),
    model: z.string().default("gpt-4-turbo-preview"),
    maxTokens: z.number().default(2000),
    temperature: z.number().min(0).max(2).default(0.7),
  }),
  email: z.object({
    provider: z
      .enum(["resend", "nodemailer", "ses"])
      .default("resend"),
    from: z.string().email().default("noreply@recruitai.com"),
    resendApiKey: z.string().optional(),
    smtp: z
      .object({
        host: z.string().optional(),
        port: z.number().optional(),
        user: z.string().optional(),
        pass: z.string().optional(),
      })
      .optional(),
  }),
  storage: z.object({
    provider: z
      .enum(["local", "s3", "r2", "gcs"])
      .default("local"),
    bucket: z.string().optional(),
    region: z.string().optional(),
    accessKey: z.string().optional(),
    secretKey: z.string().optional(),
    publicUrl: z.string().optional(),
  }),
  search: z.object({
    provider: z
      .enum(["algolia", "meilisearch", "typesense", "local"])
      .default("local"),
    apiKey: z.string().optional(),
    indexName: z.string().default("recruitments"),
  }),
  notifications: z.object({
    enabled: z.boolean().default(true),
    smsProvider: z.enum(["twilio", "vonage"]).optional(),
    smsApiKey: z.string().optional(),
    smsFrom: z.string().optional(),
    pushEnabled: z.boolean().default(false),
  }),
  analytics: z.object({
    enabled: z.boolean().default(true),
    trackingId: z.string().optional(),
  }),
  limits: z.object({
    maxFileSize: z.number().default(10 * 1024 * 1024),
    allowedFileTypes: z
      .array(z.string())
      .default([
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ]),
    maxApplicationsPerDay: z.number().default(50),
    maxJobPostings: z.number().default(100),
    rateLimitWindow: z.number().default(15 * 60 * 1000),
    rateLimitMax: z.number().default(100),
  }),
});

type Config = z.infer<typeof configSchema>;

function loadConfig(): Config {
  const raw = {
    app: {
      name: process.env.APP_NAME,
      url: process.env.APP_URL,
      env: process.env.NODE_ENV,
    },
    auth: {
      secret: process.env.NEXTAUTH_SECRET!,
      nextAuthUrl: process.env.NEXTAUTH_URL!,
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      },
      github: {
        clientId: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
      },
    },
    database: {
      url: process.env.DATABASE_URL!,
    },
    redis: {
      url: process.env.REDIS_URL,
    },
    ai: {
      openaiApiKey: process.env.OPENAI_API_KEY,
      model: process.env.AI_MODEL,
      maxTokens: process.env.AI_MAX_TOKENS
        ? parseInt(process.env.AI_MAX_TOKENS)
        : undefined,
      temperature: process.env.AI_TEMPERATURE
        ? parseFloat(process.env.AI_TEMPERATURE)
        : undefined,
    },
    email: {
      provider: process.env.EMAIL_PROVIDER as any,
      from: process.env.EMAIL_FROM,
      resendApiKey: process.env.RESEND_API_KEY,
      smtp: {
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT
          ? parseInt(process.env.SMTP_PORT)
          : undefined,
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    },
    storage: {
      provider: process.env.STORAGE_PROVIDER as any,
      bucket: process.env.S3_BUCKET,
      region: process.env.S3_REGION,
      accessKey: process.env.S3_ACCESS_KEY,
      secretKey: process.env.S3_SECRET_KEY,
      publicUrl: process.env.STORAGE_PUBLIC_URL,
    },
    search: {
      provider: process.env.SEARCH_PROVIDER as any,
      apiKey: process.env.SEARCH_API_KEY,
      indexName: process.env.SEARCH_INDEX_NAME,
    },
    notifications: {
      enabled: process.env.NOTIFICATIONS_ENABLED !== "false",
      smsProvider: process.env.SMS_PROVIDER as any,
      smsApiKey: process.env.SMS_API_KEY,
      smsFrom: process.env.SMS_FROM,
      pushEnabled: process.env.PUSH_ENABLED === "true",
    },
    analytics: {
      enabled: process.env.ANALYTICS_ENABLED !== "false",
      trackingId: process.env.ANALYTICS_TRACKING_ID,
    },
    limits: {
      maxFileSize: process.env.MAX_FILE_SIZE
        ? parseInt(process.env.MAX_FILE_SIZE)
        : undefined,
      maxApplicationsPerDay: process.env.MAX_APPLICATIONS_PER_DAY
        ? parseInt(process.env.MAX_APPLICATIONS_PER_DAY)
        : undefined,
      maxJobPostings: process.env.MAX_JOB_POSTINGS
        ? parseInt(process.env.MAX_JOB_POSTINGS)
        : undefined,
    },
  };

  return configSchema.parse(raw);
}

let _config: Config | null = null;

export function getConfig(): Config {
  if (!_config) {
    _config = loadConfig();
  }
  return _config;
}

export const config = getConfig();

export default config;
