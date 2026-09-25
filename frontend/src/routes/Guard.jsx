import { Navigate, useLocation } from "react-router-dom";
import MainLayout from "../components/Layout/MainLayout";
import { getUser, getRole } from "../utils/helpers";

// Where each role lands when they hit a page they shouldn't.
const HOME_FOR_ROLE = {
	CANDIDATE: "/dashboard",
	DELIVERY: "/company/dashboard",
	TFG: "/company/dashboard",
	TAG: "/company/dashboard",
	ADMIN: "/company/dashboard",
};

/**
 * Route guard: requires a signed-in user, and optionally a role in `allow`.
 * ADMIN passes every company-role gate (admin can do anything).
 * Renders the page inside the app chrome when allowed.
 */
export default function Guard({ allow, children }) {
	const location = useLocation();
	const user = getUser();
	const role = getRole();

	// Not signed in -> login (remember where they were headed).
	if (!user || !role) {
		return <Navigate to="/login" replace state={{ from: location.pathname }} />;
	}

	// Role not permitted -> send to their own home.
	if (allow && allow.length) {
		const permitted = allow.includes(role) || (role === "ADMIN" && allow.some((r) => r !== "CANDIDATE"));
		if (!permitted) {
			return <Navigate to={HOME_FOR_ROLE[role] || "/login"} replace />;
		}
	}

	return <MainLayout>{children}</MainLayout>;
}
