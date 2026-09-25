import { useState } from "react";
import "./Interview.css";
import {
	getJobApplications,
	scheduleInterview,
	addFeedback,
	getInterviewsByApplication,
	offerCandidate,
	rejectCandidate,
} from "../../services/endpoints";
import { jobService } from "../../services/api";
import { normalizeList, initials, formatDate, humanize } from "../../utils/helpers";
import { useToast } from "../../components/Toast/ToastContext";

const ROUNDS = [
	{ value: "L1", label: "L1 · Technical" },
	{ value: "L2", label: "L2 · Advanced Technical" },
	{ value: "R1", label: "R1 · HR / Final" },
];

function Interview() {
	const toast = useToast();
	const [jobId, setJobId] = useState("");
	const [applications, setApplications] = useState([]);
	const [interviews, setInterviews] = useState({});
	const [loading, setLoading] = useState(false);
	const [selectedApp, setSelectedApp] = useState(null);
	const [rejectingId, setRejectingId] = useState(null);
	const [rejectReason, setRejectReason] = useState("");

	const [scheduleForm, setScheduleForm] = useState({ round: "", scheduledAt: "" });
	const [feedbackForm, setFeedbackForm] = useState({ interviewId: "", feedback: "" });

	const loadCandidates = async () => {
		const n = Number(jobId);
		if (!n || n <= 0) {
			toast.error("Enter a valid Job ID.");
			return;
		}
		setLoading(true);
		try {
			const res = await getJobApplications(n);
			// Only candidates actively in the interview stage — never rejected,
			// offered, or already decided.
			const apps = normalizeList(res.data).filter((a) => {
				const s = String(a.status || "").toUpperCase();
				return ["SHORTLISTED", "INTERVIEW_SCHEDULED", "L1_CLEARED", "L2_CLEARED"].includes(s);
			});
			setApplications(apps);
			setSelectedApp((prev) => (prev && apps.some((a) => a.id === prev.id) ? prev : null));

			try {
				await jobService.getJobById(n);
			} catch { /* job details are optional */ }

			// FIXED: was raw fetch('http://localhost:8093/...') — now goes through
			// the axios client at the single monolith origin (port 8080).
			const map = {};
			for (const app of apps) {
				try {
					const ivRes = await getInterviewsByApplication(app.id);
					map[app.id] = normalizeList(ivRes.data);
				} catch {
					map[app.id] = [];
				}
			}
			setInterviews(map);
		} catch (err) {
			console.log(err);
			toast.error("Couldn't load candidates.");
		} finally {
			setLoading(false);
		}
	};

	const handleSchedule = async (e) => {
		e.preventDefault();
		if (!selectedApp || !scheduleForm.round || !scheduleForm.scheduledAt) {
			toast.error("Pick a candidate, round and time.");
			return;
		}
		try {
			await scheduleInterview({
				applicationId: selectedApp.id,
				round: scheduleForm.round,
				scheduledAt: scheduleForm.scheduledAt,
			});
			setScheduleForm({ round: "", scheduledAt: "" });
			toast.success("Interview scheduled.");
			await loadCandidates();
		} catch (err) {
			console.log(err);
			toast.error("Couldn't schedule the interview.");
		}
	};

	const handleFeedback = async (e) => {
		e.preventDefault();
		if (!feedbackForm.interviewId || !feedbackForm.feedback) {
			toast.error("Enter an interview ID and feedback.");
			return;
		}
		try {
			await addFeedback(feedbackForm.interviewId, feedbackForm.feedback);
			setFeedbackForm({ interviewId: "", feedback: "" });
			toast.success("Feedback saved.");
			await loadCandidates();
		} catch (err) {
			console.log(err);
			toast.error("Couldn't add feedback.");
		}
	};

	// FIXED: real endpoints instead of hardcoded 8093 fetch.
	const handleOffer = async (interviewId) => {
		try {
			await offerCandidate(interviewId);
			toast.success("Offer sent to candidate.");
			await loadCandidates();
		} catch (err) {
			console.log(err);
			toast.error("Couldn't send the offer.");
		}
	};

	const handleReject = async (interviewId) => {
		try {
			await rejectCandidate(interviewId, rejectReason || "Not suitable for the role");
			setRejectingId(null);
			setRejectReason("");
			toast.info("Candidate rejected.");
			await loadCandidates();
		} catch (err) {
			console.log(err);
			toast.error("Couldn't reject the candidate.");
		}
	};

	const pendingDecisions = Object.entries(interviews).flatMap(([appId, ivs]) =>
		(ivs || [])
			.filter((i) => String(i.status || "").toUpperCase() === "PENDING_DECISION")
			.map((iv) => ({ appId: Number(appId), interview: iv }))
	);

	return (
		<div className="ht-page interview-page">
			<header className="ht-page-head">
				<div>
					<h2>Interviews</h2>
					<p>Schedule rounds, capture feedback and decide on candidates.</p>
				</div>
				<div className="ht-page-actions">
					<div className="iv-search">
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></svg>
						<input type="number" placeholder="Job ID…" value={jobId} onChange={(e) => setJobId(e.target.value)} onKeyDown={(e) => e.key === "Enter" && loadCandidates()} aria-label="Job ID" />
					</div>
					<button onClick={loadCandidates} disabled={loading}>{loading ? "Loading…" : "Load"}</button>
				</div>
			</header>

			{/* Pending decisions strip */}
			{pendingDecisions.length > 0 && (
				<section className="iv-decisions">
					<h3>Awaiting your decision</h3>
					<div className="iv-decision-grid">
						{pendingDecisions.map(({ appId, interview }) => {
							const app = applications.find((a) => a.id === appId);
							return (
								<article key={interview.id} className="iv-decision-card">
									<div className="iv-decision-top">
										<span className="ht-avatar">{initials(`U${app?.userId ?? "?"}`)}</span>
										<div>
											<strong>Candidate {app?.userId ?? "—"}</strong>
											<span className="iv-decision-round">{interview.round} · App #{appId}</span>
										</div>
										<span className="ht-pill tone-amber">Pending</span>
									</div>
									<p className="iv-feedback">{interview.feedback || "No feedback recorded yet."}</p>
									{rejectingId === interview.id ? (
										<div className="iv-reject-form">
											<textarea rows="2" placeholder="Reason (optional)" value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} />
											<div className="iv-reject-btns">
												<button className="ht-btn-danger" onClick={() => handleReject(interview.id)}>Confirm reject</button>
												<button className="ht-btn-ghost" onClick={() => { setRejectingId(null); setRejectReason(""); }}>Cancel</button>
											</div>
										</div>
									) : (
										<div className="iv-decision-btns">
											<button className="ht-btn-success" onClick={() => handleOffer(interview.id)}>Send Offer</button>
											<button className="ht-btn-danger" onClick={() => setRejectingId(interview.id)}>Reject</button>
										</div>
									)}
								</article>
							);
						})}
					</div>
				</section>
			)}

			{/* Candidates + schedule */}
			{applications.length > 0 ? (
				<div className="iv-layout">
					<section className="iv-candidates">
						<h3>Shortlisted candidates ({applications.length})</h3>
						<div className="iv-candidate-list">
							{applications.map((app) => {
								const ivs = interviews[app.id] || [];
								return (
									<button
										key={app.id}
										className={`iv-candidate ${selectedApp?.id === app.id ? "active" : ""}`}
										onClick={() => { setSelectedApp(app); setScheduleForm({ round: "", scheduledAt: "" }); }}
									>
										<span className="ht-avatar">{initials(`U${app.userId}`)}</span>
										<span className="iv-candidate-info">
											<strong>Candidate {app.userId}</strong>
											<span>App #{app.id} · Applied {formatDate(app.appliedAt)}</span>
										</span>
										{ivs.length > 0 && <span className="iv-candidate-rounds">{ivs.length} round{ivs.length > 1 ? "s" : ""}</span>}
									</button>
								);
							})}
						</div>
					</section>

					<aside className="iv-panel ht-panel">
						<div className="iv-field iv-picker">
							<label htmlFor="iv-candidate">Candidate</label>
							<select
								id="iv-candidate"
								value={selectedApp?.id ?? ""}
								onChange={(e) => {
									const app = applications.find((a) => String(a.id) === e.target.value);
									setSelectedApp(app || null);
									setScheduleForm({ round: "", scheduledAt: "" });
								}}
							>
								<option value="">Select a shortlisted candidate…</option>
								{applications.map((a) => (
									<option key={a.id} value={a.id}>
										Candidate {a.userId} · App #{a.id} · {humanize(a.status)}
									</option>
								))}
							</select>
						</div>

						{selectedApp ? (
							<>
								<div className="iv-panel-head">
									<span className="ht-avatar">{initials(`U${selectedApp.userId}`)}</span>
									<div>
										<h3>Candidate {selectedApp.userId}</h3>
										<p>Application #{selectedApp.id}</p>
									</div>
								</div>

								{(interviews[selectedApp.id] || []).length > 0 && (
									<div className="iv-rounds">
										{(interviews[selectedApp.id] || []).map((iv) => (
											<div key={iv.id} className="iv-round">
												<span className="iv-round-name">{iv.round}</span>
												<span className={`ht-pill tone-${String(iv.status).toUpperCase() === "SCHEDULED" ? "info" : "green"}`}>{humanize(iv.status)}</span>
												<span className="iv-round-when">{formatDate(iv.scheduledAt)}</span>
											</div>
										))}
									</div>
								)}

								<form className="iv-schedule" onSubmit={handleSchedule}>
									<h4>Schedule a round</h4>
									<div className="iv-field">
										<label htmlFor="iv-round">Round</label>
										<select id="iv-round" value={scheduleForm.round} onChange={(e) => setScheduleForm((f) => ({ ...f, round: e.target.value }))} required>
											<option value="">Select round…</option>
											{ROUNDS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
										</select>
									</div>
									<div className="iv-field">
										<label htmlFor="iv-when">Date &amp; time</label>
										<input id="iv-when" type="datetime-local" value={scheduleForm.scheduledAt} onChange={(e) => setScheduleForm((f) => ({ ...f, scheduledAt: e.target.value }))} required />
									</div>
									<button type="submit">Schedule interview</button>
								</form>
							</>
						) : (
							<div className="iv-panel-empty">
								<div className="ht-empty-mark" aria-hidden="true" />
								<p>Select a candidate to schedule a round.</p>
							</div>
						)}
					</aside>
				</div>
			) : (
				!loading && (
					<div className="ht-empty">
						<div className="ht-empty-mark" aria-hidden="true" />
						<h3>{jobId ? "No shortlisted candidates" : "Load a job"}</h3>
						<p>{jobId ? `No one is shortlisted for job #${jobId} yet.` : "Enter a Job ID to see shortlisted candidates."}</p>
					</div>
				)
			)}

			{/* Feedback */}
			<section className="iv-feedback-card ht-panel">
				<h3>Add interview feedback</h3>
				<p className="iv-feedback-sub">Record notes after a round. The company decides the outcome from these.</p>
				<form className="iv-feedback-form" onSubmit={handleFeedback}>
					<div className="iv-field">
						<label htmlFor="fb-id">Interview ID</label>
						<input id="fb-id" type="number" placeholder="e.g. 12" value={feedbackForm.interviewId} onChange={(e) => setFeedbackForm((f) => ({ ...f, interviewId: e.target.value }))} required />
					</div>
					<div className="iv-field">
						<label htmlFor="fb-text">Feedback</label>
						<textarea id="fb-text" rows="3" placeholder="Observations and recommendation…" value={feedbackForm.feedback} onChange={(e) => setFeedbackForm((f) => ({ ...f, feedback: e.target.value }))} required />
					</div>
					<button type="submit">Submit feedback</button>
				</form>
			</section>
		</div>
	);
}

export default Interview;
