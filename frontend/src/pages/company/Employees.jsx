import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Employees.css";
import { getEmployees, deleteEmployee } from "../../services/endpoints";
import { normalizeList, getCompanyId, initials } from "../../utils/helpers";
import { ROLE_LABELS, ROLE_DESCRIPTIONS } from "../../utils/constants";
import { useToast } from "../../components/Toast/ToastContext";
import ConfirmDialog from "../../components/Toast/ConfirmDialog";

// The three internal delivery-side teams we group members into.
const TEAMS = [
	{ role: "DELIVERY", tone: "brand" },
	{ role: "TFG", tone: "amber" },
	{ role: "TAG", tone: "teal" },
	{ role: "ADMIN", tone: "pink" },
];

function TeamMembers() {
	const navigate = useNavigate();
	const toast = useToast();
	const [members, setMembers] = useState([]);
	const [query, setQuery] = useState("");
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [pendingDelete, setPendingDelete] = useState(null); // { id, name }
	const companyId = getCompanyId();

	const fetchMembers = useCallback(async () => {
		if (!companyId) {
			setError("Company not found. Please sign in again.");
			setLoading(false);
			return;
		}
		setLoading(true);
		try {
			const res = await getEmployees(companyId);
			setMembers(normalizeList(res.data));
			setError("");
		} catch (err) {
			console.log(err);
			setError("Couldn't load team members.");
		} finally {
			setLoading(false);
		}
	}, [companyId]);

	useEffect(() => {
		fetchMembers();
	}, [fetchMembers]);

	const confirmDelete = async () => {
		if (!pendingDelete) return;
		const { id, name } = pendingDelete;
		setPendingDelete(null);
		try {
			await deleteEmployee(id);
			setMembers((prev) => prev.filter((m) => m.id !== id));
			toast.success(`Removed ${name || "team member"}.`);
		} catch (err) {
			console.log(err);
			toast.error("Couldn't remove that member.");
		}
	};

	const filtered = useMemo(() => {
		const q = query.trim().toLowerCase();
		if (!q) return members;
		return members.filter(
			(m) =>
				String(m.name || "").toLowerCase().includes(q) ||
				String(m.email || "").toLowerCase().includes(q) ||
				String(m.role || "").toLowerCase().includes(q)
		);
	}, [members, query]);

	const grouped = useMemo(() => {
		const map = {};
		TEAMS.forEach((t) => (map[t.role] = []));
		filtered.forEach((m) => {
			const role = String(m.role || "").toUpperCase();
			if (!map[role]) map[role] = [];
			map[role].push(m);
		});
		return map;
	}, [filtered]);

	return (
		<div className="ht-page team-page">
			<header className="ht-page-head">
				<div>
					<h2>Team Members</h2>
					<p>Manage your Delivery, TFG and TAG teams in one place.</p>
				</div>
				<div className="ht-page-actions">
					<div className="team-search">
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
							<circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" />
						</svg>
						<input
							type="search"
							placeholder="Search members…"
							value={query}
							onChange={(e) => setQuery(e.target.value)}
							aria-label="Search team members"
						/>
					</div>
					<button onClick={() => navigate("/company/add-team-member")}>
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 16, height: 16 }}>
							<path d="M12 5v14M5 12h14" />
						</svg>
						Add Team Member
					</button>
				</div>
			</header>

			{error && <div className="team-banner">{error}</div>}

			{loading ? (
				<div className="team-skeleton">
					{[0, 1, 2].map((i) => <div key={i} className="team-skel-card" style={{ "--i": i }} />)}
				</div>
			) : members.length === 0 ? (
				<div className="ht-empty">
					<div className="ht-empty-mark" aria-hidden="true" />
					<h3>No team members yet</h3>
					<p>Add your Delivery, TFG and TAG members to start collaborating.</p>
				</div>
			) : (
				<div className="team-groups">
					{TEAMS.map((team) => {
						const list = grouped[team.role] || [];
						if (list.length === 0) return null;
						return (
							<section key={team.role} className="team-group">
								<div className="team-group-head">
									<span className={`ht-pill tone-${team.tone}`}>
										{ROLE_LABELS[team.role]} Team
									</span>
									<span className="team-group-desc">{ROLE_DESCRIPTIONS[team.role]}</span>
									<span className="team-group-count">{list.length}</span>
								</div>

								<div className="team-grid">
									{list.map((m, i) => (
										<article key={m.id} className="team-card" style={{ "--i": i }}>
											<div className="team-card-top">
												<span className={team.tone === "brand" ? "ht-avatar" : `ht-avatar tone-${team.tone}`}>
													{initials(m.name || m.email)}
												</span>
												<button
													className="team-remove"
													onClick={() => setPendingDelete({ id: m.id, name: m.name })}
													aria-label={`Remove ${m.name || "member"}`}
													title="Remove member"
												>
													<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
														<path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14" />
													</svg>
												</button>
											</div>
											<h4 className="team-name">{m.name || "Unnamed"}</h4>
											<p className="team-email">{m.email}</p>
											<div className="team-meta">
												<span className={`ht-pill tone-${team.tone}`}>{ROLE_LABELS[m.role] || m.role}</span>
												<span className={`ht-pill tone-${String(m.status).toUpperCase() === "ACTIVE" ? "green" : "slate"}`}>
													{m.status || "Active"}
												</span>
											</div>
										</article>
									))}
								</div>
							</section>
						);
					})}
				</div>
			)}

			<ConfirmDialog
				open={!!pendingDelete}
				title="Remove team member?"
				message={pendingDelete ? `${pendingDelete.name || "This member"} will lose access to the workspace.` : ""}
				confirmLabel="Remove"
				onConfirm={confirmDelete}
				onCancel={() => setPendingDelete(null)}
			/>
		</div>
	);
}

export default TeamMembers;
