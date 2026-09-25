// ============================================================================
// HireTrack — shared constants
// Recruitment workflow vocabulary used across modules.
// ============================================================================

// Internal team roles (company side) + external candidate role.
export const ROLES = {
  ADMIN: "ADMIN",
  DELIVERY: "DELIVERY",
  TFG: "TFG",
  TAG: "TAG",
  CANDIDATE: "CANDIDATE",
};

export const ROLE_LABELS = {
  ADMIN: "Admin",
  DELIVERY: "Delivery",
  TFG: "TFG",
  TAG: "TAG",
  CANDIDATE: "Candidate",
};

export const ROLE_DESCRIPTIONS = {
  ADMIN: "Full system access across every stage",
  DELIVERY: "Owns company requirements and job creation",
  TFG: "Reviews and approves jobs before hiring",
  TAG: "Runs the candidate hiring pipeline",
  CANDIDATE: "External applicant",
};

// Assignable roles when adding a team member.
export const TEAM_ROLES = ["DELIVERY", "TFG", "TAG", "ADMIN"];

// Job lifecycle (matches backend JobStatus enum).
export const JOB_STATUS = {
  CREATED: "CREATED",
  APPROVED: "APPROVED",
  OPEN: "OPEN",
  CLOSED: "CLOSED",
  REJECTED: "REJECTED",
};

// Application pipeline stages (recruitment kanban).
export const PIPELINE_STAGES = [
  "NEW",
  "SCREENING",
  "SHORTLISTED",
  "INTERVIEW",
  "SELECTED",
  "OFFER",
  "HIRED",
];

// Maps the raw backend application statuses onto pipeline stages.
export const STATUS_TO_STAGE = {
  APPLIED: "NEW",
  NEW: "NEW",
  UNDER_REVIEW: "SCREENING",
  SCREENING: "SCREENING",
  SHORTLISTED: "SHORTLISTED",
  INTERVIEW_SCHEDULED: "INTERVIEW",
  L1_CLEARED: "INTERVIEW",
  L2_CLEARED: "INTERVIEW",
  SELECTED: "SELECTED",
  OFFERED: "OFFER",
  OFFER_RELEASED: "OFFER",
  ACCEPTED: "OFFER",
  JOINED: "HIRED",
  HIRED: "HIRED",
  REJECTED: "REJECTED",
};

// Tone keyword per stage — drives pill/accent color via CSS classes.
export const STAGE_TONE = {
  NEW: "info",
  SCREENING: "violet",
  SHORTLISTED: "amber",
  INTERVIEW: "brand",
  SELECTED: "teal",
  OFFER: "pink",
  HIRED: "green",
  REJECTED: "danger",
};
