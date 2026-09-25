import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./CompanyJobs.css";

import { jobService } from "../../services/api";
import { normalizeList, getUser, getRole, getCompanyId, humanize } from "../../utils/helpers";
import { useToast } from "../../components/Toast/ToastContext";

const STATUS_TONE = {
	CREATED: "amber",
	APPROVED: "brand",
	OPEN: "green",
	CLOSED: "slate",
	REJECTED: "danger",
};

function CompanyJobs() {
	const navigate = useNavigate();
	const toast = useToast();
	const user = useMemo(() => getUser(), []);
	const role = getRole();
	const companyId = getCompanyId();

	const [jobs, setJobs] = useState([]);
	const [loading, setLoading] = useState(true);
	const [actionLoading, setActionLoading] = useState(null);
	const [message, setMessage] = useState("");

	const fetchJobs = useCallback(async () => {
		setLoading(true);
		setMessage("");
		try {
			const useCompany = role === "DELIVERY" && companyId;
			const res = useCompany
				? await jobService.getCompanyJobs(companyId)
				: await jobService.getAllJobs();
			const all = normalizeList(res.data);

			// Role-based visibility (preserved from original logic).
			let visible =
				role === "TFG"
					? all.filter((j) => String(j.status).toUpperCase() === "CREATED")
					: role === "TAG"
						? all.filter((j) => ["APPROVED", "OPEN"].includes(String(j.status).toUpperCase()))
						: all;

			if (role === "ADMIN" && companyId && visible.length === 0) {
				const fb = normalizeList((await jobService.getAllJobs()).data);
				visible = fb;
				if (fb.length) setMessage("No company-specific jobs — showing all jobs.");
			}
			setJobs(visible);
		} catch (err) {
			console.log(err);
			setMessage("Couldn't load jobs. Check that the backend is running.");
		} finally {
			setLoading(false);
		}
	}, [role, companyId]);

	useEffect(() => {
		fetchJobs();
	}, [fetchJobs]);

	const handleApprove = async (jobId) => {
		const approvedBy = user?.id ?? localStorage.getItem("userId");
		if (!approvedBy) {
			toast.error("Please sign in again to approve jobs.");
			return;
		}
		try {
			setActionLoading(`approve-${jobId}`);
			await jobService.approveJob(jobId, approvedBy);
			toast.success("Job approved.");
			await fetchJobs();
		} catch (err) {
			console.log(err);
			toast.error("Couldn't approve the job.");
		} finally {
			setActionLoading(null);
		}
	};

	const handleClose = async (jobId) => {
		try {
			setActionLoading(`close-${jobId}`);
			await jobService.closeJob(jobId);
			toast.success("Job closed.");
			await fetchJobs();
		} catch (err) {
			console.log(err);
			toast.error("Couldn't close the job.");
		} finally {
			setActionLoading(null);
		}
	};

	const canApprove = role === "ADMIN" || role === "TFG";
	const canClose = role === "ADMIN" || role === "TAG";

	const subtitle =
		role === "DELIVERY"
			? "Create jobs and track them through review and hiring."
			: role === "TFG"
				? "Review and approve jobs before they go live."
				: role === "TAG"
					? "Manage open jobs and close them once hiring is done."
					: "Full control over every job and its lifecycle.";

	return (
		<div className="ht-page jobs-page">
			<header className="ht-page-head">
				<div>
					<h2>Company Jobs</h2>
					<p>{subtitle}</p>
				</div>
				<div className="ht-page-actions">
					<span className="jobs-role-chip">{role || "TEAM"}</span>
					<span className="jobs-count-chip">{jobs.length} job{jobs.length === 1 ? "" : "s"}</span>
					{(role === "DELIVERY" || role === "ADMIN") && (
						<button onClick={() => navigate("/company/create-job")}>
							<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 16, height: 16 }}>
								<path d="M12 5v14M5 12h14" />
							</svg>
							Create Job
						</button>
					)}
				</div>
			</header>

			{message && <div className="jobs-banner">{message}</div>}

			{loading ? (
				<div className="jobs-skeleton">
					{[0, 1, 2, 3].map((i) => <div key={i} className="jobs-skel" style={{ "--i": i }} />)}
				</div>
			) : jobs.length === 0 ? (
				<div className="ht-empty">
					<div className="ht-empty-mark" aria-hidden="true" />
					<h3>No jobs to show</h3>
					<p>{role === "DELIVERY" || role === "ADMIN" ? "Create a job to get started." : "Jobs will appear here as they move through the workflow."}</p>
				</div>
			) : (
				<div className="jobs-grid">
					{jobs.map((job, i) => {
						const status = String(job.status || "CREATED").toUpperCase();
						const tone = STATUS_TONE[status] || "slate";
						const isApproving = actionLoading === `approve-${job.id}`;
						const isClosing = actionLoading === `close-${job.id}`;
						const showApprove = canApprove && ["CREATED", "REJECTED"].includes(status);
						const showClose = canClose && ["APPROVED", "OPEN"].includes(status);

						return (
							<article key={job.id} className="job-card" style={{ "--i": i }}>
								<div className="job-card-top">
									<div className="job-title-wrap">
										<h3>{job.title || "Untitled role"}</h3>
										<span className="job-id">#{job.id}</span>
									</div>
									<span className={`ht-pill tone-${tone}`}>{humanize(status)}</span>
								</div>

								<p className="job-description">{job.description || "No description provided."}</p>

								<div className="job-tags">
									{job.location && <span className="job-tag">📍 {job.location}</span>}
									{job.experience && <span className="job-tag">💼 {job.experience}</span>}
								</div>

								{job.techStack && (
									<div className="job-stack">
										{String(job.techStack).split(/[,/]/).map((t, idx) =>
											t.trim() ? <span key={idx} className="stack-chip">{t.trim()}</span> : null
										)}
									</div>
								)}

								<div className="job-actions">
									<button className="ht-btn-ghost job-view-btn" onClick={() => navigate(`/company/applications?jobId=${job.id}`)}>
										View Applications
									</button>
									{showApprove && (
										<button className="ht-btn-success" onClick={() => handleApprove(job.id)} disabled={isApproving}>
											{isApproving ? "Approving…" : "Approve"}
										</button>
									)}
									{showClose && (
										<button className="ht-btn-danger" onClick={() => handleClose(job.id)} disabled={isClosing}>
											{isClosing ? "Closing…" : "Close"}
										</button>
									)}
								</div>
							</article>
						);
					})}
				</div>
			)}
		</div>
	);
}

export default CompanyJobs;
