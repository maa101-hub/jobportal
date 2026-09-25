import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Jobs.css";
import { jobService } from "../../services/api";
import { applyForJob, getUserApplications } from "../../services/endpoints";
import { normalizeList } from "../../utils/helpers";
import { useToast } from "../../components/Toast/ToastContext";

// Statuses a candidate is allowed to see / act on.
const PUBLISHED = ["APPROVED", "OPEN"];
const CLOSED = ["CLOSED"];

function Jobs() {
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const navigate = useNavigate();
  const toast = useToast();

  const [userId] = useState(() => {
    const user = JSON.parse(localStorage.getItem("user") || "null");
    const mappedUserId = user?.id ?? user?.userId ?? localStorage.getItem("userId");
    return mappedUserId ? Number(mappedUserId) : null;
  });

  const fetchJobs = useCallback(async () => {
    try {
      const res = await jobService.getAllJobs();
      // Candidates only see published or closed jobs — never drafts/in-review.
      const visible = normalizeList(res.data).filter((j) =>
        [...PUBLISHED, ...CLOSED].includes(String(j.status || "").toUpperCase())
      );
      setJobs(visible);
    } catch (err) {
      console.log("Error fetching jobs:", err);
    }
  }, []);

  const fetchApplications = useCallback(async () => {
    if (!userId) return;
    try {
      const res = await getUserApplications(userId);
      const apps = Array.isArray(res.data) ? res.data : res.data?.data || [];
      setApplications(apps);
    } catch (err) {
      console.log("Error fetching applications:", err);
    }
  }, [userId]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const hasApplied = (jobId) => {
    return applications.some((app) => app.jobId === jobId);
  };

  const handleApply = async (jobId) => {
    if (!userId) {
      toast.error("Please sign in again to apply.");
      return;
    }

    try {
      await applyForJob({ userId, jobId, resumeUrl: "resume.pdf" });
      toast.success("Applied successfully");
      await fetchApplications();
    } catch (err) {
      console.log(err);
      toast.error("Couldn't submit your application.");
    }
  };

  const handleViewApplication = () => {
    navigate("/my-applications");
  };

  return (
    <div className="jobs-container">
      <header className="jobs-header">
        <div>
          <h2>Available Jobs</h2>
          <p>Browse open roles and apply in one click.</p>
        </div>
        <span className="jobs-count">{jobs.length} open</span>
      </header>

      {jobs.length === 0 ? (
        <div className="jobs-empty">
          <div className="jobs-empty-mark" aria-hidden="true" />
          <h3>No open roles right now</h3>
          <p>Check back soon — new positions are posted regularly.</p>
        </div>
      ) : (
        <div className="jobs-grid">
          {jobs.map((job) => {
            const applied = hasApplied(job.id);
            const isClosed = CLOSED.includes(String(job.status || "").toUpperCase());
            return (
              <article key={job.id} className={`job-card${isClosed ? " is-closed" : ""}`}>
                <div className="job-card-top">
                  <h3>{job.title}</h3>
                  {isClosed ? (
                    <span className="job-closed-tag">Closed</span>
                  ) : applied ? (
                    <span className="job-applied-tag">Applied</span>
                  ) : null}
                </div>

                <p className="job-desc">{job.description}</p>

                {job.location && (
                  <div className="job-meta">
                    <span className="job-meta-label">Location</span>
                    <span className="job-meta-value">{job.location}</span>
                  </div>
                )}

                {isClosed ? (
                  <button className="btn-closed" disabled title="This role is no longer accepting applications">
                    Closed for this role
                  </button>
                ) : applied ? (
                  <button className="btn-view-application" onClick={handleViewApplication}>
                    View my application
                  </button>
                ) : (
                  <button className="btn-apply" onClick={() => handleApply(job.id)}>
                    Apply now
                  </button>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default Jobs;