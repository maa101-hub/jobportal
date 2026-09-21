import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./RoleAccess.css";

import { getEmployees } from "../../services/endpoints";

const getRedirectPath = (role) => {
  if (role === "DELIVERY") return "/company/create-job";
  if (role === "TFG") return "/company/jobs";
  if (role === "TAG") return "/company/jobs";
  if (role === "ADMIN") return "/company/dashboard";
  return "/company/dashboard";
};

function RoleAccess() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("DELIVERY");
  const [loading, setLoading] = useState(false);

  const ownerUser = JSON.parse(localStorage.getItem("companyOwnerUser") || "null");
  const currentUser = JSON.parse(localStorage.getItem("user") || "null");
  const companyId =
    ownerUser?.companyId ?? currentUser?.companyId ?? localStorage.getItem("companyId");

  const handleRoleLogin = async (e) => {
    e.preventDefault();

    if (!email.trim()) {
      alert("Please enter employee email");
      return;
    }

    if (!companyId) {
      alert("Company ID not found. Please login again.");
      return;
    }

    try {
      setLoading(true);
      const res = await getEmployees(companyId);
      const employees = Array.isArray(res.data) ? res.data : res.data?.data || [];

      const matchedEmployee = employees.find((employee) => {
        const sameEmail =
          String(employee?.email || "").toLowerCase() === String(email || "").toLowerCase();
        const sameRole = String(employee?.role || "").toUpperCase() === role;
        return sameEmail && sameRole;
      });

      if (!matchedEmployee) {
        alert("No employee found with this Email + Role for your company.");
        return;
      }

      localStorage.setItem("userId", String(matchedEmployee.id));
      localStorage.setItem("role", role);
      localStorage.setItem("companyId", String(companyId));
      localStorage.setItem(
        "user",
        JSON.stringify({
          id: matchedEmployee.id,
          role,
          email: matchedEmployee.email,
          companyId: Number(companyId),
        })
      );

      alert(`${role} login successful`);
      navigate(getRedirectPath(role));
    } catch (err) {
      console.log(err);
      alert("Failed to load employees. Please check backend.");
    } finally {
      setLoading(false);
    }
  };

  const handleContinueAdmin = () => {
    if (!ownerUser) {
      alert("Admin session not found. Please login again.");
      navigate("/login");
      return;
    }

    localStorage.setItem("userId", String(ownerUser.id));
    localStorage.setItem("role", "ADMIN");
    localStorage.setItem("companyId", String(ownerUser.companyId));
    localStorage.setItem("user", JSON.stringify(ownerUser));
    navigate("/company/dashboard");
  };

  return (
    <div className="role-access-page">
      <div className="role-access-card">
        <h2>Team Role Access</h2>
        <p>After company login, choose employee email + role to continue work.</p>

        <form onSubmit={handleRoleLogin}>
          <input
            type="email"
            placeholder="Employee Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <select value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="DELIVERY">DELIVERY</option>
            <option value="TFG">TFG</option>
            <option value="TAG">TAG</option>
          </select>

          <button type="submit" disabled={loading}>
            {loading ? "Checking..." : "Login with Role"}
          </button>
        </form>

        <button className="admin-btn" onClick={handleContinueAdmin}>
          Continue as ADMIN
        </button>
      </div>
    </div>
  );
}

export default RoleAccess;