import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./auth.css";
import "./Login.css";
import { useToast } from "../../components/Toast/ToastContext";

import {
  candidateLogin,
  companyLogin,
  companyEmployeeLogin,
} from "../../services/endpoints";

function Login() {
  const navigate = useNavigate();
  const toast = useToast();

  const [role, setRole] = useState("candidate"); // ✅ FIX
  const [companyLoginType, setCompanyLoginType] = useState("owner");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const normalizeRole = (resolvedRole, selectedRole, loginType) => {
    const upperRole = String(resolvedRole || "").toUpperCase();

    if (upperRole === "USER" || upperRole === "CANDIDATE") return "CANDIDATE";
    if (["DELIVERY", "TFG", "TAG", "ADMIN"].includes(upperRole)) return upperRole;
    if (selectedRole === "candidate") return "CANDIDATE";
    return loginType === "owner" ? "ADMIN" : "";
  };

  const getRedirectPath = (normalizedRole) => {
    if (normalizedRole === "CANDIDATE") return "/dashboard";
    if (normalizedRole === "DELIVERY") return "/company/dashboard";
    if (normalizedRole === "TFG") return "/company/dashboard";
    if (normalizedRole === "TAG") return "/company/dashboard";
    if (normalizedRole === "ADMIN") return "/company/dashboard";

    return role === "candidate" ? "/dashboard" : "/company/dashboard";
  };

  const resolveLoginData = (responseData) => {
    const payload = responseData?.data ?? responseData;
    const nestedUser = payload?.user ?? payload?.data?.user ?? null;
    const resolvedMessage =
      typeof payload === "string"
        ? payload
        : payload?.message || payload?.status || "Login Successful";
    const resolvedSuccess =
      payload?.success ??
      payload?.isSuccess ??
      String(resolvedMessage).toLowerCase().includes("login successful");

    return {
      success: Boolean(resolvedSuccess),
      message: resolvedMessage,
      userId:
        payload?.userId ??
        payload?.userid ??
        payload?.userID ??
        payload?.id ??
        payload?.data?.userId ??
        payload?.data?.userid ??
        payload?.data?.userID ??
        payload?.data?.id ??
        nestedUser?.id ??
        nestedUser?.userId ??
        nestedUser?.userid ??
        nestedUser?.userID ??
        null,
      role:
        payload?.role ??
        payload?.userRole ??
        payload?.data?.role ??
        payload?.data?.userRole ??
        role,
      email: payload?.email ?? payload?.data?.email ?? nestedUser?.email ?? email,
      companyId:
        payload?.companyId ??
        payload?.companyID ??
        payload?.data?.companyId ??
        payload?.data?.companyID ??
        nestedUser?.companyId ??
        nestedUser?.companyID ??
        null,
      token: payload?.token ?? payload?.accessToken ?? null,
    };
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    const data = { email, password };

    try {
      let res;
      let loginData;

      if (role === "candidate") {
        res = await candidateLogin(data);
        loginData = resolveLoginData(res.data);
      } else {
        if (companyLoginType === "employee") {
          res = await companyEmployeeLogin(data);
          loginData = resolveLoginData(res.data);
        } else {
          res = await companyLogin(data);
          loginData = resolveLoginData(res.data);
        }
      }
      const normalizedRole = normalizeRole(loginData.role, role, companyLoginType);

      if (!loginData.success) {
        toast.error(loginData.message || "Login failed");
        return;
      }

      if (role === "company" && companyLoginType === "employee" && !normalizedRole) {
        toast.error("Employee role not returned by the server. Check the employee login response.");
        return;
      }

      if (loginData.userId !== null && loginData.userId !== undefined && loginData.userId !== "") {
        localStorage.setItem("userId", String(loginData.userId));
      } else {
        localStorage.removeItem("userId");
      }

      if (normalizedRole === "CANDIDATE") {
        localStorage.setItem("candidateEmail", loginData.email || email);
      }

      if (loginData.companyId !== null && loginData.companyId !== undefined && loginData.companyId !== "") {
        localStorage.setItem("companyId", String(loginData.companyId));
      } else if (normalizedRole !== "CANDIDATE" && loginData.userId) {
        localStorage.setItem("companyId", String(loginData.userId));
      }

      localStorage.setItem("role", normalizedRole);
        if (role === "company" && companyLoginType === "owner") {
          localStorage.setItem(
            "companyOwnerUser",
            JSON.stringify({
              id: loginData.userId,
              role: "ADMIN",
              email: loginData.email || email,
              companyId: loginData.companyId ?? loginData.userId ?? null,
            })
          );
        }
      localStorage.setItem(
        "user",
        JSON.stringify({
          id: loginData.userId,
          role: normalizedRole,
          email: loginData.email || email,
          companyId: loginData.companyId ?? loginData.userId ?? null,
        })
      );

      if (loginData.token) {
        localStorage.setItem("token", loginData.token);
      }

      toast.success(loginData.message || "Signed in successfully");
      navigate(getRedirectPath(normalizedRole));

    } catch (err) {
      console.log(err);
      toast.error("Login failed. Please check your credentials.");
    }
  };

  return (
    <div className="auth-shell">
      <aside className="auth-aside">
        <div className="auth-brand">HireTrack</div>

        <div className="auth-hero">
          <h1>Hiring, tracked end to end.</h1>
          <p>
            From the first application to the signed offer — one workspace for
            candidates and hiring teams.
          </p>
        </div>

        <ul className="auth-points">
          <li>Post roles and review applicants in one place</li>
          <li>Schedule interviews and capture feedback</li>
          <li>Send, track, and close offers</li>
        </ul>
      </aside>

      <main className="auth-main">
        <div className="auth-card">
          <span className="auth-eyebrow">Welcome back</span>
          <h2>Sign in</h2>
          <p className="auth-sub">Access your candidate or company workspace.</p>

          <form className="auth-form" onSubmit={handleLogin}>
            <div className="auth-field">
              <label htmlFor="login-role">I am a</label>
              <select
                id="login-role"
                value={role}
                onChange={(e) => {
                  const selectedRole = e.target.value;
                  setRole(selectedRole);
                  if (selectedRole !== "company") {
                    setCompanyLoginType("owner");
                  }
                }}
              >
                <option value="candidate">Candidate</option>
                <option value="company">Company</option>
              </select>
            </div>

            {role === "company" && (
              <div className="auth-field">
                <label htmlFor="login-type">Login as</label>
                <select
                  id="login-type"
                  value={companyLoginType}
                  onChange={(e) => setCompanyLoginType(e.target.value)}
                >
                  <option value="owner">Company Admin</option>
                  <option value="employee">Company Employee (Delivery / TFG / TAG)</option>
                </select>
              </div>
            )}

            <div className="auth-field">
              <label htmlFor="login-email">Email</label>
              <input
                id="login-email"
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>

            <div className="auth-field">
              <label htmlFor="login-password">Password</label>
              <input
                id="login-password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
            </div>

            <button type="submit">Sign in</button>
          </form>

          <div className="auth-divider">New here</div>

          <div className="auth-alt">
            <button type="button" onClick={() => navigate("/signup")}>
              Create a candidate account
            </button>
            <button type="button" onClick={() => navigate("/company-signup")}>
              Register your company
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Login;