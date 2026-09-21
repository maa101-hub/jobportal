import { NavLink } from "react-router-dom";
import "./Sidebar.css";

const candidateLinks = [
  { to: "/jobs", label: "Browse Jobs" },
  { to: "/my-applications", label: "My Applications" },
  { to: "/my-offers", label: "My Offers" },
];

const companyLinks = {
  DELIVERY: [
    { to: "/company/dashboard", label: "Dashboard" },
    { to: "/company/create-job", label: "Create Job" },
  ],
  TFG: [
    { to: "/company/dashboard", label: "Dashboard" },
    { to: "/company/jobs", label: "Company Jobs" },
  ],
  TAG: [
    { to: "/company/dashboard", label: "Dashboard" },
    { to: "/company/jobs", label: "Company Jobs" },
    { to: "/company/applications", label: "Applications" },
    { to: "/company/interview", label: "Interview" },
    { to: "/company/offers", label: "Offers" },
  ],
  ADMIN: [
    { to: "/company/dashboard", label: "Dashboard" },
    { to: "/company/employees", label: "Employees" },
    { to: "/company/add-employee", label: "Add Employee" },
    { to: "/company/jobs", label: "Company Jobs" },
    { to: "/company/create-job", label: "Create Job" },
    { to: "/company/applications", label: "Applications" },
    { to: "/company/interview", label: "Interview" },
    { to: "/company/offers", label: "Offers" },
  ],
};

const Sidebar = () => {
  const user = JSON.parse(localStorage.getItem("user") || "null");
  if (!user) return null;

  const links =
    user.role === "CANDIDATE"
      ? candidateLinks
      : companyLinks[user.role] || [];

  return (
    <aside className="sidebar">
      <ul className="sidebar-nav">
        {links.map((link) => (
          <li key={link.to}>
            <NavLink
              to={link.to}
              className={({ isActive }) =>
                isActive ? "sidebar-link active" : "sidebar-link"
              }
            >
              {link.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </aside>
  );
};

export default Sidebar;