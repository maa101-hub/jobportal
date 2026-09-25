import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./MyApplications.css";

import { completeInterviewRound, getInterviewsByApplication, getUserApplications } from "../../services/endpoints";
import { jobService } from "../../services/api";
import { normalizeList, toStage, humanize, formatDate } from "../../utils/helpers";
import { STAGE_TONE } from "../../utils/constants";
import { useToast } from "../../components/Toast/ToastContext";

const SCHEDULED_INTERVIEW_STATUSES = ["SCHEDULED", "INTERVIEW_SCHEDULED"];
const COMPLETED_INTERVIEW_STATUSES = ["COMPLETED", "PENDING_DECISION", "OFFERED", "REJECTED"];

const STAGE_LABEL = {
	NEW: "Applied", SCREENING: "In Review", SHORTLISTED: "Shortlisted",
	INTERVIEW: "Interview", SELECTED: "Selected", OFFER: "Offer", HIRED: "Hired", REJECTED: "Rejected",
};

function MyApplications() {
	const navigate = useNavigate();
	const toast = useToast();
	const [applications, setApplications] = useState([]);
	const [jobDetails, setJobDetails] = useState({});
	const [interviewsMap, setInterviewsMap] = useState({});
	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);
	const [error, setError] = useState(null);

	const userId = useMemo(() => {
		const user = JSON.parse(localStorage.getItem("user") || "null");
		const raw = user?.id ?? user?.userId ?? localStorage.getItem("userId");
		return raw ? Number(raw) : null;
	}, []);

	const latestRound = (interviews, round) =>
		(interviews || [])
			.filter((i) => String(i?.round || "").toUpperCase() === round)
			.sort((a, b) => new Date(b?.scheduledAt || 0) - new Date(a?.scheduledAt || 0))[0] || null;

	const nextScheduled = (interviews) =>
		(interviews || [])
			.filter((i) => SCHEDULED_INTERVIEW_STATUSES.includes(String(i?.status || "").toUpperCase()))
			.sort((a, b) => new Date(a?.scheduledAt || 0) - new Date(b?.scheduledAt || 0))[0] || null;

	const progressText = (interviews, appStatus) => {
		const isDone = (i) => COMPLETED_INTERVIEW_STATUSES.includes(String(i?.status || "").toUpperCase());
		const upcoming = nextScheduled(interviews);
		if (upcoming) return `${upcoming.round} interview scheduled`;
		const l1 = latestRound(interviews, "L1");
		const l2 = latestRound(interviews, "L2");
		const r1 = latestRound(interviews, "R1");
		if (!l1) return "Waiting for first round (L1)";
		if (l1 && isDone(l1) && !l2) return "Waiting for second round (L2)";
		if (l2 && isDone(l2) && !r1) return "Waiting for HR round";
		if (r1 && isDone(r1) && !["OFFERED", "OFFER_RELEASED", "REJECTED", "ACCEPTED", "JOINED"].includes(String(appStatus || "").toUpperCase()))
			return "All rounds done — awaiting decision";
		return "The company will be in touch soon";
	};

	const loadInterviews = useCallback(async (apps) => {
		const map = {};
		for (const app of apps) {
			try {
				map[app.id] = normalizeList((await getInterviewsByApplication(app.id)).data);
			} catch {
				map[app.id] = [];
			}
		}
		setInterviewsMap(map);
	}, []);

	const loadJobs = async (apps) => {
		const details = {};
		for (const app of apps) {
			if (!app.jobId) continue;
			try {
				details[app.jobId] = (await jobService.getJobById(app.jobId)).data;
			} catch {
				details[app.jobId] = { id: app.jobId, title: `Job #${app.jobId}` };
			}
		}
		return details;
	};

	const load = useCallback(async (isRefresh) => {
		if (isRefresh) setRefreshing(true); else setLoading(true);
		setError(null);
		if (!userId || userId <= 0) {
			setError("We couldn't find your account. Please sign in again.");
			setLoading(false); setRefreshing(false);
			return;
		}
		try {
			const apps = normalizeList((await getUserApplications(userId)).data);
			setApplications(apps);
			if (apps.length) {
				setJobDetails(await loadJobs(apps));
				await loadInterviews(apps);
			} else {
				setInterviewsMap({});
			}
		} catch (err) {
			setError(err.message || "Couldn't load your applications.");
			setApplications([]);
		} finally {
			setLoading(false); setRefreshing(false);
		}
	}, [userId, loadInterviews]);

	useEffect(() => { load(false); }, [load]);

	const takeInterview = async (interviewId) => {
		try {
			await completeInterviewRound(interviewId);
			toast.success("Interview marked complete. The team will review it.");
			await load(true);
		} catch (err) {
			console.log(err);
			toast.error("Couldn't complete the interview.");
		}
	};

	const counts = useMemo(() => {
		const c = { total: applications.length, active: 0, interview: 0, offer: 0 };
		applications.forEach((a) => {
			const stage = toStage(a.status);
			const s = String(a.status).toUpperCase();
			if (!["REJECTED", "JOINED"].includes(s)) c.active += 1;
			if (stage === "INTERVIEW") c.interview += 1;
			if (stage === "OFFER" || stage === "HIRED") c.offer += 1;
		});
		return c;
	}, [applications]);

	return (
		<div className="ht-page myapps-page">
			<header className="ht-page-head">
				<div>
					<h2>My Applications</h2>
					<p>Track the stage of every job you've applied to.</p>
				</div>
				<div className="ht-page-actions">
					<button className="ht-btn-ghost" onClick={() => load(true)} disabled={refreshing}>
						{refreshing ? "Refreshing…" : "Refresh"}
					</button>
					<button onClick={() => navigate("/jobs")}>Browse Jobs</button>
				</div>
			</header>

			{error && <div className="myapps-banner">{error}</div>}

			{!loading && applications.length > 0 && (
				<div className="myapps-summary">
					<div className="myapps-chip"><strong>{counts.total}</strong><span>Total</span></div>
					<div className="myapps-chip"><strong>{counts.active}</strong><span>Active</span></div>
					<div className="myapps-chip"><strong>{counts.interview}</strong><span>Interview</span></div>
					<div className="myapps-chip"><strong>{counts.offer}</strong><span>Offer</span></div>
				</div>
			)}

			{loading ? (
				<div className="myapps-skeleton">
					{[0, 1, 2].map((i) => <div key={i} className="myapps-skel" style={{ "--i": i }} />)}
				</div>
			) : applications.length === 0 ? (
				<div className="ht-empty">
					<div className="ht-empty-mark" aria-hidden="true" />
					<h3>No applications yet</h3>
					<p>Browse open roles and apply — they'll show up here.</p>
				</div>
			) : (
				<div className="myapps-grid">
					{applications.map((app, i) => {
						const stage = toStage(app.status);
						const job = jobDetails[app.jobId] || {};
						const ivs = interviewsMap[app.id] || [];
						const upcoming = nextScheduled(ivs);
						return (
							<article key={app.id} className="myapp-card" style={{ "--i": i }}>
								<div className="myapp-top">
									<div className="myapp-title">
										<span className="myapp-appid">Application #{app.id}</span>
										<h3>{job.title || `Job #${app.jobId}`}</h3>
										{job.location && <span className="myapp-loc">📍 {job.location}</span>}
									</div>
									<span className={`ht-pill tone-${STAGE_TONE[stage]}`}>{STAGE_LABEL[stage] || humanize(app.status)}</span>
								</div>

								<div className="myapp-meta">
									<div><span>Applied</span><strong>{formatDate(app.appliedAt)}</strong></div>
									<div><span>Updated</span><strong>{formatDate(app.updatedAt)}</strong></div>
								</div>

								<div className="myapp-progress">
									<span>Progress</span>
									<strong>{progressText(ivs, app.status)}</strong>
									{upcoming?.scheduledAt && <p>{upcoming.round} · {formatDate(upcoming.scheduledAt)}</p>}
								</div>

								{upcoming && (
									<button className="ht-btn-success myapp-take" onClick={() => takeInterview(upcoming.id)}>
										Take {upcoming.round} interview
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

export default MyApplications;
