import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./auth.css";
import "./CompanySignup.css";

import { companyRegister } from "../../services/endpoints";
import { useToast } from "../../components/Toast/ToastContext";

function CompanySignup() {
  const navigate = useNavigate();
  const toast = useToast();

  const [form, setForm] = useState({
    companyName: "",
    email: "",
    password: "",
    location: "",
    description: "",
  });

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSignup = async (e) => {
    e.preventDefault();

    try {
      const res = await companyRegister(form);
      const msg = typeof res.data === "string" ? res.data : "Company registered";
      if (/success|registered/i.test(msg)) {
        toast.success("Company registered — please sign in.");
        setTimeout(() => navigate("/login"), 700);
      } else {
        toast.error(msg);
      }
    } catch (err) {
      console.log(err);
      toast.error("Company signup failed. That email may already exist.");
    }
  };

  return (
    <div className="auth-shell">
      <aside className="auth-aside">
        <div className="auth-brand">HireTrack</div>

        <div className="auth-hero">
          <h1>Hire with clarity.</h1>
          <p>
            Set up your company workspace to post roles, manage your team, and
            move candidates from applied to hired.
          </p>
        </div>

        <ul className="auth-points">
          <li>Post and approve job openings</li>
          <li>Assign delivery, TFG and TAG roles</li>
          <li>Run interviews and release offers</li>
        </ul>
      </aside>

      <main className="auth-main">
        <div className="auth-card">
          <span className="auth-eyebrow is-company">Company</span>
          <h2>Register your company</h2>
          <p className="auth-sub">Create the workspace your team will hire in.</p>

          <form className="auth-form" onSubmit={handleSignup}>
            <div className="auth-field">
              <label htmlFor="co-name">Company name</label>
              <input
                id="co-name"
                type="text"
                name="companyName"
                placeholder="Acme Inc."
                value={form.companyName}
                onChange={handleChange}
              />
            </div>

            <div className="auth-field">
              <label htmlFor="co-email">Work email</label>
              <input
                id="co-email"
                type="email"
                name="email"
                placeholder="hiring@acme.com"
                value={form.email}
                onChange={handleChange}
                autoComplete="email"
              />
            </div>

            <div className="auth-field">
              <label htmlFor="co-password">Password</label>
              <input
                id="co-password"
                type="password"
                name="password"
                placeholder="••••••••"
                value={form.password}
                onChange={handleChange}
                autoComplete="new-password"
              />
            </div>

            <div className="auth-field">
              <label htmlFor="co-location">Location</label>
              <input
                id="co-location"
                type="text"
                name="location"
                placeholder="Bengaluru, IN"
                value={form.location}
                onChange={handleChange}
              />
            </div>

            <div className="auth-field">
              <label htmlFor="co-description">About the company</label>
              <input
                id="co-description"
                type="text"
                name="description"
                placeholder="What your company does"
                value={form.description}
                onChange={handleChange}
              />
            </div>

            <button type="submit">Register company</button>
          </form>

          <p className="auth-footnote">
            Already registered? <Link to="/login">Sign in</Link>
          </p>
        </div>
      </main>
    </div>
  );
}

export default CompanySignup;
