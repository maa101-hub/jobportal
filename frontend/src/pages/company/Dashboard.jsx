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
			setDisplay(target);
			return;
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
		<button className={`metric-card tone-${tone}`} style={{ "--i": index }} onClick={onClick}>
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
	const displayName = (user?.email || "there").split("@")[0];
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

			// Applications per job (best-effort, tolerant of failures).
			const jobIds = jobs.map((j) => j?.id).filter(Boolean);
			let apps = [];
			let appsFailed = false;
			if (jobIds.length) {
				const results = await Promise.allSettled(
					jobIds.map((id) => applicationService.getApplicationsByJob(id))
				);
				results.forEach((r) => {
					if (r.status === "fulfilled") apps = apps.concat(normalizeList(r.value.data));
					else appsFailed = true;
				});
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
			{/* Welcome banner */}
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
						onClick={() => navigate(role === "ADMIN" ? "/company/job-requests" : "/company/jobs")}
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
				<MetricCard tone="violet" index={0} icon={ICONS.requests} label="Job Requests" value={stats.jobRequests} note={loading ? "Loading…" : "Awaiting review"} onClick={() => navigate("/company/job-requests")} />
				<MetricCard tone="brand" index={1} icon={ICONS.jobs} label="Active Jobs" value={stats.activeJobs} note={loading ? "Loading…" : "Open for hiring"} onClick={() => navigate("/company/jobs")} />
				<MetricCard tone="pink" index={2} icon={ICONS.applications} label="Applications" value={stats.applications} note={loading ? "Loading…" : "Across all roles"} onClick={() => navigate("/company/applications")} />
				<MetricCard tone="teal" index={3} icon={ICONS.interview} label="Interviews" value={stats.interviews} note={loading ? "Loading…" : "In progress"} onClick={() => navigate("/company/interview")} />
				<MetricCard tone="green" index={4} icon={ICONS.offers} label="Offers" value={stats.offers} note={loading ? "Loading…" : "Extended"} onClick={() => navigate("/company/offers")} />
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

					{stats.applications === 0 ? (
						<div className="pipeline-empty">
							<span className="chart-empty-mark" aria-hidden="true" />
							<strong>No candidates in the pipeline yet</strong>
							<p>Publish a job and applications will flow through these stages.</p>
						</div>
					) : (
						<ul className="pipeline">
							{PIPELINE_STAGES.map((stage, i) => {
								const count = pipeline[stage] || 0;
								const pct = Math.round((count / maxStage) * 100);
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
