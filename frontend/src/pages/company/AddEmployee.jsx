import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./AddEmployee.css";
import { addEmployee } from "../../services/endpoints";
import { getCompanyId } from "../../utils/helpers";
import { TEAM_ROLES, ROLE_LABELS, ROLE_DESCRIPTIONS } from "../../utils/constants";

const DEPARTMENTS = ["Recruitment", "Delivery", "Talent Acquisition", "Operations", "Management"];

function AddTeamMember() {
	const navigate = useNavigate();
	const companyId = getCompanyId();

	const [form, setForm] = useState({
		// Persisted to backend
		name: "",
		email: "",
		password: "",
		role: "DELIVERY",
		status: "ACTIVE",
		// Display-only for now (backend doesn't store these yet)
		phone: "",
		department: "Recruitment",
		location: "",
		employeeId: "",
	});
	const [submitting, setSubmitting] = useState(false);
	const [message, setMessage] = useState(null); // { type, text }

	const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

	const handleSubmit = async (e) => {
		e.preventDefault();
		setMessage(null);

		if (!companyId) {
			setMessage({ type: "error", text: "Company not found. Please sign in again." });
			return;
		}
		if (!form.name || !form.email || !form.password) {
			setMessage({ type: "error", text: "Name, email and password are required." });
			return;
		}

		setSubmitting(true);
		try {
			// The backend now persists the full profile.
			const payload = {
				name: form.name,
				email: form.email,
				password: form.password,
				role: form.role,
				status: form.status,
				phone: form.phone || null,
				department: form.department || null,
				location: form.location || null,
				employeeId: form.employeeId || null,
			};
			const res = await addEmployee(companyId, payload);
			const text = typeof res.data === "string" ? res.data : "Team member added.";
			const ok = /success|added/i.test(text);
			setMessage({ type: ok ? "success" : "error", text });
			if (ok) setTimeout(() => navigate("/company/team"), 900);
		} catch (err) {
			console.log(err);
			setMessage({ type: "error", text: "Couldn't add team member." });
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<div className="ht-page addmember-page">
			<header className="ht-page-head">
				<div>
					<h2>Add Team Member</h2>
					<p>Invite a Delivery, TFG or TAG member to your recruitment workspace.</p>
				</div>
				<div className="ht-page-actions">
					<button type="button" className="ht-btn-ghost" onClick={() => navigate("/company/team")}>
						Back to team
					</button>
				</div>
			</header>

			{message && (
				<div className={`addmember-banner ${message.type}`}>{message.text}</div>
			)}

			<form className="addmember-form" onSubmit={handleSubmit}>
				{/* Identity */}
				<section className="form-section">
					<div className="form-section-head">
						<h3>Basic Information</h3>
						<p>Who they are and how to reach them.</p>
					</div>
					<div className="form-grid">
						<div className="form-field">
							<label htmlFor="m-name">Full name</label>
							<input id="m-name" type="text" placeholder="Jordan Rivera" value={form.name} onChange={set("name")} />
						</div>
						<div className="form-field">
							<label htmlFor="m-email">Email</label>
							<input id="m-email" type="email" placeholder="jordan@company.com" value={form.email} onChange={set("email")} autoComplete="off" />
						</div>
						<div className="form-field">
							<label htmlFor="m-phone">Phone</label>
							<input id="m-phone" type="tel" placeholder="+91 98765 43210" value={form.phone} onChange={set("phone")} />
						</div>
						<div className="form-field">
							<label htmlFor="m-empid">Employee ID</label>
							<input id="m-empid" type="text" placeholder="HT-0142" value={form.employeeId} onChange={set("employeeId")} />
						</div>
					</div>
				</section>

				{/* Role & access */}
				<section className="form-section">
					<div className="form-section-head">
						<h3>Role &amp; Access</h3>
						<p>Their function determines which workflow steps they can act on.</p>
					</div>

					<div className="role-picker">
						{TEAM_ROLES.map((r) => (
							<label key={r} className={`role-option ${form.role === r ? "selected" : ""}`}>
								<input type="radio" name="role" value={r} checked={form.role === r} onChange={set("role")} />
								<span className="role-option-title">{ROLE_LABELS[r]}</span>
								<span className="role-option-desc">{ROLE_DESCRIPTIONS[r]}</span>
							</label>
						))}
					</div>

					<div className="form-grid">
						<div className="form-field">
							<label htmlFor="m-dept">Department</label>
							<select id="m-dept" value={form.department} onChange={set("department")}>
								{DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
							</select>
						</div>
						<div className="form-field">
							<label htmlFor="m-location">Location</label>
							<input id="m-location" type="text" placeholder="Bengaluru, IN" value={form.location} onChange={set("location")} />
						</div>
						<div className="form-field">
							<label htmlFor="m-status">Status</label>
							<select id="m-status" value={form.status} onChange={set("status")}>
								<option value="ACTIVE">Active</option>
								<option value="INACTIVE">Inactive</option>
							</select>
						</div>
					</div>
				</section>

				{/* Credentials */}
				<section className="form-section">
					<div className="form-section-head">
						<h3>Sign-in Credentials</h3>
						<p>They'll use these to access the workspace.</p>
					</div>
					<div className="form-grid">
						<div className="form-field">
							<label htmlFor="m-password">Temporary password</label>
							<input id="m-password" type="password" placeholder="••••••••" value={form.password} onChange={set("password")} autoComplete="new-password" />
						</div>
					</div>
				</section>

				<div className="form-actions">
					<span className="form-note">All fields are saved to the team member's profile.</span>
					<div className="form-actions-btns">
						<button type="button" className="ht-btn-ghost" onClick={() => navigate("/company/team")}>Cancel</button>
						<button type="submit" disabled={submitting}>
							{submitting ? "Adding…" : "Add Team Member"}
						</button>
					</div>
				</div>
			</form>
		</div>
	);
}

export default AddTeamMember;
