import { userAPI, jobAPI, applicationAPI, offerAPI } from "./api";

/* =========================
   CANDIDATE APIs
========================= */

// Signup
export const candidateSignup = (data) => {
  return userAPI.post("/users/signup", data);
};

// Login
export const candidateLogin = (data) => {
  return userAPI.post("/users/login", data);
};


/* =========================
   COMPANY APIs
========================= */

// Company Register
export const companyRegister = (data) => {
  return userAPI.post("/companies/register", data);
};

// Company Login
export const companyLogin = (data) => {
  return userAPI.post("/companies/login", data);
};

// Company Employee Login (DELIVERY/TFG/TAG/ADMIN)
export const companyEmployeeLogin = (data) => {
  return userAPI.post("/companies/employees/login", data);
};

// Add Employee
export const addEmployee = (companyId, data) => {
  return userAPI.post(`/companies/${companyId}/employees`, data);
};

// Get Employees
export const getEmployees = (companyId) => {
  return userAPI.get(`/companies/${companyId}/employees`);
};

// Delete Employee
export const deleteEmployee = (employeeId) => {
  return userAPI.delete(`/companies/employees/${employeeId}`);
};


/* =========================
   JOB APIs
========================= */

export const createJob = (data) => {
  return jobAPI.post("/api/jobs", data);
};

export const getCompanyJobs = (companyId) => {
  return jobAPI.get(`/api/jobs/company/${companyId}`);
};

/* =========================
   APPLICATION APIs
========================= */

// Apply
export const applyForJob = (data) => {
  return applicationAPI.post("/applications", data);
};

// Get user applications
export const getUserApplications = (userId) => {
  return applicationAPI.get(`/applications/user/${userId}`);
};

// Get job applications
export const getJobApplications = (jobId) => {
  return applicationAPI.get(`/applications/job/${jobId}`); // ✅ FIXED
};

// Update status
export const updateApplicationStatus = (id, status) => {
  return applicationAPI.put(
    `/applications/${id}/status?status=${status}` // ✅ FIXED
  );
};

// Schedule interview
export const scheduleInterview = (data) => {
  return applicationAPI.post("/interviews", {
    applicationId: data.applicationId,
    round: data.round,
    scheduledAt: data.scheduledAt,
  });
};

// Get interviews by application
export const getInterviewsByApplication = (applicationId) => {
  return applicationAPI.get(`/interviews/application/${applicationId}`);
};

// Add interview feedback (no rating - just notes)
export const addFeedback = (interviewId, feedback) => {
  return applicationAPI.put(`/interviews/${interviewId}/feedback?feedback=${encodeURIComponent(feedback)}`);
};

// Candidate marks scheduled interview as completed
export const completeInterviewRound = (interviewId) => {
  return applicationAPI.put(`/interviews/${interviewId}/complete`);
};

// Offer candidate
export const offerCandidate = (interviewId) => {
  return applicationAPI.put(`/interviews/${interviewId}/offer`);
};

// Reject candidate
export const rejectCandidate = (interviewId, reason = "") => {
  return applicationAPI.put(`/interviews/${interviewId}/reject?reason=${encodeURIComponent(reason)}`);
};


/* =========================
   OFFER APIs
========================= */

export const createOffer = (data) => {
  return offerAPI.post("/offers", data);
};

export const getOffer = (applicationId) => {
  return offerAPI.get(`/offers/application/${applicationId}`);
};

export const acceptOffer = (offerId) => {
  return offerAPI.put(`/offers/${offerId}/accept`);
};

export const joinOffer = (offerId, joiningDate) => {
  const query = joiningDate ? `?joiningDate=${encodeURIComponent(joiningDate)}` : "";
  return offerAPI.put(`/offers/${offerId}/join${query}`);
};

// Offer-service helpers (port 8083)
export const getOfferByApplication = (applicationId) => {
  return offerAPI.get(`/offers/application/${applicationId}`);
};

export const acceptOfferById = (offerId) => {
  return offerAPI.put(`/offers/${offerId}/accept`);
};

export const joinOfferById = (offerId) => {
  return offerAPI.put(`/offers/${offerId}/join`);
};

export const joinOfferByIdWithDate = (offerId, joiningDate) => {
  const query = joiningDate ? `?joiningDate=${encodeURIComponent(joiningDate)}` : "";
  return offerAPI.put(`/offers/${offerId}/join${query}`);
};

export const rejectOfferById = (offerId) => {
  return offerAPI.put(`/offers/${offerId}/reject`);
};