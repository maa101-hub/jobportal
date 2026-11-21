import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Dashboard.css";

import { applicationService, jobService } from "../../services/api";
import { normalizeList, getUser, getRole, getCompanyId, toStage } from "../../utils/helpers";
import { PIPELINE_STAGES } from "../../utils/constants";

/* Count-up hook — animates 0 -> value once, snapping under reduced-motion. */
function useCountUp(value, duration = 900) {
	const [display, setDisplay] = useState(0);
	const frame = useRef(0);
	useEffect(() => {
		const target = Number(value) || 0;
		const reduce =
			typeof window !== "undefined" &&
			window.matchMedia &&
			window.matchMedia("(prefers-reduced-motion: reduce)").matches;
		if (reduce || target === 0) {
			const snap = requestAnimationFrame(() => setDisplay(target));
			return () => cancelAnimationFrame(snap);
		}
		const start = performance.now();
		const tick = (now) => {
			const t = Math.min(1, (now - start) / duration);
			const eased = 1 - Math.pow(1 - t, 3);
			setDisplay(Math.round(eased * target));
			if (t < 1) frame.current = requestAnimationFrame(tick);
		};
		frame.current = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(frame.current);
	}, [value, duration]);
	return display;
}

const ICONS = {
	requests: (
		<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
			<rect x="4" y="3" width="16" height="18" rx="2" /><path d="M8 8h8M8 12h8M8 16h5" />
		</svg>
	),
	jobs: (
		<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
			<rect x="3" y="7" width="18" height="13" rx="2" /><path d="M8 7V5.5A1.5 1.5 0 0 1 9.5 4h5A1.5 1.5 0 0 1 16 5.5V7" /><path d="M3 12h18" />
		</svg>
	),
	applications: (
		<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
			<path d="M6 3h9l3 3v15a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" /><path d="M14 3v4h4" /><path d="M8.5 13h7M8.5 16.5h5" />
		</svg>
	),
	interview: (
		<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
			<rect x="3" y="4" width="18" height="16" rx="2" /><path d="M3 9h18M8 2v4M16 2v4" /><path d="M8 14h4" />
		</svg>
	),
	offers: (
		<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
			<path d="M12 3l2.4 4.9 5.4.8-3.9 3.8.9 5.4-4.8-2.5-4.8 2.5.9-5.4L3.8 8.7l5.4-.8z" />
		</svg>
	),
};

function MetricCard({ tone, icon, label, value, note, index, onClick }) {
	const shown = useCountUp(value);
	return (
		<button className={`metric-card tone-${tone}${onClick ? "" : " is-disabled"}`} style={{ "--i": index }} onClick={onClick} disabled={!onClick} aria-label={onClick ? `Open ${label}` : `${label} summary`}>
			<div className="metric-top">
				<span className="metric-icon" aria-hidden="true">{icon}</span>
				<span className="metric-arrow" aria-hidden="true">
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 6 15 12 9 18" /></svg>
				</span>
			</div>
			<span className="metric-label">{label}</span>
			<strong className="metric-value">{shown}</strong>
			<small className="metric-note">{note}</small>
		</button>
	);
}

function Dashboard() {
	const navigate = useNavigate();
	const user = useMemo(() => getUser(), []);
	const role = getRole();
	const roleRoutes = useMemo(() => ({
		jobRequests: role === "TFG" ? "/company/review" : ["DELIVERY", "ADMIN"].includes(role) ? "/company/job-requests" : null,
		activeJobs: ["DELIVERY", "TFG", "TAG", "ADMIN"].includes(role) ? "/company/jobs" : null,
		applications: ["TAG", "ADMIN"].includes(role) ? "/company/applications" : null,
		interviews: ["TAG", "ADMIN"].includes(role) ? "/company/interview" : null,
		offers: ["TAG", "ADMIN"].includes(role) ? "/company/offers" : null,
		workQueue: role === "TFG" ? "/company/review" : role === "TAG" ? "/company/applications" : role === "DELIVERY" ? "/company/create-job" : "/company/job-requests",
	}), [role]);
	const displayName = (user?.email || "there").split("@")[0];
	const todayLabel = useMemo(() => new Intl.DateTimeFormat("en-IN", { weekday: "long", day: "numeric", month: "long" }).format(new Date()), []);
	const companyId = getCompanyId();

	const [stats, setStats] = useState({
		jobRequests: 0,
		activeJobs: 0,
		applications: 0,
		interviews: 0,
		offers: 0,
	});
	const [pipeline, setPipeline] = useState(() =>
		PIPELINE_STAGES.reduce((acc, s) => ({ ...acc, [s]: 0 }), {})
	);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [showPipelineDemo, setShowPipelineDemo] = useState(false);

	useEffect(() => {
		let alive = true;
		const load = async () => {
			setLoading(true);
			setError("");

			const [jobsRes] = await Promise.allSettled([
				companyId ? jobService.getCompanyJobs(companyId) : jobService.getAllJobs(),
			]);

			const jobs = jobsRes.status === "fulfilled" ? normalizeList(jobsRes.value.data) : [];

			const jobRequests = jobs.filter((j) => String(j.status).toUpperCase() === "CREATED").length;
			const activeJobs = jobs.filter((j) =>
				["APPROVED", "OPEN"].includes(String(j.status).toUpperCase())
			).length;

			// Applications per job — single batch request instead of N+1.
			const jobIds = jobs.map((j) => j?.id).filter(Boolean);
			let apps = [];
			let appsFailed = false;
			if (jobIds.length) {
				try {
					const appsRes = await applicationService.getApplicationsByJobIds(jobIds);
					apps = normalizeList(appsRes.data);
				} catch {
					appsFailed = true;
				}
			}

			// Derive pipeline distribution + interview/offer counts from statuses.
			const dist = PIPELINE_STAGES.reduce((acc, s) => ({ ...acc, [s]: 0 }), {});
			let interviews = 0;
			let offers = 0;
			apps.forEach((a) => {
				const stage = toStage(a.status);
				dist[stage] = (dist[stage] || 0) + 1;
				if (stage === "INTERVIEW") interviews += 1;
				if (stage === "OFFER" || stage === "HIRED") offers += 1;
			});

			if (!alive) return;
			setStats({
				jobRequests,
				activeJobs,
				applications: apps.length,
				interviews,
				offers,
			});
			setPipeline(dist);
			if (jobsRes.status === "rejected") setError("Couldn't load jobs. Showing what's available.");
			else if (appsFailed) setError("Some application data couldn't be loaded.");
			setLoading(false);
		};
		load();
		return () => {
			alive = false;
		};
	}, [companyId]);

	const maxStage = Math.max(1, ...PIPELINE_STAGES.map((s) => pipeline[s] || 0));
	const previewPipeline = { NEW: 12, SCREENING: 8, SHORTLISTED: 6, INTERVIEW: 5, SELECTED: 3, OFFER: 2, HIRED: 1 };
	const visiblePipeline = showPipelineDemo ? previewPipeline : pipeline;
	const visibleMaxStage = Math.max(1, ...PIPELINE_STAGES.map((s) => visiblePipeline[s] || 0));

	const nextActions = useMemo(() => {
		const actions = [];
		if (role === "TFG" || role === "ADMIN") {
			actions.push({
				label: stats.jobRequests ? `Review ${stats.jobRequests} job request${stats.jobRequests > 1 ? "s" : ""}` : "Review job requests",
				detail: stats.jobRequests ? "Keep the approval gate moving" : "Nothing is waiting right now",
				to: role === "TFG" ? "/company/review" : "/company/job-requests",
				tone: "amber",
			});
		}
		if (role === "TAG" || role === "ADMIN") {
			actions.push({
				label: stats.applications ? `Review ${stats.applications} application${stats.applications > 1 ? "s" : ""}` : "Open applications",
				detail: stats.applications ? "Move candidates to their next stage" : "Applications will appear here",
				to: "/company/applications",
				tone: "pink",
			});
			actions.push({
				label: stats.interviews ? `${stats.interviews} interview${stats.interviews > 1 ? "s" : ""} need attention` : "Check interview queue",
				detail: stats.interviews ? "Capture feedback before the next decision" : "Schedule the next round",
				to: "/company/interview",
				tone: "teal",
			});
		}
		if (role === "DELIVERY") {
			actions.push({
				label: stats.jobRequests ? "Turn a request into a job" : "Create a new job",
				detail: "Give the hiring team a clear role to review",
				to: stats.jobRequests ? "/company/job-requests" : "/company/create-job",
				tone: "brand",
			});
		}
		return actions;
	}, [role, stats]);

	const activity = [
		{
			tone: "brand", icon: ICONS.requests,
			title: stats.jobRequests > 0 ? `${stats.jobRequests} open job request${stats.jobRequests > 1 ? "s" : ""}` : "No job requests",
			desc: stats.jobRequests > 0 ? "Awaiting creation or review" : "Requirements will appear here",
			to: "/company/job-requests",
		},
		{
			tone: "amber", icon: ICONS.jobs,
			title: stats.activeJobs > 0 ? `${stats.activeJobs} active job${stats.activeJobs > 1 ? "s" : ""}` : "No active jobs",
			desc: stats.activeJobs > 0 ? "Approved and open for hiring" : "Create a job to start hiring",
			to: "/company/jobs",
		},
		{
			tone: "pink", icon: ICONS.applications,
			title: stats.applications > 0 ? `${stats.applications} application${stats.applications > 1 ? "s" : ""}` : "No applications",
			desc: stats.applications > 0 ? "Move candidates through the pipeline" : "Applications will appear here",
			to: "/company/applications",
		},
		{
			tone: "teal", icon: ICONS.interview,
			title: stats.interviews > 0 ? `${stats.interviews} in interview` : "No interviews",
			desc: stats.interviews > 0 ? "Track rounds and feedback" : "Schedule interviews for candidates",
			to: "/company/interview",
		},
	];

	return (
		<div className="ht-page company-dashboard-page">
			<section className="dashboard-top">
				<div className="dashboard-greeting">
					<small>{todayLabel}</small>
					<h2>Good to see you <span className="wave">👋</span></h2>
				</div>
				<button className="dashboard-new-job" onClick={() => navigate(roleRoutes.workQueue)}>
					<span aria-hidden="true">+</span> New job request
				</button>
			</section>

			{/* Legacy welcome banner kept for behavior compatibility; reference header replaces it visually. */}
			<section className="welcome-banner ht-glass">
				<div className="welcome-copy">
					<h2>Welcome back, <span>{displayName}</span> <span className="wave">👋</span></h2>
					<p>Here's what's happening across your recruitment pipeline today.</p>
				</div>
				<div className="welcome-cta">
					<div className="welcome-cta-text">
						<strong>Move faster</strong>
						<span>Jump to the next step in your hiring flow.</span>
					</div>
					<button
						className="welcome-cta-btn"
						onClick={() => navigate(roleRoutes.workQueue)}
						aria-label="Go to work queue"
					>
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
					</button>
				</div>
				<span className="welcome-orb orb-1" aria-hidden="true" />
				<span className="welcome-orb orb-2" aria-hidden="true" />
			</section>

			{error && <div className="dashboard-banner">{error}</div>}

			{/* Metric row */}
			<section className="dashboard-grid">
				<MetricCard tone="violet" index={0} icon={ICONS.requests} label="Job Requests" value={stats.jobRequests} note={loading ? "Loading…" : "Awaiting review"} onClick={roleRoutes.jobRequests ? () => navigate(roleRoutes.jobRequests) : undefined} />
				<MetricCard tone="brand" index={1} icon={ICONS.jobs} label="Active Jobs" value={stats.activeJobs} note={loading ? "Loading…" : "Open for hiring"} onClick={roleRoutes.activeJobs ? () => navigate(roleRoutes.activeJobs) : undefined} />
				<MetricCard tone="pink" index={2} icon={ICONS.applications} label="Applications" value={stats.applications} note={loading ? "Loading…" : "Across all roles"} onClick={roleRoutes.applications ? () => navigate(roleRoutes.applications) : undefined} />
				<MetricCard tone="teal" index={3} icon={ICONS.interview} label="Interviews" value={stats.interviews} note={loading ? "Loading…" : "In progress"} onClick={roleRoutes.interviews ? () => navigate(roleRoutes.interviews) : undefined} />
				<MetricCard tone="green" index={4} icon={ICONS.offers} label="Offers" value={stats.offers} note={loading ? "Loading…" : "Extended"} onClick={roleRoutes.offers ? () => navigate(roleRoutes.offers) : undefined} />
			</section>

			<section className="next-actions-card" aria-labelledby="next-actions-title">
				<header className="panel-head">
					<div className="panel-head-left">
						<span className="panel-icon next-actions-icon" aria-hidden="true">
							<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /><path d="M5 6v12" /></svg>
						</span>
						<div>
							<h3 id="next-actions-title">Next actions</h3>
							<p>Keep the hiring workflow moving from one clear queue.</p>
						</div>
					</div>
				</header>
				{nextActions.length ? (
					<div className="next-actions-grid">
						{nextActions.map((action, i) => (
							<button key={action.to} className="next-action" style={{ "--i": i }} onClick={() => navigate(action.to)}>
								<span className={`next-action-dot tone-${action.tone}`} aria-hidden="true" />
								<span className="next-action-copy"><strong>{action.label}</strong><span>{action.detail}</span></span>
								<svg className="next-action-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="9 6 15 12 9 18" /></svg>
							</button>
						))}
					</div>
				) : <p className="next-actions-empty">Your workspace is ready. New workflow actions will appear here.</p>}
			</section>

			{/* Pipeline + activity */}
			<section className="dashboard-lower">
				<div className="overview-card">
					<header className="panel-head">
						<div className="panel-head-left">
							<span className="panel-icon" aria-hidden="true">
								<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /></svg>
							</span>
							<div>
								<h3>Hiring Pipeline</h3>
								<p>Candidates by stage, from new to hired</p>
							</div>
						</div>
					</header>

					{stats.applications === 0 && !showPipelineDemo ? (
						<div className="pipeline-empty">
							<span className="chart-empty-mark" aria-hidden="true" />
							<strong>No candidates in the pipeline yet</strong>
							<p>Publish a job and applications will flow through these stages.</p>
							<button className="pipeline-preview" onClick={() => setShowPipelineDemo(true)}>Preview with sample data</button>
						</div>
					) : (
						<ul className="pipeline">
							{PIPELINE_STAGES.map((stage, i) => {
								const count = visiblePipeline[stage] || 0;
								const pct = Math.round((count / visibleMaxStage) * 100);
								return (
									<li key={stage} className="pipeline-row" style={{ "--i": i }}>
										<span className="pipeline-label">{stage.charAt(0) + stage.slice(1).toLowerCase()}</span>
										<span className="pipeline-track">
											<span className={`pipeline-fill s${i}`} style={{ "--w": `${Math.max(pct, count ? 8 : 0)}%` }} />
										</span>
										<span className="pipeline-count">{count}</span>
									</li>
								);
							})}
						</ul>
					)}
				</div>

				<div className="activity-card">
					<header className="panel-head">
						<div className="panel-head-left">
							<span className="panel-icon" aria-hidden="true">
								<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
							</span>
							<div>
								<h3>Recent Activity</h3>
								<p>Latest updates from your hiring process</p>
							</div>
						</div>
					</header>

					<ul className="activity-list">
						{activity.map((item, i) => (
							<li key={item.title} className="activity-item" style={{ "--i": i }}>
								<button className="activity-btn" onClick={() => navigate(item.to)}>
									<span className={`activity-icon tone-${item.tone}`} aria-hidden="true">{item.icon}</span>
									<span className="activity-text">
										<strong>{item.title}</strong>
										<span>{item.desc}</span>
									</span>
									<svg className="activity-go" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="9 6 15 12 9 18" /></svg>
								</button>
							</li>
						))}
					</ul>
				</div>
			</section>
		</div>
	);
}

export default Dashboard;
