import { NavLink } from "react-router-dom";
import "./Sidebar.css";

/* Compact inline icon set — stroke icons that inherit currentColor so they
   tint correctly in default / hover / active states. */
const Icon = ({ name }) => {
  const paths = {
    dashboard: (
      <>
        <rect x="3" y="3" width="7" height="9" rx="1.5" />
        <rect x="14" y="3" width="7" height="5" rx="1.5" />
        <rect x="14" y="12" width="7" height="9" rx="1.5" />
        <rect x="3" y="16" width="7" height="5" rx="1.5" />
      </>
    ),
    employees: (
      <>
        <circle cx="9" cy="8" r="3.2" />
        <path d="M3.5 20a5.5 5.5 0 0 1 11 0" />
        <path d="M16 5.2a3 3 0 0 1 0 5.6" />
        <path d="M17.5 20a5.5 5.5 0 0 0-2.7-4.7" />
      </>
    ),
    "add-user": (
      <>
        <circle cx="9" cy="8" r="3.2" />
        <path d="M3.5 20a5.5 5.5 0 0 1 9.5-3.8" />
        <path d="M18 13v6M15 16h6" />
      </>
    ),
    jobs: (
      <>
        <rect x="3" y="7" width="18" height="13" rx="2" />
        <path d="M8 7V5.5A1.5 1.5 0 0 1 9.5 4h5A1.5 1.5 0 0 1 16 5.5V7" />
        <path d="M3 12h18" />
      </>
    ),
    create: (
      <>
        <path d="M12 5v14M5 12h14" />
      </>
    ),
    applications: (
      <>
        <path d="M6 3h9l3 3v15a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" />
        <path d="M14 3v4h4" />
        <path d="M8.5 13h7M8.5 16.5h5" />
      </>
    ),
    interview: (
      <>
        <path d="M4 5h11a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1H9l-4 3v-3H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z" />
        <path d="M18 9h2a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1h-1v2l-2-2" />
      </>
    ),
    offers: (
      <>
        <path d="M12 3l2.5 5 5.5.8-4 3.9.9 5.5L12 21l-4.9 2.6.9-5.5-4-3.9 5.5-.8z" transform="translate(0 -1.5)" />
      </>
    ),
    requests: (
      <>
        <rect x="4" y="3" width="16" height="18" rx="2" />
        <path d="M8 8h8M8 12h8M8 16h5" />
      </>
    ),
    review: (
      <>
        <path d="M3.5 12a8.5 8.5 0 0 1 17 0" />
        <path d="M9.5 12l1.8 1.8 3.7-3.7" />
        <path d="M12 3.5v2M20.5 12h-2M5.5 12h-2" />
      </>
    ),
  };

  return (
    <svg
      className="sidebar-icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name] || paths.dashboard}
    </svg>
  );
};

const candidateLinks = [
  { to: "/dashboard", label: "Dashboard", icon: "dashboard" },
  { to: "/jobs", label: "Browse Jobs", icon: "jobs" },
  { to: "/my-applications", label: "My Applications", icon: "applications" },
  { to: "/my-offers", label: "My Offers", icon: "offers" },
];

const companyLinks = {
  // Delivery owns requirements -> creates jobs -> sends for review.
  DELIVERY: [
    { to: "/company/dashboard", label: "Dashboard", icon: "dashboard" },
    { to: "/company/job-requests", label: "Job Requests", icon: "requests" },
    { to: "/company/create-job", label: "Create Job", icon: "create" },
    { to: "/company/jobs", label: "Company Jobs", icon: "jobs" },
  ],
  // TFG reviews and approves jobs.
  TFG: [
    { to: "/company/dashboard", label: "Dashboard", icon: "dashboard" },
    { to: "/company/review", label: "TFG Review", icon: "review" },
    { to: "/company/jobs", label: "Company Jobs", icon: "jobs" },
  ],
  // TAG runs the candidate hiring pipeline.
  TAG: [
    { to: "/company/dashboard", label: "Dashboard", icon: "dashboard" },
    { to: "/company/jobs", label: "Company Jobs", icon: "jobs" },
    { to: "/company/applications", label: "Applications", icon: "applications" },
    { to: "/company/interview", label: "Interviews", icon: "interview" },
    { to: "/company/offers", label: "Offers", icon: "offers" },
  ],
  // Admin can do everything.
  ADMIN: [
    { to: "/company/dashboard", label: "Dashboard", icon: "dashboard" },
    { to: "/company/team", label: "Team Members", icon: "employees" },
    { to: "/company/add-team-member", label: "Add Team Member", icon: "add-user" },
    { to: "/company/job-requests", label: "Job Requests", icon: "requests" },
    { to: "/company/create-job", label: "Create Job", icon: "create" },
    { to: "/company/review", label: "TFG Review", icon: "review" },
    { to: "/company/jobs", label: "Company Jobs", icon: "jobs" },
    { to: "/company/applications", label: "Applications", icon: "applications" },
    { to: "/company/interview", label: "Interviews", icon: "interview" },
    { to: "/company/offers", label: "Offers", icon: "offers" },
  ],
};

const Sidebar = () => {
  const user = JSON.parse(localStorage.getItem("user") || "null");
  if (!user) return null;

  const links =
    user.role === "CANDIDATE" ? candidateLinks : companyLinks[user.role] || [];

  return (
    <aside className="sidebar">
      <nav className="sidebar-nav" aria-label="Primary">
        <ul className="sidebar-list">
          {links.map((link, i) => (
            <li
              key={link.to}
              className="sidebar-item"
              style={{ "--i": i }}
            >
              <NavLink
                to={link.to}
                className={({ isActive }) =>
                  isActive ? "sidebar-link active" : "sidebar-link"
                }
              >
                <span className="sidebar-icon-wrap">
                  <Icon name={link.icon} />
                </span>
                <span className="sidebar-label">{link.label}</span>
                <span className="sidebar-chevron" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 6 15 12 9 18" />
                  </svg>
                </span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;
