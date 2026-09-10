export enum Permission {
  // User management
  USER_CREATE = "USER_CREATE",
  USER_READ = "USER_READ",
  USER_UPDATE = "USER_UPDATE",
  USER_DELETE = "USER_DELETE",
  USER_LIST = "USER_LIST",

  // Company management
  COMPANY_CREATE = "COMPANY_CREATE",
  COMPANY_READ = "COMPANY_READ",
  COMPANY_UPDATE = "COMPANY_UPDATE",
  COMPANY_DELETE = "COMPANY_DELETE",
  COMPANY_SETTINGS = "COMPANY_SETTINGS",

  // Job management
  JOB_CREATE = "JOB_CREATE",
  JOB_READ = "JOB_READ",
  JOB_UPDATE = "JOB_UPDATE",
  JOB_DELETE = "JOB_DELETE",
  JOB_PUBLISH = "JOB_PUBLISH",
  JOB_CLOSE = "JOB_CLOSE",

  // Application management
  APPLICATION_CREATE = "APPLICATION_CREATE",
  APPLICATION_READ = "APPLICATION_READ",
  APPLICATION_UPDATE = "APPLICATION_UPDATE",
  APPLICATION_DELETE = "APPLICATION_DELETE",
  APPLICATION_REVIEW = "APPLICATION_REVIEW",

  // Interview management
  INTERVIEW_CREATE = "INTERVIEW_CREATE",
  INTERVIEW_READ = "INTERVIEW_READ",
  INTERVIEW_UPDATE = "INTERVIEW_UPDATE",
  INTERVIEW_DELETE = "INTERVIEW_DELETE",
  INTERVIEW_SCORE = "INTERVIEW_SCORE",
  INTERVIEW_SCHEDULE = "INTERVIEW_SCHEDULE",

  // Offer management
  OFFER_CREATE = "OFFER_CREATE",
  OFFER_READ = "OFFER_READ",
  OFFER_UPDATE = "OFFER_UPDATE",
  OFFER_DELETE = "OFFER_DELETE",
  OFFER_APPROVE = "OFFER_APPROVE",

  // Resume management
  RESUME_UPLOAD = "RESUME_UPLOAD",
  RESUME_READ = "RESUME_READ",
  RESUME_DELETE = "RESUME_DELETE",
  RESUME_PARSE = "RESUME_PARSE",

  // Candidate management
  CANDIDATE_READ = "CANDIDATE_READ",
  CANDIDATE_UPDATE = "CANDIDATE_UPDATE",
  CANDIDATE_NOTE = "CANDIDATE_NOTE",

  // Analytics and reports
  ANALYTICS_VIEW = "ANALYTICS_VIEW",
  ANALYTICS_EXPORT = "ANALYTICS_EXPORT",
  REPORT_CREATE = "REPORT_CREATE",
  REPORT_VIEW = "REPORT_VIEW",
  REPORT_SCHEDULE = "REPORT_SCHEDULE",

  // Communication
  COMMUNICATION_SEND = "COMMUNICATION_SEND",
  COMMUNICATION_READ = "COMMUNICATION_READ",
  TEMPLATE_MANAGE = "TEMPLATE_MANAGE",

  // Talent pool
  TALENT_POOL_CREATE = "TALENT_POOL_CREATE",
  TALENT_POOL_READ = "TALENT_POOL_READ",
  TALENT_POOL_UPDATE = "TALENT_POOL_UPDATE",
  TALENT_POOL_DELETE = "TALENT_POOL_DELETE",

  // Onboarding
  ONBOARDING_CREATE = "ONBOARDING_CREATE",
  ONBOARDING_READ = "ONBOARDING_READ",
  ONBOARDING_UPDATE = "ONBOARDING_UPDATE",

  // Assessment
  ASSESSMENT_CREATE = "ASSESSMENT_CREATE",
  ASSESSMENT_READ = "ASSESSMENT_READ",
  ASSESSMENT_TAKE = "ASSESSMENT_TAKE",

  // Notifications
  NOTIFICATION_READ = "NOTIFICATION_READ",
  NOTIFICATION_MANAGE = "NOTIFICATION_MANAGE",

  // Audit
  AUDIT_LOG_VIEW = "AUDIT_LOG_VIEW",

  // System
  SYSTEM_SETTINGS = "SYSTEM_SETTINGS",
  SYSTEM_MAINTENANCE = "SYSTEM_MAINTENANCE",
}

const rolePermissions: Record<string, Permission[]> = {
  SUPER_ADMIN: Object.values(Permission),

  ADMIN: [
    Permission.USER_CREATE,
    Permission.USER_READ,
    Permission.USER_UPDATE,
    Permission.USER_DELETE,
    Permission.USER_LIST,
    Permission.COMPANY_READ,
    Permission.COMPANY_UPDATE,
    Permission.COMPANY_SETTINGS,
    Permission.JOB_CREATE,
    Permission.JOB_READ,
    Permission.JOB_UPDATE,
    Permission.JOB_DELETE,
    Permission.JOB_PUBLISH,
    Permission.JOB_CLOSE,
    Permission.APPLICATION_READ,
    Permission.APPLICATION_UPDATE,
    Permission.APPLICATION_REVIEW,
    Permission.INTERVIEW_CREATE,
    Permission.INTERVIEW_READ,
    Permission.INTERVIEW_UPDATE,
    Permission.INTERVIEW_DELETE,
    Permission.INTERVIEW_SCORE,
    Permission.INTERVIEW_SCHEDULE,
    Permission.OFFER_CREATE,
    Permission.OFFER_READ,
    Permission.OFFER_UPDATE,
    Permission.OFFER_DELETE,
    Permission.OFFER_APPROVE,
    Permission.RESUME_READ,
    Permission.RESUME_PARSE,
    Permission.CANDIDATE_READ,
    Permission.CANDIDATE_UPDATE,
    Permission.CANDIDATE_NOTE,
    Permission.ANALYTICS_VIEW,
    Permission.ANALYTICS_EXPORT,
    Permission.REPORT_CREATE,
    Permission.REPORT_VIEW,
    Permission.REPORT_SCHEDULE,
    Permission.COMMUNICATION_SEND,
    Permission.COMMUNICATION_READ,
    Permission.TEMPLATE_MANAGE,
    Permission.TALENT_POOL_CREATE,
    Permission.TALENT_POOL_READ,
    Permission.TALENT_POOL_UPDATE,
    Permission.TALENT_POOL_DELETE,
    Permission.ONBOARDING_CREATE,
    Permission.ONBOARDING_READ,
    Permission.ONBOARDING_UPDATE,
    Permission.ASSESSMENT_CREATE,
    Permission.ASSESSMENT_READ,
    Permission.NOTIFICATION_READ,
    Permission.NOTIFICATION_MANAGE,
    Permission.AUDIT_LOG_VIEW,
  ],

  RECRUITER: [
    Permission.USER_READ,
    Permission.COMPANY_READ,
    Permission.JOB_CREATE,
    Permission.JOB_READ,
    Permission.JOB_UPDATE,
    Permission.JOB_PUBLISH,
    Permission.JOB_CLOSE,
    Permission.APPLICATION_READ,
    Permission.APPLICATION_UPDATE,
    Permission.APPLICATION_REVIEW,
    Permission.INTERVIEW_CREATE,
    Permission.INTERVIEW_READ,
    Permission.INTERVIEW_UPDATE,
    Permission.INTERVIEW_SCORE,
    Permission.INTERVIEW_SCHEDULE,
    Permission.OFFER_CREATE,
    Permission.OFFER_READ,
    Permission.OFFER_UPDATE,
    Permission.RESUME_READ,
    Permission.RESUME_PARSE,
    Permission.CANDIDATE_READ,
    Permission.CANDIDATE_UPDATE,
    Permission.CANDIDATE_NOTE,
    Permission.ANALYTICS_VIEW,
    Permission.REPORT_VIEW,
    Permission.COMMUNICATION_SEND,
    Permission.COMMUNICATION_READ,
    Permission.TALENT_POOL_CREATE,
    Permission.TALENT_POOL_READ,
    Permission.TALENT_POOL_UPDATE,
    Permission.ONBOARDING_READ,
    Permission.ASSESSMENT_READ,
    Permission.NOTIFICATION_READ,
  ],

  HIRING_MANAGER: [
    Permission.USER_READ,
    Permission.COMPANY_READ,
    Permission.JOB_READ,
    Permission.APPLICATION_READ,
    Permission.APPLICATION_REVIEW,
    Permission.INTERVIEW_READ,
    Permission.INTERVIEW_SCORE,
    Permission.OFFER_READ,
    Permission.CANDIDATE_READ,
    Permission.CANDIDATE_NOTE,
    Permission.ANALYTICS_VIEW,
    Permission.REPORT_VIEW,
    Permission.COMMUNICATION_READ,
    Permission.NOTIFICATION_READ,
  ],

  CANDIDATE: [
    Permission.USER_READ,
    Permission.USER_UPDATE,
    Permission.JOB_READ,
    Permission.APPLICATION_CREATE,
    Permission.APPLICATION_READ,
    Permission.RESUME_UPLOAD,
    Permission.RESUME_READ,
    Permission.RESUME_DELETE,
    Permission.INTERVIEW_READ,
    Permission.OFFER_READ,
    Permission.CANDIDATE_UPDATE,
    Permission.COMMUNICATION_READ,
    Permission.NOTIFICATION_READ,
    Permission.ASSESSMENT_TAKE,
  ],
};

export function hasPermission(role: string, permission: Permission): boolean {
  const permissions = rolePermissions[role];
  if (!permissions) return false;
  return permissions.includes(permission);
}

export function hasAnyPermission(
  role: string,
  permissions: Permission[]
): boolean {
  return permissions.some((p) => hasPermission(role, p));
}

export function hasAllPermissions(
  role: string,
  permissions: Permission[]
): boolean {
  return permissions.every((p) => hasPermission(role, p));
}

export function getRolePermissions(role: string): Permission[] {
  return rolePermissions[role] ?? [];
}
