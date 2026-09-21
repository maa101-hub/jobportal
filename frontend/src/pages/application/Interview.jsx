import { useState } from "react";
import "./Interview.css";
import { getJobApplications, scheduleInterview, addFeedback } from "../../services/endpoints";
import { jobService } from "../../services/api";

function Interview() {
  const [applications, setApplications] = useState([]);
  const [interviews, setInterviews] = useState({});
  const [loading, setLoading] = useState(false);
  const [jobId, setJobId] = useState("");
  const [selectedApp, setSelectedApp] = useState(null);
  const [selectedInterview, setSelectedInterview] = useState(null);

  const [scheduleForm, setScheduleForm] = useState({
    applicationId: "",
    round: "",
    scheduledAt: "",
  });

  const [feedbackForm, setFeedbackForm] = useState({
    interviewId: "",
    feedback: "",
  });

  const [decisionForm, setDecisionForm] = useState({
    interviewId: "",
    decision: "", // OFFER or REJECTED
    rejectionReason: "",
  });

  // Fetch applications for a specific job
  const fetchShortlistedCandidates = async () => {
    if (!jobId || jobId <= 0) {
      alert("Please enter a valid Job ID");
      return;
    }

    setLoading(true);
    try {
      console.log(`📡 Fetching applications for job ${jobId}`);
      const res = await getJobApplications(jobId);
      
      const apps = Array.isArray(res.data) ? res.data : res.data?.data || [];
      
      // Filter only SHORTLISTED candidates
      const shortlisted = apps.filter(
        (app) => String(app.status || "").toUpperCase() === "SHORTLISTED"
      );
      
      console.log("✅ Shortlisted candidates:", shortlisted);
      setApplications(shortlisted);

      // Fetch job details
      try {
        await jobService.getJobById(jobId);
      } catch (error) {
        console.warn("Could not fetch job details:", error.message);
      }

      // Fetch existing interviews for these applications
      const interviewsMap = {};
      for (const app of shortlisted) {
        try {
          const interviewRes = await getInterviewsByApplication(app.id);
          const interviews = Array.isArray(interviewRes.data) ? interviewRes.data : [];
          interviewsMap[app.id] = interviews;
        } catch (error) {
          console.warn(`Could not fetch interviews for app ${app.id}:`, error.message);
          interviewsMap[app.id] = [];
        }
      }
      setInterviews(interviewsMap);
    } catch (err) {
      console.error("❌ Error fetching applications:", err);
      alert("Failed to fetch candidates");
    } finally {
      setLoading(false);
    }
  };

  const getInterviewsByApplication = async (applicationId) => {
    return fetch(`http://localhost:8093/interviews/application/${applicationId}`, {
      headers: {
        "Authorization": `Bearer ${localStorage.getItem("token") || ""}`,
      },
    }).then((res) => res.json());
  };

  const handleScheduleChange = (e) => {
    setScheduleForm({
      ...scheduleForm,
      [e.target.name]: e.target.value,
    });
  };

  const handleFeedbackChange = (e) => {
    setFeedbackForm({
      ...feedbackForm,
      [e.target.name]: e.target.value,
    });
  };

  const handleScheduleInterview = async (e) => {
    e.preventDefault();

    if (!scheduleForm.applicationId || !scheduleForm.round || !scheduleForm.scheduledAt) {
      alert("Please fill all fields");
      return;
    }

    try {
      console.log("📡 Scheduling interview:", scheduleForm);
      await scheduleInterview(scheduleForm);
      alert("✅ Interview Scheduled Successfully");
      setScheduleForm({ applicationId: "", round: "", scheduledAt: "" });
      
      // Refresh interviews
      await fetchShortlistedCandidates();
    } catch (err) {
      console.error("❌ Error scheduling interview:", err);
      alert("Failed to schedule interview");
    }
  };

  const handleAddFeedback = async (e) => {
    e.preventDefault();

    if (!feedbackForm.interviewId || !feedbackForm.feedback) {
      alert("Please fill all fields");
      return;
    }

    try {
      console.log("📡 Adding feedback:", feedbackForm);
      await addFeedback(feedbackForm.interviewId, feedbackForm.feedback);
      alert("✅ Feedback Added - Now Waiting for Company Decision");
      setFeedbackForm({ interviewId: "", feedback: "" });
      
      // Refresh interviews
      await fetchShortlistedCandidates();
    } catch (err) {
      console.error("❌ Error adding feedback:", err);
      alert("Failed to add feedback");
    }
  };

  const handleOfferCandidate = async (interviewId) => {
    try {
      console.log("📡 Offering candidate for interview:", interviewId);
      
      const response = await fetch(`http://localhost:8093/interviews/${interviewId}/offer`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token") || ""}`,
        },
      });

      if (!response.ok) throw new Error("Failed to offer");
      
      alert("✅ Offer Sent to Candidate!");
      await fetchShortlistedCandidates();
      setSelectedInterview(null);
    } catch (err) {
      console.error("❌ Error offering candidate:", err);
      alert("Failed to send offer");
    }
  };

  const handleRejectCandidate = async (e) => {
    e.preventDefault();

    if (!decisionForm.interviewId) {
      alert("Please select interview");
      return;
    }

    try {
      console.log("📡 Rejecting candidate for interview:", decisionForm.interviewId);
      
      const reason = decisionForm.rejectionReason || "Not suitable for the role";
      const response = await fetch(
        `http://localhost:8093/interviews/${decisionForm.interviewId}/reject?reason=${encodeURIComponent(reason)}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem("token") || ""}`,
          },
        }
      );

      if (!response.ok) throw new Error("Failed to reject");
      
      alert("✅ Candidate Rejected");
      setDecisionForm({ interviewId: "", decision: "", rejectionReason: "" });
      await fetchShortlistedCandidates();
      setSelectedInterview(null);
    } catch (err) {
      console.error("❌ Error rejecting candidate:", err);
      alert("Failed to reject candidate");
    }
  };

  const handleSelectApp = (app) => {
    setSelectedApp(app);
    setScheduleForm({
      applicationId: app.id,
      round: "",
      scheduledAt: "",
    });
  };

  return (
    <div className="interview-container">
      <h2>Interview Management</h2>

      {/* Step 1: Select Job */}
      <div className="interview-section search-section">
        <h3>Step 1: Select Job</h3>
        <div className="search-box">
          <input
            type="number"
            placeholder="Enter Job ID"
            value={jobId}
            onChange={(e) => setJobId(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && fetchShortlistedCandidates()}
          />
          <button onClick={fetchShortlistedCandidates} disabled={loading}>
            {loading ? "Loading..." : "Find Shortlisted Candidates"}
          </button>
        </div>
      </div>

      {/* Step 2: View Shortlisted Candidates */}
      {applications.length > 0 && (
        <div className="interview-section candidates-section">
          <h3>Step 2: Select Candidate to Interview ({applications.length})</h3>
          <div className="candidates-grid">
            {applications.map((app) => {
              const appInterviews = interviews[app.id] || [];

              return (
                <div
                  key={app.id}
                  className={`candidate-card ${selectedApp?.id === app.id ? "selected" : ""}`}
                  onClick={() => handleSelectApp(app)}
                >
                  <div className="candidate-header">
                    <h4>Application #{app.id}</h4>
                    <span className="status-badge shortlisted">SHORTLISTED</span>
                  </div>

                  <div className="candidate-details">
                    <p>
                      <strong>Candidate ID:</strong> {app.userId}
                    </p>
                    <p>
                      <strong>Applied On:</strong>{" "}
                      {app.appliedAt
                        ? new Date(app.appliedAt).toLocaleDateString()
                        : "N/A"}
                    </p>
                    {appInterviews.length > 0 && (
                      <>
                        <p>
                          <strong>Interviews:</strong> {appInterviews.length}
                        </p>
                        {appInterviews.map((interview) => (
                          <p key={interview.id} className="interview-status">
                            Round: <strong>{interview.round}</strong> - Status:{" "}
                            <span className={`status-${String(interview.status || "").toLowerCase()}`}>
                              {interview.status}
                            </span>
                          </p>
                        ))}
                      </>
                    )}
                  </div>

                  {selectedApp?.id === app.id && (
                    <div className="select-indicator">✓ Selected</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Step 3: Schedule Interview */}
      {selectedApp && (
        <div className="interview-section schedule-section">
          <h3>Step 3: Schedule Interview for Candidate #{selectedApp.id}</h3>
          <form onSubmit={handleScheduleInterview}>
            <div className="form-group">
              <label>Round</label>
              <select
                name="round"
                value={scheduleForm.round}
                onChange={handleScheduleChange}
                required
              >
                <option value="">Select Round</option>
                <option value="L1">L1 - Technical Round</option>
                <option value="L2">L2 - Advanced Technical Round</option>
                <option value="R1">R1 - HR Round</option>
              </select>
            </div>

            <div className="form-group">
              <label>Schedule Date & Time</label>
              <input
                type="datetime-local"
                name="scheduledAt"
                value={scheduleForm.scheduledAt}
                onChange={handleScheduleChange}
                required
              />
            </div>

            <button type="submit" className="btn-schedule">
              Schedule Interview
            </button>
          </form>
        </div>
      )}

      {/* Step 4: Make Hiring Decision */}
      {Object.keys(interviews).length > 0 && (
        <div className="interview-section decision-section">
          <h3>Step 4: Make Hiring Decisions (Pending)</h3>
          <div className="pending-interviews-grid">
            {Object.entries(interviews).map(([appId, appInterviews]) => {
              const pendingInterviews = appInterviews.filter(
                (i) => String(i.status || "").toUpperCase() === "PENDING_DECISION"
              );
              
              if (pendingInterviews.length === 0) return null;

              const app = applications.find((a) => a.id === parseInt(appId));
              
              return pendingInterviews.map((interview) => (
                <div key={interview.id} className="decision-card">
                  <div className="decision-header">
                    <h4>Application #{app?.id}</h4>
                    <span className="decision-badge pending">PENDING DECISION</span>
                  </div>

                  <div className="decision-details">
                    <p>
                      <strong>Candidate ID:</strong> {app?.userId}
                    </p>
                    <p>
                      <strong>Round:</strong> {interview.round}
                    </p>
                    <p>
                      <strong>Feedback:</strong>
                    </p>
                    <p className="feedback-text">{interview.feedback || "No feedback added yet"}</p>
                  </div>

                  <div className="decision-buttons">
                    <button
                      className="btn-offer"
                      onClick={() => handleOfferCandidate(interview.id)}
                    >
                      ✅ Send Offer
                    </button>
                    <button
                      className="btn-reject"
                      onClick={() => setSelectedInterview(interview)}
                    >
                      ❌ Reject Candidate
                    </button>
                  </div>

                  {selectedInterview?.id === interview.id && (
                    <div className="rejection-form">
                      <textarea
                        placeholder="Rejection reason (optional)"
                        value={decisionForm.rejectionReason}
                        onChange={(e) =>
                          setDecisionForm({
                            ...decisionForm,
                            interviewId: interview.id,
                            rejectionReason: e.target.value,
                          })
                        }
                        rows="3"
                      />
                      <div className="rejection-buttons">
                        <button
                          className="btn-confirm-reject"
                          onClick={(e) => {
                            e.preventDefault();
                            setDecisionForm({
                              ...decisionForm,
                              interviewId: interview.id,
                            });
                            handleRejectCandidate(e);
                          }}
                        >
                          Confirm Rejection
                        </button>
                        <button
                          className="btn-cancel-reject"
                          onClick={() => setSelectedInterview(null)}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ));
            })}
          </div>

          {Object.values(interviews).every((appInterviews) =>
            appInterviews.every((i) => String(i.status || "").toUpperCase() !== "PENDING_DECISION")
          ) && (
            <p className="no-pending">No pending interview decisions</p>
          )}
        </div>
      )}

      {/* Step 5: Add Interview Feedback */}
      <div className="interview-section feedback-section">
        <h3>Step 5: Add Interview Feedback & Notes</h3>
        <form onSubmit={handleAddFeedback}>
          <div className="form-group">
            <label>Interview ID</label>
            <input
              type="number"
              name="interviewId"
              placeholder="Enter Interview ID"
              value={feedbackForm.interviewId}
              onChange={handleFeedbackChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Interview Feedback & Remarks</label>
            <textarea
              name="feedback"
              placeholder="Write your interview feedback and observations here. This will help in the hiring decision..."
              value={feedbackForm.feedback}
              onChange={handleFeedbackChange}
              rows="4"
              required
            />
            <p className="form-hint">
              💡 Note: Company will manually decide whether to offer or reject based on this feedback.
            </p>
          </div>

          <button type="submit" className="btn-feedback">
            Submit Feedback (Interview Pending Decision)
          </button>
        </form>
      </div>

      {/* Empty State */}
      {applications.length === 0 && !loading && jobId && (
        <div className="empty-state">
          <p>No shortlisted candidates for Job ID: {jobId}</p>
        </div>
      )}
    </div>
  );
}

export default Interview;