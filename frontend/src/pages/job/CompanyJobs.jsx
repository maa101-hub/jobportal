import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./CompanyJobs.css";

import { jobService } from "../../services/api";

const getStoredUser = () => JSON.parse(localStorage.getItem("user") || "null");

const normalizeRole = (role) => String(role || "").toUpperCase();

const getStatusClass = (status) => {
  const normalized = String(status || "UNKNOWN").toLowerCase();
  return `status-badge status-${normalized}`;
};

function CompanyJobs() {
  const navigate = useNavigate();
  const user = useMemo(() => getStoredUser(), []);
  const role = normalizeRole(user?.role);
  const rawCompanyId = user?.companyId ?? user?.id ?? localStorage.getItem("companyId");
  const parsedCompanyId = Number(rawCompanyId);
  const companyId = Number.isFinite(parsedCompanyId) && parsedCompanyId > 0 ? parsedCompanyId : null;

  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const [message, setMessage] = useState("");

  const normalizeJobs = (payload) => {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.data)) return payload.data;
    if (Array.isArray(payload?.jobs)) return payload.jobs;
    if (Array.isArray(payload?.content)) return payload.content;
    if (Array.isArray(payload?.data?.jobs)) return payload.data.jobs;
    return [];
  };

  const fetchJobs = async () => {
    try {
      setLoading(true);
      setMessage("");

      const shouldUseCompanyJobs = role === "DELIVERY" && companyId;
      const res = shouldUseCompanyJobs
        ? await jobService.getCompanyJobs(companyId)
        : await jobService.getAllJobs();

      const fetchedJobs = normalizeJobs(res.data);

      const visibleJobs =
        role === "TFG"
          ? fetchedJobs.filter((job) => String(job.status || "").toUpperCase() === "CREATED")
          : role === "TAG"
            ? fetchedJobs.filter((job) => ["APPROVED", "OPEN"].includes(String(job.status || "").toUpperCase()))
            : fetchedJobs;

      if (role === "ADMIN" && companyId && visibleJobs.length === 0) {
        const fallbackRes = await jobService.getAllJobs();
        const fallbackJobs = normalizeJobs(fallbackRes.data);
        setJobs(fallbackJobs);
        if (fallbackJobs.length > 0) {
          setMessage("Company-wise jobs empty mile. Showing all jobs for ADMIN.");
        }
      } else {
        setJobs(visibleJobs);
      }
    } catch (err) {
      console.log(err);
      setMessage("Jobs load nahi ho paye. Backend port/route check karo.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const refreshJobs = async () => {
    await fetchJobs();
  };

  const handleApprove = async (jobId) => {
    const approvedBy = user?.id ?? localStorage.getItem("userId");

    if (!approvedBy) {
      alert("ApprovedBy user ID not found. Please login again.");
      return;
    }

    try {
      setActionLoading(`approve-${jobId}`);
      await jobService.approveJob(jobId, approvedBy);
      alert("Job Approved Successfully");
      await refreshJobs();
    } catch (err) {
      console.log(err);
      alert("Job approve failed");
    } finally {
      setActionLoading(null);
    }
  };

  const handleClose = async (jobId) => {
    try {
      setActionLoading(`close-${jobId}`);
      await jobService.closeJob(jobId);
      alert("Job Closed Successfully");
      await refreshJobs();
    } catch (err) {
      console.log(err);
      alert("Job close failed");
    } finally {
      setActionLoading(null);
    }
  };

  const canApprove = role === "ADMIN" || role === "TFG";
  const canClose = role === "ADMIN" || role === "TAG";

  const handleViewApplications = (jobId) => {
    navigate(`/company/applications?jobId=${jobId}`);
  };

  return (
    <div className="company-jobs-page">
      <div className="company-jobs-shell">
        <div className="company-jobs-header">
          <div>
            <div className="eyebrow">Role-based Job Flow</div>
            <h2>Company Jobs</h2>
            <p>
              {role === "DELIVERY"
                ? "Create jobs and track their status."
                : role === "TFG"
                  ? "Approve pending jobs only."
                  : role === "TAG"
                    ? "See approved/open jobs and close them when needed."
                    : "Manage approve and close actions for all jobs."}
            </p>
          </div>

          <div className="header-stats">
            <div>
              <span>Role</span>
              <strong>{role || "UNKNOWN"}</strong>
            </div>
            <div>
              <span>Jobs</span>
              <strong>{jobs.length}</strong>
            </div>
          </div>
        </div>

        {message && <div className="info-banner">{message}</div>}

        <div className="status-flow">
          <div className="flow-step">
            <span className="step-dot created" />
            <div>
              <strong>Created</strong>
              <p>Job draft created by Delivery team.</p>
            </div>
          </div>
          <div className="flow-step">
            <span className="step-dot approved" />
            <div>
              <strong>Approved</strong>
                <p>TFG/Admin can approve the job.</p>
            </div>
          </div>
          <div className="flow-step">
            <span className="step-dot closed" />
            <div>
              <strong>Closed</strong>
                <p>TAG/Admin can close hiring for a job.</p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="empty-state">Loading jobs...</div>
        ) : jobs.length === 0 ? (
          <div className="empty-state">
            <h3>No jobs found</h3>
            <p>Try creating a job first or check the backend response.</p>
          </div>
        ) : (
          <div className="jobs-grid">
            {jobs.map((job) => {
              const status = String(job.status || "UNKNOWN").toUpperCase();
              const isApproving = actionLoading === `approve-${job.id}`;
              const isClosing = actionLoading === `close-${job.id}`;
              const showApprove = canApprove && ["CREATED", "REJECTED"].includes(status);
              const showClose = canClose && ["APPROVED", "OPEN"].includes(status);

              return (
                <div key={job.id} className="job-card">
                  <div className="job-card-top">
                    <div>
                      <h3>{job.title}</h3>
                      <p className="job-meta">Job ID: {job.id}</p>
                    </div>
                    <span className={getStatusClass(status)}>{status}</span>
                  </div>

                  <p className="job-description">{job.description}</p>

                  <div className="job-details">
                    <div>
                      <span>Location</span>
                      <strong>{job.location || "N/A"}</strong>
                    </div>
                    <div>
                      <span>Tech Stack</span>
                      <strong>{job.techStack || "N/A"}</strong>
                    </div>
                    <div>
                      <span>Experience</span>
                      <strong>{job.experience || "N/A"}</strong>
                    </div>
                  </div>

                  <div className="job-extra-actions">
                    <button
                      className="action-btn view-app-btn"
                      onClick={() => handleViewApplications(job.id)}
                    >
                      View Applications
                    </button>
                  </div>

                  {(showApprove || showClose) && (
                    <div className="job-actions">
                      {showApprove && (
                        <button
                          className="action-btn approve-btn"
                          onClick={() => handleApprove(job.id)}
                          disabled={isApproving}
                        >
                          {isApproving ? "Approving..." : "Approve Job"}
                        </button>
                      )}

                      {showClose && (
                        <button
                          className="action-btn close-btn"
                          onClick={() => handleClose(job.id)}
                          disabled={isClosing}
                        >
                          {isClosing ? "Closing..." : "Close Job"}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default CompanyJobs;