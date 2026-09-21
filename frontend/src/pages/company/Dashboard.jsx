import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Dashboard.css";

import { applicationService, jobService } from "../../services/api";

function Dashboard() {
	const navigate = useNavigate();
	const user = useMemo(() => JSON.parse(localStorage.getItem("user") || "null"), []);
	const role = String(user?.role || "").toUpperCase();
	const rawCompanyId = user?.companyId ?? localStorage.getItem("companyId") ?? user?.id;
	const parsedCompanyId = Number(rawCompanyId);
	const companyId = Number.isFinite(parsedCompanyId) && parsedCompanyId > 0 ? parsedCompanyId : null;

	const [summary, setSummary] = useState({
		totalJobs: 0,
		totalApplications: 0,
		totalOffers: 0,
	});
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");

	const normalizeList = (payload) => {
		if (Array.isArray(payload)) return payload;
		if (Array.isArray(payload?.data)) return payload.data;
		if (Array.isArray(payload?.content)) return payload.content;
		if (Array.isArray(payload?.applications)) return payload.applications;
		if (Array.isArray(payload?.offers)) return payload.offers;
		if (Array.isArray(payload?.jobs)) return payload.jobs;
		return [];
	};

	useEffect(() => {
		const loadDashboard = async () => {
			setLoading(true);
			setError("");

			const jobsResult = await Promise.allSettled([
				companyId ? jobService.getCompanyJobs(companyId) : jobService.getAllJobs(),
			]);

			const resolvedJobsResult = jobsResult[0];

			const jobs =
				resolvedJobsResult.status === "fulfilled"
					? normalizeList(resolvedJobsResult.value.data)
					: [];

			const validJobIds = jobs.map((job) => job?.id).filter(Boolean);
			let applicationCount = 0;
			let applicationServiceFailed = false;

			if (validJobIds.length > 0) {
				const appResults = await Promise.allSettled(
					validJobIds.map((jobId) => applicationService.getApplicationsByJob(jobId))
				);

				applicationCount = appResults.reduce((count, result) => {
					if (result.status !== "fulfilled") return count;
					const apps = normalizeList(result.value.data);
					return count + apps.length;
				}, 0);

				applicationServiceFailed = appResults.some((result) => result.status === "rejected");
			}

			setSummary({
				totalJobs: jobs.length,
				totalApplications: applicationCount,
				totalOffers: 0,
			});

			const failedServices = [];
			if (resolvedJobsResult.status === "rejected") failedServices.push("Jobs Service (8092)");
			if (applicationServiceFailed) failedServices.push("Application Service (8093)");

			if (failedServices.length > 0) {
				setError(`Partial data loaded. Failed: ${failedServices.join(", ")}`);
			}

			setLoading(false);
		};

		loadDashboard();
	}, [companyId]);

	return (
		<div className="company-dashboard-page">
			<div className="company-dashboard-shell">
				<div className="dashboard-header">
					<div>
						<h2>Company Dashboard</h2>
						<p>Role: {role || "UNKNOWN"}</p>
					</div>
				</div>

				{error && <div className="dashboard-banner">{error}</div>}

				{loading ? (
					<div className="dashboard-banner">Loading dashboard...</div>
				) : (
					<>
						<div className="dashboard-grid">
							<div className="metric-card">
								<span>Total Jobs</span>
								<strong>{summary.totalJobs}</strong>
							</div>

							<div className="metric-card">
								<span>Total Applications</span>
								<strong>{summary.totalApplications}</strong>
							</div>

							<div className="metric-card">
								<span>Total Offers</span>
								<strong>{summary.totalOffers}</strong>
								<small>Temporarily disabled</small>
							</div>
						</div>

						<div className="quick-actions-card">
							<h3>Quick Actions</h3>
							<div className="quick-actions-grid">
								<button onClick={() => navigate("/company/jobs")}>Go to Jobs</button>
								<button onClick={() => navigate("/company/applications")}>Go to Applications</button>
								<button onClick={() => navigate("/company/interview")}>Go to Interview</button>
								{role === "ADMIN" && (
									<>
										<button onClick={() => navigate("/company/employees")}>Manage Employees</button>
										<button onClick={() => navigate("/company/add-employee")}>Add Employee</button>
									</>
								)}
							</div>
						</div>
					</>
				)}
			</div>
		</div>
	);
}

export default Dashboard;
