import axios from "axios";

// ─── Single Backend (Monolith) ──────────────────────────────────────────────
// The former microservices (user/job/application/offer) now live in one Spring
// Boot app served from a single origin. Override with VITE_API_BASE_URL when
// deploying behind a different host.

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

const api = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
});

// Backwards-compatible aliases so existing endpoint/page code keeps working.
// All four now point at the same monolith instance.
export const userAPI = api;
export const jobAPI = api;
export const applicationAPI = api;
export const offerAPI = api;

// ─── Request Interceptor (attach token if present) ──────────────────────────

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response Interceptor (global error handling) ───────────────────────────

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response) {
      const data = error.response.data;
      const serverMessage =
        data?.message ||
        (data?.fieldErrors ? Object.values(data.fieldErrors)[0] : null);
      console.error(
        `[API Error] ${error.response.status}: ${serverMessage || error.message}`
      );
      // Attach the server message so page-level catch blocks can show it.
      error.userMessage = serverMessage || `Request failed (${error.response.status})`;

      // On 401 (auth expired or missing token), clear stale session and
      // redirect to login so the user isn't stuck on a broken page.
      if (error.response.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("role");
        localStorage.removeItem("userId");
        localStorage.removeItem("companyId");
        if (!window.location.pathname.startsWith("/login")) {
          window.location.href = "/login";
        }
      }
    } else {
      console.error("[API Error] Network error:", error.message);
      error.userMessage = "Network error — please check your connection.";
    }
    return Promise.reject(error);
  }
);

export default api;

// ─── User Service Endpoints ─────────────────────────────────────────────────

export const userService = {
  login: (credentials) => api.post("/users/login", credentials),
  signup: (userData) => api.post("/users/signup", userData),
  getUserById: (id) => api.get(`/users/${id}`),
  getAllUsers: () => api.get("/users"),
};

// ─── Job Service Endpoints ──────────────────────────────────────────────────

export const jobService = {
  getAllJobs: () => api.get("/api/jobs"),
  getCompanyJobs: (companyId) => api.get(`/api/jobs/company/${companyId}`),
  getJobById: (id) => api.get(`/api/jobs/${id}`),
  createJob: (jobData) => api.post("/api/jobs", jobData),
  updateJob: (id, jobData) => api.put(`/api/jobs/${id}`, jobData),
  approveJob: (jobId, approvedBy) =>
    api.put(`/api/jobs/${jobId}/approve/${approvedBy}`),
  closeJob: (jobId) => api.put(`/api/jobs/${jobId}/close`),
  rejectJob: (jobId) => api.put(`/api/jobs/${jobId}/reject`),
  deleteJob: (id) => api.delete(`/api/jobs/${id}`),
};

// ─── Application Service Endpoints ─────────────────────────────────────────

export const applicationService = {
  applyForJob: (applicationData) => api.post("/applications", applicationData),
  getApplicationsByUser: (userId) => api.get(`/applications/user/${userId}`),
  getAllApplications: () => api.get("/applications"),
  getApplicationsByJob: (jobId) => api.get(`/applications/job/${jobId}`),
  getApplicationsByJobIds: (jobIds) =>
    api.get(`/applications/batch?jobIds=${jobIds.join(",")}`),
  updateApplicationStatus: (id, status) =>
    api.put(`/applications/${id}/status?status=${status}`),
  scheduleInterview: (interviewData) => api.post("/interviews", interviewData),
  getInterviewsByApplication: (applicationId) =>
    api.get(`/interviews/application/${applicationId}`),
  addFeedback: (interviewId, feedback) =>
    api.put(`/interviews/${interviewId}/feedback?feedback=${encodeURIComponent(feedback)}`),
};

// ─── Offer Service Endpoints ────────────────────────────────────────────────

export const offerService = {
  createOffer: (offerData) => api.post("/offers", offerData),
  getOfferByApplication: (applicationId) =>
    api.get(`/offers/application/${applicationId}`),
  acceptOffer: (id) => api.put(`/offers/${id}/accept`),
  rejectOffer: (id) => api.put(`/offers/${id}/reject`),
  joinOffer: (id, joiningDate) => {
    const query = joiningDate ? `?joiningDate=${encodeURIComponent(joiningDate)}` : "";
    return api.put(`/offers/${id}/join${query}`);
  },
};
