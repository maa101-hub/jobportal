import axios from "axios";

// ─── Axios Instances ────────────────────────────────────────────────────────

export const userAPI = axios.create({
  baseURL: "http://localhost:8091",
  headers: { "Content-Type": "application/json" },
});

export const jobAPI = axios.create({
  baseURL: "http://localhost:8092",
  headers: { "Content-Type": "application/json" },
});

export const applicationAPI = axios.create({
  baseURL: "http://localhost:8093",
  headers: { "Content-Type": "application/json" },
});

export const offerAPI = axios.create({
  baseURL: "http://localhost:8083",
  headers: { "Content-Type": "application/json" },
});

// ─── Request Interceptor (attach token if present) ──────────────────────────

const attachToken = (config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
};

[userAPI, jobAPI, applicationAPI, offerAPI].forEach((instance) => {
  instance.interceptors.request.use(attachToken, (error) =>
    Promise.reject(error)
  );
});

// ─── Response Interceptor (global error handling) ───────────────────────────

const handleResponseError = (error) => {
  if (error.response) {
    console.error(
      `[API Error] ${error.response.status}: ${error.response.data?.message || error.message}`
    );
  } else {
    console.error("[API Error] Network error:", error.message);
  }
  return Promise.reject(error);
};

[userAPI, jobAPI, applicationAPI, offerAPI].forEach((instance) => {
  instance.interceptors.response.use((res) => res, handleResponseError);
});

// ─── User Service Endpoints ─────────────────────────────────────────────────

export const userService = {
  login: (credentials) => userAPI.post("/users/login", credentials),
  signup: (userData) => userAPI.post("/users/signup", userData),
  getUserById: (id) => userAPI.get(`/users/${id}`),
  getAllUsers: () => userAPI.get("/users"),
};

// ─── Job Service Endpoints ──────────────────────────────────────────────────

export const jobService = {
  getAllJobs: () => jobAPI.get("/api/jobs"),
  getCompanyJobs: (companyId) => jobAPI.get(`/api/jobs/company/${companyId}`),
  getJobById: (id) => jobAPI.get(`/api/jobs/${id}`),
  createJob: (jobData) => jobAPI.post("/api/jobs", jobData),
  updateJob: (id, jobData) => jobAPI.put(`/api/jobs/${id}`, jobData),
  approveJob: (jobId, approvedBy) =>
    jobAPI.put(`/api/jobs/${jobId}/approve/${approvedBy}`),
  closeJob: (jobId) => jobAPI.put(`/api/jobs/${jobId}/close`),
  deleteJob: (id) => jobAPI.delete(`/api/jobs/${id}`),
};

// ─── Application Service Endpoints ─────────────────────────────────────────

export const applicationService = {
  applyForJob: (applicationData) =>
    applicationAPI.post("/applications", applicationData),
  getApplicationsByUser: (userId) =>
    applicationAPI.get(`/applications/user/${userId}`),
  getAllApplications: () => applicationAPI.get("/applications"),
  getApplicationsByJob: (jobId) =>
    applicationAPI.get(`/applications/job/${jobId}`),
  updateApplicationStatus: (id, status) =>
    applicationAPI.put(`/applications/${id}/status?status=${status}`),
  scheduleInterview: (interviewData) =>
    applicationAPI.post("/interviews", interviewData),
  getInterviewsByApplication: (applicationId) =>
    applicationAPI.get(`/interviews/application/${applicationId}`),
  addFeedback: (interviewId, feedback) =>
    applicationAPI.put(`/interviews/${interviewId}/feedback?feedback=${encodeURIComponent(feedback)}`),
};

// ─── Offer Service Endpoints ────────────────────────────────────────────────

export const offerService = {
  createOffer: (offerData) => offerAPI.post("/offers", offerData),
  getOfferByApplication: (applicationId) =>
    offerAPI.get(`/offers/application/${applicationId}`),
  acceptOffer: (id) => offerAPI.put(`/offers/${id}/accept`),
  rejectOffer: (id) => offerAPI.put(`/offers/${id}/reject`),
  joinOffer: (id, joiningDate) => {
    const query = joiningDate ? `?joiningDate=${encodeURIComponent(joiningDate)}` : "";
    return offerAPI.put(`/offers/${id}/join${query}`);
  },
};