import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Dashboard.css";

import { getUserApplications, getOfferByApplication } from "../../services/endpoints";
import { normalizeList, getUser, toStage, humanize, formatDate } from "../../utils/helpers";
import { PIPELINE_STAGES, STAGE_TONE } from "../../utils/constants";

const STAGE_LABEL = {
	NEW: "Applied", SCREENING: "In Review", SHORTLISTED: "Shortlisted",
	INTERVIEW: "Interview", SELECTED: "Selected", OFFER: "Offer", HIRED: "Hired",
};

const ICONS = {
	apps: (
		<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M6 3h9l3 3v15a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" /><path d="M14 3v4h4" /><path d="M8.5 13h7M8.5 16.5h5" /></svg>
	),
	interview: (
		<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M3 9h18M8 2v4M16 2v4" /></svg>
	),
	offers: (
		<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l2.4 4.9 5.4.8-3.9 3.8.9 5.4-4.8-2.5-4.8 2.5.9-5.4L3.8 8.7l5.4-.8z" /></svg>
	),
	browse: (
		<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></svg>
	),
};

function CandidateDashboard() {
	const navigate = useNavigate();
	const user = useMemo(() => getUser(), []);
	const displayName = (user?.email || "there").split("@")[0];
	const userId = useMemo(() => {
		const raw = user?.id ?? user?.userId ?? localStorage.getItem("userId");
		return raw ? Number(raw) : null;
	}, [user]);

	const [applications, setApplications] = useState([]);
	const [offerCount, setOfferCount] = useState(0);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		let alive = true;
		const load = async () => {
			if (!userId) {
				setLoading(false);
				return;
			}
			setLoading(true);
			try {
				const apps = normalizeList((await getUserApplications(userId)).data);
				if (!alive) return;
				setApplications(apps);

				// Count real offers across the candidate's applications.
				const offerResults = await Promise.allSettled(
					apps.map((a) => getOfferByApplication(a.id))
				);
				let offers = 0;
				offerResults.forEach((r) => {
					if (r.status === "fulfilled") {
						const o = r.value?.data?.data ?? r.value?.data;
						if (o && ["OFFER_RELEASED", "ACCEPTED", "JOINED"].includes(String(o.status || "").toUpperCase())) offers += 1;
					}
				});
				if (alive) setOfferCount(offers);
			} finally {
				if (alive) setLoading(false);
			}
		};
		load();
		return () => { alive = false; };
	}, [userId]);

	const dist = useMemo(() => {
		const d = PIPELINE_STAGES.reduce((acc, s) => ({ ...acc, [s]: 0 }), {});
		applications.forEach((a) => {
			if (String(a.status).toUpperCase() === "REJECTED") return;
			const stage = toStage(a.status);
			d[stage] = (d[stage] || 0) + 1;
		});
		return d;
	}, [applications]);

	const interviewCount = dist.INTERVIEW || 0;
	const maxStage = Math.max(1, ...PIPELINE_STAGES.map((s) => dist[s] || 0));
	const recent = applications.slice(0, 4);

	return (
		<div className="ht-page cand-dash">
			<section className="cand-welcome ht-glass">
				<div className="cand-welcome-copy">
					<h2>Hi, <span>{displayName}</span> 👋</h2>
					<p>Track your applications and offers, and find your next role.</p>
				</div>
				<button className="cand-browse-btn" onClick={() => navigate("/jobs")}>
					{ICONS.browse}
					Browse Jobs
				</button>
				<span className="cand-orb" aria-hidden="true" />
			</section>

			<section className="cand-stats">
				<button className="cand-stat tone-brand" onClick={() => navigate("/my-applications")}>
					<span className="cand-stat-icon">{ICONS.apps}</span>
					<span className="cand-stat-value">{applications.length}</span>
					<span className="cand-stat-label">Applications</span>
				</button>
				<button className="cand-stat tone-teal" onClick={() => navigate("/my-applications")}>
					<span className="cand-stat-icon">{ICONS.interview}</span>
					<span className="cand-stat-value">{interviewCount}</span>
					<span className="cand-stat-label">In Interview</span>
				</button>
				<button className="cand-stat tone-pink" onClick={() => navigate("/my-offers")}>
					<span className="cand-stat-icon">{ICONS.offers}</span>
					<span className="cand-stat-value">{offerCount}</span>
					<span className="cand-stat-label">Offers</span>
				</button>
			</section>

			<section className="cand-lower">
				<div className="cand-panel">
					<header className="cand-panel-head">
						<h3>Your Pipeline</h3>
						<p>Where your applications currently stand</p>
					</header>
					{applications.length === 0 ? (
						<div className="cand-pipeline-empty">
							<div className="ht-empty-mark" aria-hidden="true" />
							<strong>{loading ? "Loading…" : "No applications yet"}</strong>
							<p>Browse open roles and apply to get started.</p>
							{!loading && <button onClick={() => navigate("/jobs")}>Browse Jobs</button>}
						</div>
					) : (
						<ul className="cand-pipeline">
							{PIPELINE_STAGES.map((stage, i) => {
								const count = dist[stage] || 0;
								const pct = Math.round((count / maxStage) * 100);
								return (
									<li key={stage} className="cand-pipe-row" style={{ "--i": i }}>
										<span className="cand-pipe-label">{STAGE_LABEL[stage]}</span>
										<span className="cand-pipe-track">
											<span className={`cand-pipe-fill s${i}`} style={{ "--w": `${Math.max(pct, count ? 8 : 0)}%` }} />
										</span>
										<span className="cand-pipe-count">{count}</span>
									</li>
								);
							})}
						</ul>
					)}
				</div>

				<div className="cand-panel">
					<header className="cand-panel-head">
						<h3>Recent Applications</h3>
						<p>Your latest activity</p>
					</header>
					{recent.length === 0 ? (
						<p className="cand-muted">Nothing here yet.</p>
					) : (
						<ul className="cand-recent">
							{recent.map((app, i) => {
								const stage = toStage(app.status);
								return (
									<li key={app.id} className="cand-recent-item" style={{ "--i": i }}>
										<button onClick={() => navigate("/my-applications")}>
											<div className="cand-recent-info">
												<strong>Job #{app.jobId}</strong>
												<span>Applied {formatDate(app.appliedAt)}</span>
											</div>
											<span className={`ht-pill tone-${STAGE_TONE[stage]}`}>{humanize(app.status)}</span>
										</button>
									</li>
								);
							})}
						</ul>
					)}
				</div>
			</section>
		</div>
	);
}

export default CandidateDashboard;
