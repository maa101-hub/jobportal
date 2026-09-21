import { useCallback, useEffect, useMemo, useState } from "react";
import "./MyApplications.css";

import { completeInterviewRound, getInterviewsByApplication, getUserApplications } from "../../services/endpoints";
import { jobService } from "../../services/api";

const SCHEDULED_INTERVIEW_STATUSES = ["SCHEDULED", "INTERVIEW_SCHEDULED"];
const COMPLETED_INTERVIEW_STATUSES = ["COMPLETED", "PENDING_DECISION", "OFFERED", "REJECTED"];

function MyApplications() {
  const [applications, setApplications] = useState([]);
  const [jobDetails, setJobDetails] = useState({});
  const [interviewsMap, setInterviewsMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [userId] = useState(() => {
    const user = JSON.parse(localStorage.getItem("user") || "null");
    const mappedUserId = user?.id ?? user?.userId ?? localStorage.getItem("userId");
    console.log("🔍 DebuG - User from localStorage:", user);
    console.log("🔍 Debug - Mapped userId:", mappedUserId);
    return mappedUserId ? Number(mappedUserId) : null;
  });

  const normalizeApplications = (payload) => {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.data)) return payload.data;
    if (Array.isArray(payload?.applications)) return payload.applications;
    if (Array.isArray(payload?.content)) return payload.content;
    if (Array.isArray(payload?.data?.applications)) return payload.data.applications;
    return [];
  };

  const normalizeInterviews = (payload) => {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.data)) return payload.data;
    if (Array.isArray(payload?.interviews)) return payload.interviews;
    if (Array.isArray(payload?.content)) return payload.content;
    if (Array.isArray(payload?.data?.interviews)) return payload.data.interviews;
    return [];
  };

  const getLatestRoundInterview = (interviews, round) => {
    const filtered = (interviews || [])
      .filter((item) => String(item?.round || "").toUpperCase() === round)
      .sort((a, b) => new Date(b?.scheduledAt || 0) - new Date(a?.scheduledAt || 0));

    return filtered[0] || null;
  };

  const getNextScheduledInterview = (interviews) => {
    const scheduled = (interviews || [])
      .filter((item) =>
        SCHEDULED_INTERVIEW_STATUSES.includes(String(item?.status || "").toUpperCase())
      )
      .sort((a, b) => new Date(a?.scheduledAt || 0) - new Date(b?.scheduledAt || 0));

    return scheduled[0] || null;
  };

  const getInterviewProgressText = (interviews, appStatus) => {
    const l1 = getLatestRoundInterview(interviews, "L1");
    const l2 = getLatestRoundInterview(interviews, "L2");
    const r1 = getLatestRoundInterview(interviews, "R1");

    const isCompleted = (interview) =>
      COMPLETED_INTERVIEW_STATUSES.includes(String(interview?.status || "").toUpperCase());

    const nextScheduled = getNextScheduledInterview(interviews);
    if (nextScheduled) {
      return `${nextScheduled.round} interview scheduled`;
    }

    if (!l1) return "Waiting for L1 schedule";
    if (l1 && isCompleted(l1) && !l2) return "Waiting for second round (L2)";
    if (l2 && isCompleted(l2) && !r1) return "Waiting for third round (HR)";
    if (r1 && isCompleted(r1) && !["OFFERED", "OFFER_RELEASED", "REJECTED", "ACCEPTED", "JOINED"].includes(String(appStatus || "").toUpperCase())) {
      return "All interviews completed. Waiting for company decision";
    }

    return "Company Will Contact You Soon";
  };

  const loadInterviews = useCallback(async (apps) => {
    const map = {};

    for (const app of apps) {
      try {
        const res = await getInterviewsByApplication(app.id);
        map[app.id] = normalizeInterviews(res.data);
      } catch {
        map[app.id] = [];
      }
    }

    setInterviewsMap(map);
  }, []);

  const fetchJobDetails = async (applications) => {
    const details = {};
    
    for (const app of applications) {
      if (!app.jobId) continue;
      
      try {
        const res = await jobService.getJobById(app.jobId);
        details[app.jobId] = res.data;
        console.log(`✅ Fetched job ${app.jobId}:`, res.data);
      } catch (err) {
        console.warn(`⚠️ Could not fetch job ${app.jobId}:`, err.message);
        // Fallback to using jobId if job details unavailable
        details[app.jobId] = { id: app.jobId, title: `Job #${app.jobId}` };
      }
    }
    
    return details;
  };

  const getStage = (status) => {
    const normalized = String(status || "").toUpperCase();

    if (normalized === "APPLIED") return { label: "Applied", tone: "applied" };
    if (["SHORTLISTED", "UNDER_REVIEW"].includes(normalized)) return { label: "In Review", tone: "review" };
    if (["L1_CLEARED", "L2_CLEARED", "INTERVIEW_SCHEDULED"].includes(normalized)) {
      return { label: "Interview Stage", tone: "interview" };
    }
    if (["OFFERED", "OFFER_RELEASED"].includes(normalized)) return { label: "Offer Stage", tone: "offer" };
    if (normalized === "JOINED") return { label: "Joined", tone: "joined" };
    if (normalized === "REJECTED") return { label: "Rejected", tone: "rejected" };

    return { label: normalized || "Unknown", tone: "unknown" };
  };

  const stageCounts = useMemo(() => {
    return applications.reduce(
      (acc, app) => {
        const status = String(app?.status || "").toUpperCase();
        if (status === "APPLIED") acc.applied += 1;
        else if (["SHORTLISTED", "UNDER_REVIEW"].includes(status)) acc.review += 1;
        else if (["L1_CLEARED", "L2_CLEARED", "INTERVIEW_SCHEDULED"].includes(status)) acc.interview += 1;
        else if (["OFFERED", "OFFER_RELEASED"].includes(status)) acc.offer += 1;
        else if (status === "JOINED") acc.joined += 1;
        else if (status === "REJECTED") acc.rejected += 1;
        else acc.other += 1;
        return acc;
      },
      { applied: 0, review: 0, interview: 0, offer: 0, joined: 0, rejected: 0, other: 0 }
    );
  }, [applications]);

  useEffect(() => {
    const loadApplications = async () => {
      setLoading(true);
      setError(null);

      if (!userId || userId <= 0) {
        console.error("❌ Invalid userId:", userId);
        setApplications([]);
        setError("User ID not found. Please login again.");
        setLoading(false);
        return;
      }

      try {
        console.log(`📡 Fetching applications for userId: ${userId}`);
        const res = await getUserApplications(userId);
        console.log("✅ API Response:", res.data);
        
        const normalized = normalizeApplications(res.data);
        console.log("✅ Normalized applications:", normalized);
        
        setApplications(normalized);
        
        // Fetch job details for each application
        if (normalized.length > 0) {
          console.log("📡 Fetching job details for applications...");
          const details = await fetchJobDetails(normalized);
          setJobDetails(details);
          await loadInterviews(normalized);
        } else {
          setInterviewsMap({});
        }
        
        if (normalized.length === 0) {
          console.warn("⚠️ No applications returned from API");
        }
      } catch (err) {
        console.error("❌ Error loading applications:", err);
        setError(`Error loading applications: ${err.message || "Unknown error"}`);
        setApplications([]);
      } finally {
        setLoading(false);
      }
    };

    loadApplications();
  }, [userId, loadInterviews]);

  const handleRefresh = async () => {
    setRefreshing(true);
    setError(null);

    if (!userId || userId <= 0) {
      setError("User ID not found. Please login again.");
      setRefreshing(false);
      return;
    }

    try {
      console.log(`🔄 Refreshing applications for userId: ${userId}`);
      const res = await getUserApplications(userId);
      const normalized = normalizeApplications(res.data);
      
      setApplications(normalized);
      
      // Refresh job details
      if (normalized.length > 0) {
        const details = await fetchJobDetails(normalized);
        setJobDetails(details);
        await loadInterviews(normalized);
      } else {
        setInterviewsMap({});
      }
      
      console.log("✅ Applications refreshed");
    } catch (err) {
      console.error("❌ Error refreshing applications:", err);
      setError(`Error refreshing: ${err.message || "Unknown error"}`);
    } finally {
      setRefreshing(false);
    }
  };

  const handleTakeInterview = async (interviewId) => {
    try {
      await completeInterviewRound(interviewId);
      alert("Interview marked as completed. Admin can now decide clear/reject.");
      await handleRefresh();
    } catch (err) {
      alert(`Failed to complete interview: ${err.message}`);
    }
  };

  return (
    <div className="applications-container">
      <div className="applications-header">
        <div>
          <h2>My Applications</h2>
          <p>Track how many jobs you applied to and current stage of each application.</p>
        </div>

        <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
          <button 
            className="btn-refresh"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            {refreshing ? "Refreshing..." : "🔄 Refresh Status"}
          </button>
          
          <div className="applications-total-card">
            <span>Total Applied</span>
            <strong>{applications.length}</strong>
          </div>
        </div>
      </div>

      {/* Debug Info */}
      <div className="debug-info">
        <p><strong>User ID:</strong> {userId || "Not found"}</p>
        <p><strong>Loading:</strong> {loading ? "Yes" : "No"}</p>
        <p><strong>Applications Count:</strong> {applications.length}</p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="error-message">
          <p>⚠️ {error}</p>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="loading-state">
          <p>Loading your applications...</p>
        </div>
      )}

      {/* Empty or Has Applications */}
      {!loading && (
        <>
          <div className="applications-summary-grid">
            <div className="summary-chip applied">Applied: {stageCounts.applied}</div>
            <div className="summary-chip review">In Review: {stageCounts.review}</div>
            <div className="summary-chip interview">Interview: {stageCounts.interview}</div>
            <div className="summary-chip offer">Offer: {stageCounts.offer}</div>
            <div className="summary-chip joined">Joined: {stageCounts.joined}</div>
            <div className="summary-chip rejected">Rejected: {stageCounts.rejected}</div>
          </div>

          {applications.length === 0 ? (
            <div className="empty-state">
              <h3>No applications found</h3>
              <p>Apply for some jobs first and they will appear here.</p>
            </div>
          ) : (
            <div className="applications-grid">
              {applications.map((app) => {
                const stage = getStage(app.status);
                const job = jobDetails[app.jobId] || {};
                const appInterviews = interviewsMap[app.id] || [];
                const nextScheduled = getNextScheduledInterview(appInterviews);
                const progressText = getInterviewProgressText(appInterviews, app.status);

                return (
                  <div key={app.id} className="application-card">
                    <div className="application-top">
                      <div>
                        <span className="label">Application #{app.id}</span>
                        <h3>{job.title || `Job #${app.jobId}`}</h3>
                        <p className="job-location">{job.location || ""}</p>
                      </div>

                      <span className={`stage-badge stage-${stage.tone}`}>
                        {stage.label}
                      </span>
                    </div>

                    <div className="application-details">
                      <div>
                        <span>Status</span>
                        <strong>{app.status || "UNKNOWN"}</strong>
                      </div>
                      <div>
                        <span>Applied At</span>
                        <strong>{app.appliedAt ? new Date(app.appliedAt).toLocaleDateString() : "N/A"}</strong>
                      </div>
                      <div>
                        <span>Updated At</span>
                        <strong>{app.updatedAt ? new Date(app.updatedAt).toLocaleDateString() : "N/A"}</strong>
                      </div>
                    </div>

                    <div className="interview-progress-box">
                      <span>Interview Progress</span>
                      <strong>{progressText}</strong>
                      {nextScheduled?.scheduledAt && (
                        <p>
                          Scheduled: {new Date(nextScheduled.scheduledAt).toLocaleString()} ({nextScheduled.round})
                        </p>
                      )}
                    </div>

                    {nextScheduled && (
                      <button
                        className="btn-take-interview"
                        onClick={() => handleTakeInterview(nextScheduled.id)}
                      >
                        Take Interview ({nextScheduled.round})
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default MyApplications;