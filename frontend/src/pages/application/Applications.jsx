import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./Applications.css";

import {
	getInterviewsByApplication,
	getJobApplications,
	offerCandidate,
	rejectCandidate,
	scheduleInterview,
	updateApplicationStatus,
} from "../../services/endpoints";
import { normalizeList, toStage, initials, formatDate, humanize } from "../../utils/helpers";
import { PIPELINE_STAGES, STAGE_TONE } from "../../utils/constants";
import { useToast } from "../../components/Toast/ToastContext";

const ROUND_ORDER = ["L1", "L2", "R1"];
const COMPLETED_INTERVIEW_STATUSES = ["COMPLETED", "PENDING_DECISION", "OFFERED", "REJECTED"];
const SCHEDULED_INTERVIEW_STATUSES = ["SCHEDULED", "INTERVIEW_SCHEDULED"];

const STAGE_LABEL = {
	NEW: "New",
	SCREENING: "Screening",
	SHORTLISTED: "Shortlisted",
	INTERVIEW: "Interview",
	SELECTED: "Selected",
	OFFER: "Offer",
	HIRED: "Hired",
};

function Applications() {
	const location = useLocation();
	const navigate = useNavigate();
	const toast = useToast();

	const [jobId, setJobId] = useState("");
	const [applications, setApplications] = useState([]);
	const [interviewsMap, setInterviewsMap] = useState({});
	const [scheduleAt, setScheduleAt] = useState("");
	const [loading, setLoading] = useState(false);
	const [actionLoading, setActionLoading] = useState(false);
	const [searchedJobId, setSearchedJobId] = useState("");
	const [openAppId, setOpenAppId] = useState(null);

	// ---- interview round helpers (state machine preserved) ------------------
	const latestRound = (interviews, round) =>
		(interviews || [])
			.filter((i) => String(i?.round || "").toUpperCase() === round)
			.sort((a, b) => new Date(b?.scheduledAt || 0) - new Date(a?.scheduledAt || 0))[0] || null;

	const isCompleted = (i) => COMPLETED_INTERVIEW_STATUSES.includes(String(i?.status || "").toUpperCase());
	const isScheduled = (i) => SCHEDULED_INTERVIEW_STATUSES.includes(String(i?.status || "").toUpperCase());

	const finalDecisionRound = (ivs) => {
		const r1 = latestRound(ivs, "R1");
		return r1 && isCompleted(r1) ? { round: "R1", interview: r1 } : null;
	};

	const nextRoundToSchedule = (ivs) => {
		const l1 = latestRound(ivs, "L1");
		const l2 = latestRound(ivs, "L2");
		const r1 = latestRound(ivs, "R1");
		if (!l1) return "L1";
		if (!isCompleted(l1)) return null;
		if (!l2) return "L2";
		if (!isCompleted(l2)) return null;
		if (!r1) return "R1";
		if (!isCompleted(r1)) return null;
		return null;
	};

	const flowLabel = (app, ivs) => {
		const status = String(app?.status || "").toUpperCase();
		if (status === "REJECTED") return "Rejected";
		if (["OFFERED", "OFFER_RELEASED"].includes(status)) return "Offer sent";
		if (["ACCEPTED", "JOINED"].includes(status)) return humanize(status);
		if (finalDecisionRound(ivs)?.round === "R1") return "All rounds done — offer or reject";
		const scheduled = ROUND_ORDER.find((r) => {
			const iv = latestRound(ivs, r);
			return iv && isScheduled(iv);
		});
		if (scheduled) return `${scheduled} interview scheduled`;
		const next = nextRoundToSchedule(ivs);
		if (next === "L2") return "L1 cleared — schedule L2";
		if (next === "R1") return "L2 cleared — schedule HR (R1)";
		return "Ready for first round (L1)";
	};

	// ---- data ---------------------------------------------------------------
	const loadInterviews = useCallback(async (apps) => {
		const map = {};
		for (const app of apps) {
			try {
				const res = await getInterviewsByApplication(app.id);
				map[app.id] = normalizeList(res.data);
			} catch {
				map[app.id] = [];
			}
		}
		setInterviewsMap(map);
	}, []);

	const fetchApplications = useCallback(
		async (overrideJobId) => {
			const effective = overrideJobId ?? jobId;
			const n = Number(String(effective).trim());
			if (!n || n <= 0) return;
			try {
				setLoading(true);
				const res = await getJobApplications(n);
				const list = normalizeList(res.data);
				setApplications(list);
				await loadInterviews(list);
				setSearchedJobId(String(n));
				setJobId(String(n));
			} catch (err) {
				console.log(err);
			} finally {
				setLoading(false);
			}
		},
		[jobId, loadInterviews]
	);

	useEffect(() => {
		const params = new URLSearchParams(location.search);
		const pre = params.get("jobId");
		if (pre) {
			const t = setTimeout(() => fetchApplications(pre), 0);
			return () => clearTimeout(t);
		}
	}, [location.search, fetchApplications]);

	// ---- actions ------------------------------------------------------------
	const setStatus = async (id, status) => {
		try {
			setActionLoading(true);
			await updateApplicationStatus(id, status);
			toast.success(status === "REJECTED" ? "Candidate rejected." : `Moved to ${humanize(status)}.`);
			await fetchApplications();
		} catch (err) {
			console.log(err);
			toast.error("Couldn't update status.");
		} finally {
			setActionLoading(false);
		}
	};

	// Once an offer is in play, interviewing is locked.
	const OFFER_LOCKED = ["OFFERED", "OFFER_RELEASED", "ACCEPTED", "JOINED"];

	const scheduleRound = async (appId, round, appStatus) => {
		if (OFFER_LOCKED.includes(String(appStatus || "").toUpperCase())) {
			toast.warning("This candidate already has an offer — interviews are closed.");
			return;
		}
		if (!scheduleAt) {
			toast.error("Pick a date and time first.");
			return;
		}
		try {
			setActionLoading(true);
			await scheduleInterview({ applicationId: appId, round, scheduledAt: scheduleAt });
			await updateApplicationStatus(appId, "INTERVIEW_SCHEDULED");
			setScheduleAt("");
			toast.success(`${round} interview scheduled.`);
			await fetchApplications();
		} catch (err) {
			console.log(err);
			toast.error("Couldn't schedule the interview.");
		} finally {
			setActionLoading(false);
		}
	};

	const roundDecision = async (appId, round, interviewId, decision) => {
		try {
			setActionLoading(true);
			if (decision === "REJECT") {
				if (round === "R1") await rejectCandidate(interviewId, "Rejected after final HR round");
				else await updateApplicationStatus(appId, "REJECTED");
			} else if (decision === "CLEAR") {
				if (round === "L1") await updateApplicationStatus(appId, "L1_CLEARED");
				if (round === "L2") await updateApplicationStatus(appId, "L2_CLEARED");
			} else if (decision === "OFFER") {
				await offerCandidate(interviewId);
			}
			toast.success(decision === "OFFER" ? "Offer sent to candidate." : decision === "REJECT" ? "Candidate rejected." : "Round updated.");
			await fetchApplications();
		} catch (err) {
			console.log(err);
			toast.error("That action didn't go through.");
		} finally {
			setActionLoading(false);
		}
	};

	// ---- board grouping -----------------------------------------------------
	const columns = useMemo(() => {
		const map = PIPELINE_STAGES.reduce((acc, s) => ({ ...acc, [s]: [] }), {});
		applications.forEach((app) => {
			const stage = toStage(app.status);
			if (String(app.status).toUpperCase() === "REJECTED") return; // rejected shown separately
			(map[stage] || map.NEW).push(app);
		});
		return map;
	}, [applications]);

	const rejected = useMemo(
		() => applications.filter((a) => String(a.status).toUpperCase() === "REJECTED"),
		[applications]
	);

	const openApp = applications.find((a) => a.id === openAppId) || null;
	const openIvs = openApp ? interviewsMap[openApp.id] || [] : [];

	return (
		<div className="ht-page apps-page">
			<header className="ht-page-head">
				<div>
					<h2>Applications</h2>
					<p>Move candidates through the hiring pipeline.</p>
				</div>
				<div className="ht-page-actions">
					<div className="apps-search">
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></svg>
						<input
							type="text"
							inputMode="numeric"
							placeholder="Job ID…"
							value={jobId}
							onChange={(e) => setJobId(e.target.value)}
							onKeyDown={(e) => e.key === "Enter" && fetchApplications()}
							aria-label="Job ID"
						/>
					</div>
					<button onClick={() => fetchApplications()} disabled={loading}>
						{loading ? "Loading…" : "Load"}
					</button>
				</div>
			</header>

			{!searchedJobId ? (
				<div className="ht-empty">
					<div className="ht-empty-mark" aria-hidden="true" />
					<h3>Load a job's applications</h3>
					<p>Enter a Job ID above, or open a job's “View Applications” from Company Jobs.</p>
				</div>
			) : applications.length === 0 && !loading ? (
				<div className="ht-empty">
					<div className="ht-empty-mark" aria-hidden="true" />
					<h3>No applications yet</h3>
					<p>No candidate has applied for job #{searchedJobId} so far.</p>
				</div>
			) : (
				<>
					<div className="kanban" role="list">
						{PIPELINE_STAGES.map((stage) => {
							const items = columns[stage] || [];
							const tone = STAGE_TONE[stage] || "info";
							return (
								<section className="kanban-col" key={stage} role="listitem">
									<header className="kanban-col-head">
										<span className={`kanban-dot tone-${tone}`} />
										<span className="kanban-col-title">{STAGE_LABEL[stage]}</span>
										<span className="kanban-col-count">{items.length}</span>
									</header>
									<div className="kanban-col-body">
										{items.map((app, i) => (
											<button
												key={app.id}
												className="kanban-card"
												style={{ "--i": i }}
												onClick={() => setOpenAppId(app.id)}
											>
												<div className="kanban-card-top">
													<span className="ht-avatar" style={{ width: 34, height: 34, fontSize: "0.75rem" }}>
														{initials(`U${app.userId}`)}
													</span>
													<span className="kanban-card-id">#{app.id}</span>
												</div>
												<strong className="kanban-card-name">Candidate {app.userId}</strong>
												<span className="kanban-card-job">Job #{app.jobId ?? searchedJobId}</span>
												<span className={`ht-pill tone-${tone}`}>{humanize(app.status)}</span>
											</button>
										))}
										{items.length === 0 && <p className="kanban-empty">—</p>}
									</div>
								</section>
							);
						})}
					</div>

					{rejected.length > 0 && (
						<details className="apps-rejected">
							<summary>Rejected ({rejected.length})</summary>
							<div className="apps-rejected-list">
								{rejected.map((app) => (
									<button key={app.id} className="apps-rejected-item" onClick={() => setOpenAppId(app.id)}>
										<span className="ht-avatar tone-pink" style={{ width: 30, height: 30, fontSize: "0.7rem" }}>{initials(`U${app.userId}`)}</span>
										Candidate {app.userId} · #{app.id}
									</button>
								))}
							</div>
						</details>
					)}
				</>
			)}

			{/* Detail drawer */}
			{openApp && (
				<div className="drawer-scrim" onClick={() => setOpenAppId(null)}>
					<aside className="drawer" onClick={(e) => e.stopPropagation()}>
						<header className="drawer-head">
							<div className="drawer-id">
								<span className="ht-avatar">{initials(`U${openApp.userId}`)}</span>
								<div>
									<h3>Candidate {openApp.userId}</h3>
									<p>Application #{openApp.id} · Job #{openApp.jobId ?? searchedJobId}</p>
								</div>
							</div>
							<button className="drawer-close" onClick={() => setOpenAppId(null)} aria-label="Close">
								<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M6 6l12 12M18 6l-12 12" /></svg>
							</button>
						</header>

						<div className="drawer-body">
							<div className="drawer-row">
								<span>Current stage</span>
								<span className={`ht-pill tone-${STAGE_TONE[toStage(openApp.status)]}`}>{humanize(openApp.status)}</span>
							</div>
							<div className="drawer-row">
								<span>Resume</span>
								<strong>{openApp.resumeUrl || "Not provided"}</strong>
							</div>
							<div className="drawer-row">
								<span>Applied</span>
								<strong>{formatDate(openApp.appliedAt)}</strong>
							</div>
							<div className="drawer-flow">{flowLabel(openApp, openIvs)}</div>

							{(() => {
								const status = String(openApp.status).toUpperCase();
								const isRejected = status === "REJECTED";
								const offerLocked = OFFER_LOCKED.includes(status);
								const isHired = status === "JOINED";
								const beyond = ["SHORTLISTED", "INTERVIEW_SCHEDULED", "L1_CLEARED", "L2_CLEARED"].includes(status);
								const next = nextRoundToSchedule(openIvs);
								const final = finalDecisionRound(openIvs);

								// Once an offer exists (or candidate rejected), the hiring
								// pipeline for this candidate is settled — no more interviews.
								if (isRejected) {
									return (
										<div className="drawer-actions">
											<div className="drawer-settled tone-danger">This candidate was rejected.</div>
											<button className="ht-btn-ghost" onClick={() => navigate(`/company/candidate/${openApp.userId}?appId=${openApp.id}&jobId=${openApp.jobId ?? searchedJobId}`)}>View full profile</button>
										</div>
									);
								}
								if (offerLocked) {
									return (
										<div className="drawer-actions">
											<div className={`drawer-settled ${isHired ? "tone-green" : "tone-brand"}`}>
												{isHired ? "🎉 Hired — candidate has joined." : status === "ACCEPTED" ? "Offer accepted — awaiting joining confirmation." : "Offer sent — awaiting candidate response."}
											</div>
											<button className="ht-btn-ghost" onClick={() => navigate(`/company/candidate/${openApp.userId}?appId=${openApp.id}&jobId=${openApp.jobId ?? searchedJobId}`)}>View full profile</button>
										</div>
									);
								}

								return (
									<div className="drawer-actions">
										{!beyond && (
											<button className="ht-btn-success" onClick={() => setStatus(openApp.id, "SHORTLISTED")} disabled={actionLoading}>Shortlist</button>
										)}

										{beyond && !final && next && (
											<div className="drawer-schedule">
												<label>Schedule {next}{next === "R1" ? " (HR)" : ""}</label>
												<input type="datetime-local" value={scheduleAt} onChange={(e) => setScheduleAt(e.target.value)} />
												<button onClick={() => scheduleRound(openApp.id, next, status)} disabled={actionLoading}>Schedule {next}</button>
											</div>
										)}

										{final?.round === "R1" && (
											<div className="drawer-decision">
												<button className="ht-btn-success" onClick={() => roundDecision(openApp.id, "R1", final.interview.id, "OFFER")} disabled={actionLoading}>Send Offer</button>
												<button className="ht-btn-danger" onClick={() => roundDecision(openApp.id, "R1", final.interview.id, "REJECT")} disabled={actionLoading}>Reject</button>
											</div>
										)}

										<button className="ht-btn-ghost" onClick={() => setStatus(openApp.id, "REJECTED")} disabled={actionLoading}>Reject candidate</button>

										<button className="ht-btn-ghost" onClick={() => navigate(`/company/candidate/${openApp.userId}?appId=${openApp.id}&jobId=${openApp.jobId ?? searchedJobId}`)}>
											View full profile
										</button>
									</div>
								);
							})()}

							{openIvs.length > 0 && (
								<div className="drawer-history">
									<h4>Interview history</h4>
									<ul>
										{openIvs.map((iv) => (
											<li key={iv.id}>
												<span className="drawer-round">{iv.round}</span>
												<span className={`ht-pill tone-${isCompleted(iv) ? "green" : "amber"}`}>{humanize(iv.status)}</span>
												<span className="drawer-when">{formatDate(iv.scheduledAt)}</span>
											</li>
										))}
									</ul>
								</div>
							)}
						</div>
					</aside>
				</div>
			)}
		</div>
	);
}

export default Applications;
