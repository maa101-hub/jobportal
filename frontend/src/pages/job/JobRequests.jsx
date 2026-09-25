import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./JobRequests.css";
import { jobService } from "../../services/api";
import { normalizeList, getRole, getCompanyId, formatDate } from "../../utils/helpers";

/* Job Requests = the pre-approval slice of the job lifecycle.
   The backend has no separate "request" entity, so a request IS a job whose
   status is CREATED (Delivery has drafted it, TFG hasn't approved yet).
   Fields the backend doesn't store (company, openings, priority) are derived
   for display and clearly labelled. */

const REQUEST_STATUS = {
	CREATED: { label: "Sent for Review", tone: "amber" },
	REJECTED: { label: "Changes Requested", tone: "danger" },
	APPROVED: { label: "Approved", tone: "green" },
	OPEN: { label: "Approved", tone: "green" },
	CLOSED: { label: "Closed", tone: "slate" },
};

// Derive a stable pseudo-priority from the job id so the UI is consistent.
const priorityFor = (id) => {
	const p = ["High", "Medium", "Low"];
	return p[Number(id || 0) % 3];
};

function JobRequests() {
	const navigate = useNavigate();
	const role = getRole();
	const companyId = getCompanyId();

	const [jobs, setJobs] = useState([]);
	const [loading, setLoading] = useState(true);
	const [filter, setFilter] = useState("ALL");
	const [error, setError] = useState("");

	useEffect(() => {
		let alive = true;
		const load = async () => {
			setLoading(true);
			try {
				const res =
					role === "DELIVERY" && companyId
						? await jobService.getCompanyJobs(companyId)
						: await jobService.getAllJobs();
				if (!alive) return;
				setJobs(normalizeList(res.data));
				setError("");
			} catch (err) {
				console.log(err);
				if (alive) setError("Couldn't load job requests.");
			} finally {
				if (alive) setLoading(false);
			}
		};
		load();
		return () => {
			alive = false;
		};
	}, [role, companyId]);

	// Requests are everything not yet closed; we surface CREATED/REJECTED first.
	const requests = useMemo(
		() =>
			jobs
				.map((j) => ({ ...j, _status: String(j.status || "CREATED").toUpperCase() }))
				.filter((j) => j._status !== "CLOSED"),
		[jobs]
	);

	const counts = useMemo(() => {
		const c = { ALL: requests.length, CREATED: 0, APPROVED: 0, REJECTED: 0 };
		requests.forEach((j) => {
			if (j._status === "CREATED") c.CREATED += 1;
			else if (j._status === "REJECTED") c.REJECTED += 1;
			else c.APPROVED += 1;
		});
		return c;
	}, [requests]);

	const shown = useMemo(() => {
		if (filter === "ALL") return requests;
		if (filter === "APPROVED") return requests.filter((j) => ["APPROVED", "OPEN"].includes(j._status));
		return requests.filter((j) => j._status === filter);
	}, [requests, filter]);

	const filters = [
		{ key: "ALL", label: "All", n: counts.ALL },
		{ key: "CREATED", label: "Sent for Review", n: counts.CREATED },
		{ key: "APPROVED", label: "Approved", n: counts.APPROVED },
		{ key: "REJECTED", label: "Changes Requested", n: counts.REJECTED },
	];

	return (
		<div className="ht-page requests-page">
			<header className="ht-page-head">
				<div>
					<h2>Job Requests</h2>
					<p>Hiring requirements moving from Delivery through TFG review.</p>
				</div>
				{(role === "DELIVERY" || role === "ADMIN") && (
					<div className="ht-page-actions">
						<button onClick={() => navigate("/company/create-job")}>
							<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 16, height: 16 }}>
								<path d="M12 5v14M5 12h14" />
							</svg>
							New Request
						</button>
					</div>
				)}
			</header>

			{error && <div className="requests-banner">{error}</div>}

			<div className="requests-filters">
				{filters.map((f) => (
					<button
						key={f.key}
						className={`requests-filter ${filter === f.key ? "active" : ""}`}
						onClick={() => setFilter(f.key)}
					>
						{f.label}
						<span className="requests-filter-n">{f.n}</span>
					</button>
				))}
			</div>

			{loading ? (
				<div className="requests-skeleton">
					{[0, 1, 2].map((i) => <div key={i} className="requests-skel" style={{ "--i": i }} />)}
				</div>
			) : shown.length === 0 ? (
				<div className="ht-empty">
					<div className="ht-empty-mark" aria-hidden="true" />
					<h3>No job requests here</h3>
					<p>New requirements from Delivery will show up in this queue.</p>
				</div>
			) : (
				<div className="requests-table ht-panel">
					<div className="requests-row requests-head">
						<span>Request</span>
						<span>Position</span>
						<span>Openings</span>
						<span>Experience</span>
						<span>Location</span>
						<span>Priority</span>
						<span>Status</span>
					</div>
					{shown.map((job, i) => {
						const meta = REQUEST_STATUS[job._status] || REQUEST_STATUS.CREATED;
						const priority = priorityFor(job.id);
						return (
							<div
								key={job.id}
								className="requests-row requests-item"
								style={{ "--i": i }}
								onClick={() =>
									navigate(role === "TFG" || role === "ADMIN" ? "/company/review" : "/company/jobs")
								}
								role="button"
								tabIndex={0}
							>
								<span className="req-id">#{job.id}</span>
								<span className="req-position">
									<strong>{job.title || "Untitled role"}</strong>
									<small>{formatDate(job.createdDate)}</small>
								</span>
								<span data-label="Openings">{job.openings || 1}</span>
								<span data-label="Experience">{job.experience || "—"}</span>
								<span data-label="Location">{job.location || "—"}</span>
								<span data-label="Priority">
									<span className={`ht-pill tone-${priority === "High" ? "danger" : priority === "Medium" ? "amber" : "slate"}`}>
										{priority}
									</span>
								</span>
								<span data-label="Status">
									<span className={`ht-pill tone-${meta.tone}`}>{meta.label}</span>
								</span>
							</div>
						);
					})}
				</div>
			)}
		</div>
	);
}

export default JobRequests;
