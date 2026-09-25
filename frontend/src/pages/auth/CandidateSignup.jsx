import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./auth.css";
import "./CandidateSignup.css";

import { candidateSignup } from "../../services/endpoints";
import { useToast } from "../../components/Toast/ToastContext";

function CandidateSignup() {
  const navigate = useNavigate();
  const toast = useToast();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSignup = async (e) => {
    e.preventDefault();

    const data = {
      name,
      email,
      password,
    };

    try {
      const res = await candidateSignup(data);
      const msg = typeof res.data === "string" ? res.data : "Account created";
      if (/success|registered/i.test(msg)) {
        toast.success("Account created — please sign in.");
        setTimeout(() => navigate("/login"), 700);
      } else {
        toast.error(msg);
      }
    } catch (err) {
      console.log(err);
      toast.error("Signup failed. That email may already be registered.");
    }
  };

  return (
    <div className="auth-shell">
      <aside className="auth-aside">
        <div className="auth-brand">HireTrack</div>

        <div className="auth-hero">
          <h1>Find your next role.</h1>
          <p>
            Create a candidate profile, apply in a click, and follow every
            application through to the offer.
          </p>
        </div>

        <ul className="auth-points">
          <li>Browse open roles across companies</li>
          <li>Track application and interview status</li>
          <li>Review and accept offers</li>
        </ul>
      </aside>

      <main className="auth-main">
        <div className="auth-card">
          <span className="auth-eyebrow is-candidate">Candidate</span>
          <h2>Create your account</h2>
          <p className="auth-sub">A minute to set up. Then start applying.</p>

          <form className="auth-form" onSubmit={handleSignup}>
            <div className="auth-field">
              <label htmlFor="cand-name">Full name</label>
              <input
                id="cand-name"
                type="text"
                placeholder="Jordan Rivera"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
              />
            </div>

            <div className="auth-field">
              <label htmlFor="cand-email">Email</label>
              <input
                id="cand-email"
                type="email"
                placeholder="you@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>

            <div className="auth-field">
              <label htmlFor="cand-password">Password</label>
              <input
                id="cand-password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
              />
            </div>

            <button type="submit">Create account</button>
          </form>

          <p className="auth-footnote">
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        </div>
      </main>
    </div>
  );
}

export default CandidateSignup;
