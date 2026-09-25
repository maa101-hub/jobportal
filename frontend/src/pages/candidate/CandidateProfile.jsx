import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import "./CandidateProfile.css";

import { jobService } from "../../services/api";
import { getInterviewsByApplication, getJobApplications } from "../../services/endpoints";
import { normalizeList, initials, formatDate, humanize, toStage } from "../../utils/helpers";
import { STAGE_TONE } from "../../utils/constants";

/* Candidate Profile — a detailed view of one applicant for a given application.
   Real data: the application (from the job's applications), the applied job,
   and the interview history. Resume/skills/education are display-only until the
   backend exposes candidate profile data. */

function CandidateProfile() {
	const { userId } = useParams();
	const [params] = useSearchParams();
	const navigate = useNavigate();
	const appId = params.get("appId");
	const jobId = params.get("jobId");

	const [application, setApplication] = useState(null);
	const [job, setJob] = useState(null);
	const [interviews, setInterviews] = useState([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		let alive = true;
		const load = async () => {
			setLoading(true);
			try {
				// Find the application within the job's application list.
				let app = null;
				if (jobId) {
					const apps = normalizeList((await getJobApplications(jobId)).data);
					app = apps.find((a) => String(a.id) === String(appId)) ||
						apps.find((a) => String(a.userId) === String(userId)) ||
						null;
				}
				if (!alive) return;
				setApplication(app);

				// Applied job details.
				const effectiveJobId = jobId || app?.jobId;
				if (effectiveJobId) {
					try {
						const jr = await jobService.getJobById(effectiveJobId);
						if (alive) setJob(jr.data?.data ?? jr.data);
					} catch { /* optional */ }
				}

				// Interview history for this application.
				if (appId || app?.id) {
					try {
						const iv = await getInterviewsByApplication(appId || app.id);
						if (alive) setInterviews(normalizeList(iv.data));
					} catch { /* optional */ }
				}
			} finally {
				if (alive) setLoading(false);
			}
		};
		load();
		return () => {
			alive = false;
		};
	}, [userId, appId, jobId]);

	// Build a timeline from the application status + interviews.
	const timeline = useMemo(() => {
		const items = [];
		if (application?.appliedAt) items.push({ label: "Applied", when: application.appliedAt, tone: "info" });
		interviews
			.slice()
			.sort((a, b) => new Date(a.scheduledAt || 0) - new Date(b.scheduledAt || 0))
			.forEach((iv) => {
				items.push({ label: `${iv.round} interview · ${humanize(iv.status)}`, when: iv.scheduledAt, tone: "brand" });
			});
		if (application?.status) {
			const s = String(application.status).toUpperCase();
			if (["OFFERED", "OFFER_RELEASED"].includes(s)) items.push({ label: "Offer released", when: application.updatedAt, tone: "pink" });
			if (s === "ACCEPTED") items.push({ label: "Offer accepted", when: application.updatedAt, tone: "teal" });
			if (s === "JOINED") items.push({ label: "Joined", when: application.updatedAt, tone: "green" });
			if (s === "REJECTED") items.push({ label: "Rejected", when: application.updatedAt, tone: "danger" });
		}
		return items;
	}, [application, interviews]);

	const stage = application ? toStage(application.status) : null;
	const skills = job?.techStack ? String(job.techStack).split(/[,/]/).map((s) => s.trim()).filter(Boolean) : [];

	return (
		<div className="ht-page profile-page">
			<header className="ht-page-head">
				<div>
					<button className="profile-back" onClick={() => navigate(-1)}>
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
						Back
					</button>
					<h2>Candidate Profile</h2>
					<p>Everything about this applicant in one place.</p>
				</div>
			</header>

			{loading ? (
				<div className="ht-panel profile-loading">Loading profile…</div>
			) : (
				<div className="profile-layout">
					{/* Identity card */}
					<aside className="profile-identity ht-panel">
						<span className="ht-avatar profile-avatar">{initials(`U${userId}`)}</span>
						<h3>Candidate {userId}</h3>
						<p className="profile-sub">External applicant</p>
						{stage && <span className={`ht-pill tone-${STAGE_TONE[stage]}`}>{humanize(application.status)}</span>}

						<div className="profile-contact">
							<div className="profile-contact-row"><span>User ID</span><strong>{userId}</strong></div>
							<div className="profile-contact-row"><span>Application</span><strong>{application ? `#${application.id}` : "—"}</strong></div>
							<div className="profile-contact-row"><span>Resume</span><strong>{application?.resumeUrl || <em className="soon">soon</em>}</strong></div>
							<div className="profile-contact-row"><span>Email</span><strong><em className="soon">soon</em></strong></div>
							<div className="profile-contact-row"><span>Phone</span><strong><em className="soon">soon</em></strong></div>
						</div>
					</aside>

					{/* Main */}
					<div className="profile-main">
						{/* Applied job */}
						<section className="ht-panel profile-block">
							<h4>Applied Job</h4>
							{job ? (
								<div className="profile-job">
									<div className="profile-job-head">
										<strong>{job.title || "Untitled role"}</strong>
										<span className="ht-pill tone-slate">#{job.id}</span>
									</div>
									<p>{job.description || "No description provided."}</p>
									<div className="profile-job-meta">
										{job.location && <span>📍 {job.location}</span>}
										{job.experience && <span>💼 {job.experience}</span>}
									</div>
								</div>
							) : (
								<p className="profile-muted">Job details unavailable.</p>
							)}
						</section>

						{/* Skills (from job stack — display-only) */}
						<section className="ht-panel profile-block">
							<h4>Skills <span className="soon">from job</span></h4>
							{skills.length ? (
								<div className="profile-skills">
									{skills.map((s, i) => <span key={i} className="stack-chip">{s}</span>)}
								</div>
							) : (
								<p className="profile-muted">No skills listed.</p>
							)}
						</section>

						{/* Timeline */}
						<section className="ht-panel profile-block">
							<h4>Application Timeline</h4>
							{timeline.length ? (
								<ol className="profile-timeline">
									{timeline.map((t, i) => (
										<li key={i} className={`profile-tl-item tone-${t.tone}`} style={{ "--i": i }}>
											<span className="profile-tl-dot" />
											<div className="profile-tl-content">
												<strong>{t.label}</strong>
												<span>{formatDate(t.when)}</span>
											</div>
										</li>
									))}
								</ol>
							) : (
								<p className="profile-muted">No timeline events yet.</p>
							)}
						</section>

						{/* Interview history */}
						<section className="ht-panel profile-block">
							<h4>Interview History</h4>
							{interviews.length ? (
								<div className="profile-interviews">
									{interviews.map((iv) => (
										<div key={iv.id} className="profile-interview">
											<span className="profile-iv-round">{iv.round}</span>
											<div className="profile-iv-body">
												<span className={`ht-pill tone-${["COMPLETED", "OFFERED"].includes(String(iv.status).toUpperCase()) ? "green" : "amber"}`}>{humanize(iv.status)}</span>
												{iv.feedback && <p className="profile-iv-feedback">{iv.feedback}</p>}
											</div>
											<span className="profile-iv-when">{formatDate(iv.scheduledAt)}</span>
										</div>
									))}
								</div>
							) : (
								<p className="profile-muted">No interviews recorded.</p>
							)}
						</section>

						{/* Education & experience — display-only */}
						<section className="ht-panel profile-block">
							<h4>Education &amp; Experience <span className="soon">soon</span></h4>
							<p className="profile-muted">Detailed candidate education and work history will appear here once captured at signup.</p>
						</section>
					</div>
				</div>
			)}
		</div>
	);
}

export default CandidateProfile;
