import { useCallback, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import "./Applications.css";

import {
  getInterviewsByApplication,
  getJobApplications,
  offerCandidate,
  rejectCandidate,
  scheduleInterview,
  updateApplicationStatus,
} from "../../services/endpoints";

const ROUND_ORDER = ["L1", "L2", "R1"];
const COMPLETED_INTERVIEW_STATUSES = ["COMPLETED", "PENDING_DECISION", "OFFERED", "REJECTED"];
const SCHEDULED_INTERVIEW_STATUSES = ["SCHEDULED", "INTERVIEW_SCHEDULED"];

function Applications() {
  const location = useLocation();
  const [jobId, setJobId] = useState("");
  const [applications, setApplications] = useState([]);
  const [interviewsMap, setInterviewsMap] = useState({});
  const [scheduleAtByApp, setScheduleAtByApp] = useState({});
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [searchedJobId, setSearchedJobId] = useState("");

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

  const isCompletedInterview = (interview) =>
    COMPLETED_INTERVIEW_STATUSES.includes(String(interview?.status || "").toUpperCase());

  const isScheduledInterview = (interview) =>
    SCHEDULED_INTERVIEW_STATUSES.includes(String(interview?.status || "").toUpperCase());

  const getFinalDecisionRound = (appInterviews) => {
    const r1 = getLatestRoundInterview(appInterviews, "R1");
    if (r1 && isCompletedInterview(r1)) return { round: "R1", interview: r1 };
    return null;
  };

  const getNextRoundToSchedule = (appInterviews) => {
    const l1 = getLatestRoundInterview(appInterviews, "L1");
    const l2 = getLatestRoundInterview(appInterviews, "L2");
    const r1 = getLatestRoundInterview(appInterviews, "R1");

    if (!l1) return "L1";
    if (!isCompletedInterview(l1)) return null;

    if (!l2) return "L2";
    if (!isCompletedInterview(l2)) return null;

    if (!r1) return "R1";
    if (!isCompletedInterview(r1)) return null;

    return null;
  };

  const getFlowLabel = (app, appInterviews) => {
    const nextRound = getNextRoundToSchedule(appInterviews);
    const finalDecision = getFinalDecisionRound(appInterviews);
    const normalizedStatus = String(app?.status || "").toUpperCase();

    if (normalizedStatus === "REJECTED") return "Rejected";
    if (["OFFERED", "OFFER_RELEASED"].includes(normalizedStatus)) return "Offer Sent";
    if (["ACCEPTED", "JOINED"].includes(normalizedStatus)) return normalizedStatus;

    if (finalDecision?.round === "R1") return "All interviews completed - offer or reject";

    const scheduledRound = ROUND_ORDER.find((round) => {
      const interview = getLatestRoundInterview(appInterviews, round);
      return interview && isScheduledInterview(interview);
    });

    if (scheduledRound) return `${scheduledRound} interview scheduled`;
    if (nextRound === "L2") return "L1 completed - schedule second round (L2)";
    if (nextRound === "R1") return "L2 completed - schedule third round (HR)";
    return "Ready for first round (L1)";
  };

  const loadInterviewsForApplications = useCallback(async (apps) => {
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

  const fetchApplications = useCallback(async (overrideJobId) => {
    const effectiveJobId = overrideJobId ?? jobId;
    const normalizedJobId = Number(String(effectiveJobId).trim());

    if (!normalizedJobId || normalizedJobId <= 0) {
      alert("Please enter valid Job ID");
      return;
    }

    try {
      setLoading(true);
      const res = await getJobApplications(normalizedJobId);
      const normalized = normalizeApplications(res.data);
      setApplications(normalized);
      await loadInterviewsForApplications(normalized);
      setSearchedJobId(String(normalizedJobId));
      setJobId(String(normalizedJobId));
    } catch (err) {
      console.log(err);
      alert("Failed to fetch applications");
    } finally {
      setLoading(false);
    }
  }, [jobId, loadInterviewsForApplications]);

  const handleJobIdKeyDown = (e) => {
    if (e.key === "Enter") {
      fetchApplications();
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const prefilledJobId = params.get("jobId");

    if (prefilledJobId) {
      const deferredFetch = setTimeout(() => {
        fetchApplications(prefilledJobId);
      }, 0);

      return () => clearTimeout(deferredFetch);
    }
  }, [location.search, fetchApplications]);

  const handleStatusUpdate = async (id, status) => {
    try {
      setActionLoading(true);
      await updateApplicationStatus(id, status);
      alert(`Status updated to ${status}`);
      if (jobId) {
        await fetchApplications();
      }
    } catch (err) {
      console.log(err);
      alert("Update failed");
    } finally {
      setActionLoading(false);
    }
  };

  const handleScheduleRound = async (appId, nextRound) => {
    const scheduledAt = scheduleAtByApp[appId];
    if (!scheduledAt) {
      alert("Please select schedule date and time first");
      return;
    }

    try {
      setActionLoading(true);
      await scheduleInterview({
        applicationId: appId,
        round: nextRound,
        scheduledAt,
      });
      await updateApplicationStatus(appId, "INTERVIEW_SCHEDULED");
      alert(`${nextRound} interview scheduled`);
      setScheduleAtByApp((prev) => ({ ...prev, [appId]: "" }));
      await fetchApplications();
    } catch (error) {
      console.log(error);
      alert("Failed to schedule interview");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRoundDecision = async (appId, round, interviewId, decision) => {
    try {
      setActionLoading(true);

      if (decision === "REJECT") {
        if (round === "R1") {
          await rejectCandidate(interviewId, "Rejected after final HR round");
        } else {
          await updateApplicationStatus(appId, "REJECTED");
        }
        alert("Candidate rejected");
      }

      if (decision === "CLEAR") {
        if (round === "L1") {
          await updateApplicationStatus(appId, "L1_CLEARED");
          alert("L1 cleared. Schedule L2 next.");
        }
        if (round === "L2") {
          await updateApplicationStatus(appId, "L2_CLEARED");
          alert("L2 cleared. Schedule HR (R1) next.");
        }
      }

      if (decision === "OFFER") {
        await offerCandidate(interviewId);
        alert("Offer sent to candidate");
      }

      await fetchApplications();
    } catch (error) {
      console.log(error);
      alert("Action failed");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="applications-page">
      <div className="applications-shell">
        <div className="applications-header">
          <div>
            <h2>Applications Management</h2>
            <p>Search by Job ID and manage candidate applications.</p>
          </div>

          <div className="applications-count">
            <span className="count-label">Results</span>
            <strong>{applications.length}</strong>
          </div>
        </div>

        <div className="search-card">
          <label htmlFor="jobId">Job ID</label>
          <div className="search-box">
            <input
              id="jobId"
              type="text"
              inputMode="numeric"
              placeholder="Enter Job ID to search"
              value={jobId}
              onChange={(e) => setJobId(e.target.value)}
              onKeyDown={handleJobIdKeyDown}
            />
            <button onClick={fetchApplications} disabled={loading}>
              {loading ? "Searching..." : "Search"}
            </button>
          </div>
          <div className="jobid-preview">
            Typed Job ID: <strong>{jobId || "—"}</strong>
          </div>
        </div>

        {searchedJobId && (
          <div className="search-summary">
            Showing applications for Job ID: <b>{searchedJobId}</b>
          </div>
        )}

        {applications.length === 0 ? (
          <div className="empty-state">
            <h3>{jobId ? "No applications found" : "Search applications"}</h3>
            <p>
              {jobId
                ? "No candidate has applied for this job yet."
                : "Enter a Job ID above to load the list."}
            </p>
          </div>
        ) : (
          <div className="applications-grid">
            {applications.map((app) => {
              const normalizedStatus = String(app.status || "").toUpperCase();
              const isRejected = normalizedStatus === "REJECTED";
              const isShortlistedOrBeyond = [
                "SHORTLISTED",
                "INTERVIEW_SCHEDULED",
                "L1_CLEARED",
                "L2_CLEARED",
                "OFFERED",
                "OFFER_RELEASED",
                "ACCEPTED",
                "JOINED",
              ].includes(normalizedStatus);

              return (
              <div key={app.id} className="application-card">
                <div className="card-top">
                  <div>
                    <h3>Application #{app.id}</h3>
                    <p className="muted">Candidate User ID: {app.userId}</p>
                  </div>
                  <span className={`status-badge status-${String(app.status || "").toLowerCase()}`}>
                    {app.status || "UNKNOWN"}
                  </span>
                </div>

                <div className="card-details">
                  <div>
                    <span>Job ID</span>
                    <strong>{app.jobId ?? app.job?.id ?? Number(jobId)}</strong>
                  </div>
                  <div>
                    <span>Resume</span>
                    <strong>{app.resumeUrl || "Not provided"}</strong>
                  </div>
                </div>

                <div className="workflow-note">
                  <span>Interview Flow</span>
                  <strong>{getFlowLabel(app, interviewsMap[app.id] || [])}</strong>
                </div>

                {(() => {
                  const appInterviews = interviewsMap[app.id] || [];
                  const nextRound = getNextRoundToSchedule(appInterviews);
                  const finalDecision = getFinalDecisionRound(appInterviews);

                  return (
                    <>
                      {!finalDecision && nextRound && (
                        <div className="inline-actions">
                          <label>Schedule {nextRound}</label>
                          <input
                            type="datetime-local"
                            value={scheduleAtByApp[app.id] || ""}
                            onChange={(e) =>
                              setScheduleAtByApp((prev) => ({
                                ...prev,
                                [app.id]: e.target.value,
                              }))
                            }
                          />
                          <button
                            className="btn-schedule-round"
                            onClick={() => handleScheduleRound(app.id, nextRound)}
                            disabled={actionLoading || isRejected}
                          >
                            Schedule {nextRound}
                          </button>
                        </div>
                      )}

                      {finalDecision && finalDecision.round === "R1" && (
                        <div className="decision-row">
                          <button
                            className="btn-offer"
                            onClick={() =>
                              handleRoundDecision(
                                app.id,
                                "R1",
                                finalDecision.interview.id,
                                "OFFER"
                              )
                            }
                            disabled={actionLoading || isRejected}
                          >
                            Offer
                          </button>
                          <button
                            className="btn-reject"
                            onClick={() =>
                              handleRoundDecision(
                                app.id,
                                "R1",
                                finalDecision.interview.id,
                                "REJECT"
                              )
                            }
                            disabled={actionLoading || isRejected}
                          >
                            Reject
                          </button>
                        </div>
                      )}
                    </>
                  );
                })()}

                <div className="buttons">
                  <button
                    className="btn-shortlist"
                    onClick={() => handleStatusUpdate(app.id, "SHORTLISTED")}
                    disabled={actionLoading || isRejected || isShortlistedOrBeyond}
                  >
                    Shortlist
                  </button>
                  <button
                    className="btn-reject"
                    onClick={() => handleStatusUpdate(app.id, "REJECTED")}
                    disabled={actionLoading || isRejected}
                  >
                    Reject
                  </button>
                </div>
              </div>
            );})}
          </div>
        )}
      </div>
    </div>
  );
}

export default Applications;
