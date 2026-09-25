import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./CreateJob.css";

import { createJob } from "../../services/endpoints";
import { getRole, getCompanyId } from "../../utils/helpers";

const EMPLOYMENT_TYPES = ["Full-time", "Part-time", "Contract", "Internship"];

function CreateJob() {
	const navigate = useNavigate();
	const role = getRole();
	const companyId = getCompanyId();

	const [form, setForm] = useState({
		// Persisted to backend
		title: "",
		description: "",
		location: "",
		techStack: "", // built from skills
		experience: "",
		// Display-only (backend doesn't store these yet)
		responsibilities: "",
		requirements: "",
		skills: "",
		employmentType: "Full-time",
		salary: "",
		openings: 1,
		deadline: "",
		assignedTag: "",
	});
	const [submitting, setSubmitting] = useState(null); // 'draft' | 'review' | 'publish'
	const [message, setMessage] = useState(null);

	const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

	const submit = async (mode) => {
		setMessage(null);
		if (!companyId) {
			setMessage({ type: "error", text: "Company not found. Please sign in again." });
			return;
		}
		if (!form.title.trim()) {
			setMessage({ type: "error", text: "A job title is required." });
			return;
		}

		// Skills feed techStack; the backend now persists the richer fields too.
		const payload = {
			title: form.title,
			description: form.description,
			location: form.location,
			techStack: form.skills || form.techStack,
			experience: form.experience,
			companyId,
			salary: form.salary ? Number(String(form.salary).replace(/[^0-9.]/g, "")) || null : null,
			openings: form.openings ? Number(form.openings) : null,
			deadline: form.deadline || null,
			responsibilities: form.responsibilities || null,
			requirements: form.requirements || null,
			assignedTag: form.assignedTag || null,
		};

		setSubmitting(mode);
		try {
			await createJob(payload);
			const text =
				mode === "draft"
					? "Draft saved."
					: mode === "publish"
						? "Job published."
						: "Sent to TFG for review.";
			setMessage({ type: "success", text });
			setTimeout(() => navigate(mode === "review" ? "/company/job-requests" : "/company/jobs"), 900);
		} catch (err) {
			console.log(err);
			setMessage({ type: "error", text: "Couldn't create the job." });
		} finally {
			setSubmitting(null);
		}
	};

	return (
		<div className="ht-page createjob-page">
			<header className="ht-page-head">
				<div>
					<h2>Create Job</h2>
					<p>Draft a new opening. Send it to TFG for review before it goes live.</p>
				</div>
				<div className="ht-page-actions">
					<button type="button" className="ht-btn-ghost" onClick={() => navigate("/company/jobs")}>Cancel</button>
				</div>
			</header>

			{message && <div className={`createjob-banner ${message.type}`}>{message.text}</div>}

			<form className="createjob-form" onSubmit={(e) => e.preventDefault()}>
				{/* Basic Information */}
				<section className="form-section">
					<div className="form-section-head"><h3>Basic Information</h3><p>Title, type and where the role sits.</p></div>
					<div className="form-grid">
						<div className="form-field span-2">
							<label htmlFor="j-title">Job title</label>
							<input id="j-title" type="text" placeholder="Senior React Developer" value={form.title} onChange={set("title")} />
						</div>
						<div className="form-field">
							<label htmlFor="j-type">Employment type <span className="soon">soon</span></label>
							<select id="j-type" value={form.employmentType} onChange={set("employmentType")}>
								{EMPLOYMENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
							</select>
						</div>
						<div className="form-field">
							<label htmlFor="j-location">Location</label>
							<input id="j-location" type="text" placeholder="Bengaluru / Remote" value={form.location} onChange={set("location")} />
						</div>
						<div className="form-field">
							<label htmlFor="j-openings">Openings</label>
							<input id="j-openings" type="number" min="1" value={form.openings} onChange={set("openings")} />
						</div>
						<div className="form-field">
							<label htmlFor="j-deadline">Application deadline</label>
							<input id="j-deadline" type="date" value={form.deadline} onChange={set("deadline")} />
						</div>
					</div>
				</section>

				{/* Description & details */}
				<section className="form-section">
					<div className="form-section-head"><h3>Description &amp; Details</h3><p>What the role is and what success looks like.</p></div>
					<div className="form-grid">
						<div className="form-field span-2">
							<label htmlFor="j-desc">Job description</label>
							<textarea id="j-desc" rows="4" placeholder="Summarize the role and the team…" value={form.description} onChange={set("description")} />
						</div>
						<div className="form-field span-2">
							<label htmlFor="j-resp">Responsibilities</label>
							<textarea id="j-resp" rows="3" placeholder="One per line…" value={form.responsibilities} onChange={set("responsibilities")} />
						</div>
						<div className="form-field span-2">
							<label htmlFor="j-req">Requirements</label>
							<textarea id="j-req" rows="3" placeholder="Must-haves for this role…" value={form.requirements} onChange={set("requirements")} />
						</div>
					</div>
				</section>

				{/* Skills, experience, comp */}
				<section className="form-section">
					<div className="form-section-head"><h3>Skills, Experience &amp; Compensation</h3><p>Skills feed the job's tech stack.</p></div>
					<div className="form-grid">
						<div className="form-field span-2">
							<label htmlFor="j-skills">Skills</label>
							<input id="j-skills" type="text" placeholder="React, TypeScript, Node (comma separated)" value={form.skills} onChange={set("skills")} />
						</div>
						<div className="form-field">
							<label htmlFor="j-exp">Experience</label>
							<input id="j-exp" type="text" placeholder="3–5 years" value={form.experience} onChange={set("experience")} />
						</div>
						<div className="form-field">
							<label htmlFor="j-salary">Salary / CTC</label>
							<input id="j-salary" type="text" placeholder="e.g. 1800000" value={form.salary} onChange={set("salary")} />
						</div>
						<div className="form-field">
							<label htmlFor="j-tag">Assigned TAG</label>
							<input id="j-tag" type="text" placeholder="TAG member email" value={form.assignedTag} onChange={set("assignedTag")} />
						</div>
					</div>
				</section>

				<div className="form-actions">
					<span className="form-note">Employment type (marked <span className="soon">soon</span>) is display-only; all other fields are saved.</span>
					<div className="form-actions-btns">
						<button type="button" className="ht-btn-ghost" onClick={() => submit("draft")} disabled={!!submitting}>
							{submitting === "draft" ? "Saving…" : "Save Draft"}
						</button>
						<button type="button" onClick={() => submit("review")} disabled={!!submitting}>
							{submitting === "review" ? "Sending…" : "Send for TFG Review"}
						</button>
						{role === "ADMIN" && (
							<button type="button" className="ht-btn-success" onClick={() => submit("publish")} disabled={!!submitting}>
								{submitting === "publish" ? "Publishing…" : "Publish Job"}
							</button>
						)}
					</div>
				</div>
			</form>
		</div>
	);
}

export default CreateJob;
