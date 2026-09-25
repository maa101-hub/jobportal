import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./TfgReview.css";

import { jobService } from "../../services/api";
import { normalizeList, getUser, getRole } from "../../utils/helpers";
import ConfirmDialog from "../../components/Toast/ConfirmDialog";

/* TFG Review — the approval gate. Lists jobs awaiting review (status CREATED)
   with their full details. Approve is a real backend action; Request Changes
   and Reject update the local queue and are flagged as pending backend support
   (no reject endpoint on jobs today). */

function TfgReview() {
	const navigate = useNavigate();
	const user = useMemo(() => getUser(), []);
	const role = getRole();

	const [jobs, setJobs] = useState([]);
	const [selectedId, setSelectedId] = useState(null);
	const [loading, setLoading] = useState(true);
	const [actionLoading, setActionLoading] = useState(false);
	const [toast, setToast] = useState(null);
	const [pendingReject, setPendingReject] = useState(null); // job

	const fetchQueue = useCallback(async () => {
		setLoading(true);
		try {
			const all = normalizeList((await jobService.getAllJobs()).data);
			const pending = all.filter((j) => String(j.status).toUpperCase() === "CREATED");
			setJobs(pending);
			setSelectedId((prev) => prev ?? pending[0]?.id ?? null);
		} catch (err) {
			console.log(err);
			setToast({ type: "error", text: "Couldn't load the review queue." });
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		fetchQueue();
	}, [fetchQueue]);

	const selected = jobs.find((j) => j.id === selectedId) || null;

	const flash = (type, text) => {
		setToast({ type, text });
		setTimeout(() => setToast(null), 2400);
	};

	const removeFromQueue = (id) => {
		setJobs((prev) => {
			const next = prev.filter((j) => j.id !== id);
			setSelectedId(next[0]?.id ?? null);
			return next;
		});
	};

	const approve = async (job) => {
		const approvedBy = user?.id ?? localStorage.getItem("userId");
		if (!approvedBy) {
			flash("error", "Your user ID wasn't found. Please sign in again.");
			return;
		}
		setActionLoading(true);
		try {
			await jobService.approveJob(job.id, approvedBy);
			flash("success", `Approved “${job.title}”. It's ready for hiring.`);
			removeFromQueue(job.id);
		} catch (err) {
			console.log(err);
			flash("error", "Couldn't approve this job.");
		} finally {
			setActionLoading(false);
		}
	};

	// Reject / request-changes both move the job to REJECTED on the backend.
	const requestChanges = async (job) => {
		setActionLoading(true);
		try {
			await jobService.rejectJob(job.id);
			flash("info", `Changes requested on “${job.title}” — sent back to Delivery.`);
			removeFromQueue(job.id);
		} catch (err) {
			console.log(err);
			flash("error", "Couldn't update this job.");
		} finally {
			setActionLoading(false);
		}
	};
	const reject = (job) => setPendingReject(job);

	const confirmReject = async () => {
		const job = pendingReject;
		setPendingReject(null);
		if (!job) return;
		setActionLoading(true);
		try {
			await jobService.rejectJob(job.id);
			flash("info", `Rejected “${job.title}”.`);
			removeFromQueue(job.id);
		} catch (err) {
			console.log(err);
			flash("error", "Couldn't reject this job.");
		} finally {
			setActionLoading(false);
		}
	};

	return (
		<div className="ht-page review-page">
			<header className="ht-page-head">
				<div>
					<h2>TFG Review</h2>
					<p>Review jobs from Delivery and decide what moves to hiring.</p>
				</div>
				<div className="ht-page-actions">
					<span className="review-count">{jobs.length} awaiting review</span>
				</div>
			</header>

			{toast && <div className={`review-toast ${toast.type}`}>{toast.text}</div>}

			{loading ? (
				<div className="ht-panel review-loading">Loading review queue…</div>
			) : jobs.length === 0 ? (
				<div className="ht-empty">
					<div className="ht-empty-mark" aria-hidden="true" />
					<h3>Nothing to review</h3>
					<p>When Delivery sends jobs for review, they'll queue up here.</p>
				</div>
			) : (
				<div className="review-layout">
					{/* Queue list */}
					<aside className="review-queue">
						{jobs.map((job, i) => (
							<button
								key={job.id}
								className={`review-queue-item ${job.id === selectedId ? "active" : ""}`}
								onClick={() => setSelectedId(job.id)}
								style={{ "--i": i }}
							>
								<span className="rq-title">{job.title || "Untitled role"}</span>
								<span className="rq-sub">#{job.id} · {job.location || "—"}</span>
							</button>
						))}
					</aside>

					{/* Detail */}
					{selected && (
						<section className="review-detail ht-panel" key={selected.id}>
							<div className="review-detail-head">
								<div>
									<span className="ht-pill tone-amber">Awaiting Review</span>
									<h3>{selected.title || "Untitled role"}</h3>
									<p className="review-detail-id">Request #{selected.id}</p>
								</div>
							</div>

							<div className="review-facts">
								<div className="review-fact"><span>Location</span><strong>{selected.location || "—"}</strong></div>
								<div className="review-fact"><span>Experience</span><strong>{selected.experience || "—"}</strong></div>
								<div className="review-fact"><span>Openings</span><strong>{selected.openings || 1}</strong></div>
								<div className="review-fact"><span>Created</span><strong>{selected.createdDate || "—"}</strong></div>
							</div>

							<div className="review-block">
								<h4>Description</h4>
								<p>{selected.description || "No description provided."}</p>
							</div>

							{selected.techStack && (
								<div className="review-block">
									<h4>Skills &amp; Stack</h4>
									<div className="review-stack">
										{String(selected.techStack).split(/[,/]/).map((t, idx) =>
											t.trim() ? <span key={idx} className="stack-chip">{t.trim()}</span> : null
										)}
									</div>
								</div>
							)}

							<div className="review-actions">
								<button className="ht-btn-danger" onClick={() => reject(selected)} disabled={actionLoading}>Reject</button>
								<button className="ht-btn-ghost" onClick={() => requestChanges(selected)} disabled={actionLoading}>Request Changes</button>
								<button className="ht-btn-success" onClick={() => approve(selected)} disabled={actionLoading}>
									{actionLoading ? "Approving…" : "Approve Job"}
								</button>
							</div>
						</section>
					)}
				</div>
			)}
			<ConfirmDialog
				open={!!pendingReject}
				title="Reject this job?"
				message={pendingReject ? `“${pendingReject.title}” will be sent back to Delivery as rejected.` : ""}
				confirmLabel="Reject job"
				onConfirm={confirmReject}
				onCancel={() => setPendingReject(null)}
			/>
		</div>
	);
}

export default TfgReview;
