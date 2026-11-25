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
  const [selectedJob, setSelectedJob] = useState(null);
  const [form, setForm] = useState(() => {
    const user = JSON.parse(localStorage.getItem("user") || "null");
    return { fullName: user?.name || "", email: user?.email || "", phone: "", experience: "", education: "", resumeUrl: "", resumeText: "", coverLetter: "" };
  });
  const [submitting, setSubmitting] = useState(false);
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
    const timer = setTimeout(() => { void fetchJobs(); }, 0);
    return () => clearTimeout(timer);
  }, [fetchJobs]);

  useEffect(() => {
    const timer = setTimeout(() => { void fetchApplications(); }, 0);
    return () => clearTimeout(timer);
  }, [fetchApplications]);

  const hasApplied = (jobId) => {
    return applications.some((app) => app.jobId === jobId);
  };

  const handleApply = async (e) => {
    e.preventDefault();
    if (!userId) {
      toast.error("Please sign in again to apply.");
      return;
    }
    if (!selectedJob || !form.fullName.trim() || !form.email.trim() || !form.phone.trim() || !form.experience.trim() || !form.education.trim()) {
      toast.error("Please complete all required application fields.");
      return;
    }

    try {
      setSubmitting(true);
      await applyForJob({ userId, jobId: selectedJob.id, ...form, resumeUrl: form.resumeUrl || "resume.pdf" });
      toast.success("Application submitted successfully.");
      setSelectedJob(null);
      await fetchApplications();
    } catch (err) {
      console.log(err);
      toast.error(err.userMessage || "Couldn't submit your application.");
    } finally {
      setSubmitting(false);
    }
  };

  const updateForm = (key) => (e) => setForm((current) => ({ ...current, [key]: e.target.value }));

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
        <>
        {selectedJob && (
          <form className="application-form" onSubmit={handleApply}>
            <div className="application-form-head">
              <div><h3>Apply for {selectedJob.title}</h3><p>Share the details the hiring team needs for an initial review.</p></div>
              <button type="button" className="ht-btn-ghost" onClick={() => setSelectedJob(null)}>Cancel</button>
            </div>
            <div className="application-form-grid">
              <label>Full name *<input value={form.fullName} onChange={updateForm("fullName")} required /></label>
              <label>Email *<input type="email" value={form.email} onChange={updateForm("email")} required /></label>
              <label>Phone *<input type="tel" value={form.phone} onChange={updateForm("phone")} required /></label>
              <label>Experience *<input placeholder="e.g. 3 years" value={form.experience} onChange={updateForm("experience")} required /></label>
              <label>Education *<input placeholder="e.g. B.Tech Computer Science" value={form.education} onChange={updateForm("education")} required /></label>
              <label>Resume link<input value={form.resumeUrl} onChange={updateForm("resumeUrl")} placeholder="https://…" /></label>
              <label className="application-form-wide">Resume text <span className="form-help">Paste your resume summary so HireTrack can calculate a free match score.</span><textarea rows="5" value={form.resumeText} onChange={updateForm("resumeText")} placeholder="Skills, projects, tools, and achievements..." /></label>
              <label className="application-form-wide">Cover letter<textarea rows="4" value={form.coverLetter} onChange={updateForm("coverLetter")} placeholder="Tell the company why this role is a good fit." /></label>
            </div>
            <div className="application-form-actions"><button type="submit" disabled={submitting}>{submitting ? "Submitting…" : "Submit application"}</button></div>
          </form>
        )}
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
                  <button className="btn-apply" onClick={() => setSelectedJob(job)}>
                    Apply now
                  </button>
                )}
              </article>
            );
          })}
        </div>
        </>
      )}
    </div>
  );
}

export default Jobs;
