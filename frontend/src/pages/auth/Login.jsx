import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Login.css";

import {
  candidateLogin,
  companyLogin,
  companyEmployeeLogin,
} from "../../services/endpoints";

function Login() {
  const navigate = useNavigate();

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
    if (normalizedRole === "CANDIDATE") return "/jobs";
    if (normalizedRole === "DELIVERY") return "/company/create-job";
    if (normalizedRole === "TFG") return "/company/jobs";
    if (normalizedRole === "TAG") return "/company/jobs";
    if (normalizedRole === "ADMIN") return "/company/role-access";

    return role === "candidate" ? "/jobs" : "/company/create-job";
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
        alert(loginData.message || "Login failed");
        return;
      }

      if (role === "company" && companyLoginType === "employee" && !normalizedRole) {
        alert("Employee role not returned by backend. Please check employee login API response.");
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

      alert(loginData.message);
      navigate(getRedirectPath(normalizedRole));

    } catch (err) {
      console.log(err);
      alert("Login failed");
    }
  };

  return (
    <div className="login-container">
      <h2>Login</h2>

      <form onSubmit={handleLogin}>
        <select
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

        {role === "company" && (
          <select
            value={companyLoginType}
            onChange={(e) => setCompanyLoginType(e.target.value)}
          >
            <option value="owner">Company Admin Login</option>
            <option value="employee">Company Employee Login (DELIVERY/TFG/TAG)</option>
          </select>
        )}

        <input
          type="email"
          placeholder="Enter Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Enter Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button type="submit">Login</button>
      </form>

      {/* ✅ Buttons outside form */}
      <div className="signup-buttons">
        <button onClick={() => navigate("/signup")}>
          Candidate Signup
        </button>

        <button onClick={() => navigate("/company-signup")}>
          Company Signup
        </button>
      </div>
    </div>
  );
}

export default Login;