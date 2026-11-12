import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import "./Landing.css";

/* ─────────────────────────────────────────────────────────────
   ICON HELPERS
───────────────────────────────────────────────────────────── */
function Icon({ name, size = 20 }) {
  const paths = {
    briefcase: <><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5.5A1.5 1.5 0 0 1 9.5 4h5A1.5 1.5 0 0 1 16 5.5V7"/><path d="M3 12h18"/></>,
    check:     <><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></>,
    users:     <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>,
    calendar:  <><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M3 9h18M8 2v4M16 2v4"/><path d="M8 14h4"/></>,
    gift:      <><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></>,
    sparkle:   <path d="M12 3l1.9 5.8a2 2 0 0 0 1.3 1.3L21 12l-5.8 1.9a2 2 0 0 0-1.3 1.3L12 21l-1.9-5.8a2 2 0 0 0-1.3-1.3L3 12l5.8-1.9a2 2 0 0 0 1.3-1.3L12 3z"/>,
    search:    <><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></>,
    zap:       <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>,
    chart:     <><path d="M3 3v18h18"/><path d="M18 17V9M13 17V5M8 17v-3"/></>,
    shield:    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>,
    arrow:     <><path d="M5 12h14M13 6l6 6-6 6"/></>,
    layers:    <><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></>,
    flow:      <><rect x="3" y="3" width="6" height="6" rx="1"/><rect x="15" y="15" width="6" height="6" rx="1"/><path d="M9 6h6a3 3 0 0 1 3 3v6"/></>,
    people:    <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></>,
    hand:      <><path d="M18 11V6a2 2 0 0 0-4 0v5"/><path d="M14 10V4a2 2 0 0 0-4 0v6"/><path d="M10 10.5V6a2 2 0 0 0-4 0v8"/><path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"/></>,
    dot:       <circle cx="12" cy="12" r="6"/>,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true">
      {paths[name]}
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────────
   ANIMATED MOCK DASHBOARD (hero right panel)
   Cycles through 3 "screens" of your real app: Dashboard metrics,
   Kanban board (Applications), and Offer released.
───────────────────────────────────────────────────────────── */

const SCREENS = [
  { id: "dashboard", label: "dashboard", tab: "Dashboard" },
  { id: "kanban",    label: "applications", tab: "Applications" },
  { id: "offer",     label: "offers", tab: "Offers" },
];

const METRIC_VARIANTS = [
  { jobRequests: 3, activeJobs: 7, applications: 24, interviews: 9, offers: 2 },
  { jobRequests: 1, activeJobs: 4, applications: 11, interviews: 3, offers: 1 },
  { jobRequests: 5, activeJobs: 12, applications: 38, interviews: 14, offers: 4 },
];

const KANBAN_COLS = [
  { stage: "New",         tone: "info",   cards: ["Priya S.", "Ravi M."] },
  { stage: "Shortlisted", tone: "amber",  cards: ["Ankit P."] },
  { stage: "Interview",   tone: "brand",  cards: ["Sara K.", "Dev J."] },
  { stage: "Offer",       tone: "pink",   cards: ["Meera T."] },
];

function useCountUp(target, duration = 600) {
  const [val, setVal] = useState(0);
  const raf = useRef(null);
  useEffect(() => {
    const start = performance.now();
    const from = 0;
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setVal(Math.round(from + eased * target));
      if (t < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => raf.current && cancelAnimationFrame(raf.current);
  }, [target, duration]);
  return val;
}

function MetricCard({ label, value, tone, delay }) {
  const display = useCountUp(value, 700);
  return (
    <div className={`mock-metric tone-${tone}`} style={{ animationDelay: delay }}>
      <span className="mock-metric-val">{display}</span>
      <span className="mock-metric-label">{label}</span>
    </div>
  );
}

function DashboardScreen({ variant }) {
  const v = METRIC_VARIANTS[variant];
  return (
    <div className="mock-screen mock-dashboard">
      <div className="mock-welcome">
        <div className="mock-welcome-text">
          <div className="mock-skel w60" />
          <div className="mock-skel w40 sm" />
        </div>
        <div className="mock-welcome-orb" />
      </div>
      <div className="mock-metrics">
        <MetricCard label="Job Requests"  value={v.jobRequests}  tone="violet" delay="0ms"   />
        <MetricCard label="Active Jobs"   value={v.activeJobs}   tone="brand"  delay="60ms"  />
        <MetricCard label="Applications"  value={v.applications} tone="pink"   delay="120ms" />
        <MetricCard label="Interviews"    value={v.interviews}   tone="teal"   delay="180ms" />
        <MetricCard label="Offers"        value={v.offers}       tone="green"  delay="240ms" />
      </div>
      <div className="mock-pipeline-chart">
        {[65, 42, 78, 35, 55].map((h, i) => (
          <div key={i} className="mock-pipe-col" style={{ "--h": `${h}%`, "--i": i }}>
            <div className="mock-pipe-fill" />
          </div>
        ))}
      </div>
    </div>
  );
}

function KanbanScreen() {
  const [highlight, setHighlight] = useState(null);
  useEffect(() => {
    const ids = [0, 1, 2, 3];
    let idx = 0;
    const t = setInterval(() => {
      setHighlight(ids[idx % ids.length]);
      idx++;
    }, 1200);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="mock-screen mock-kanban">
      <div className="mock-kanban-head">
        <div className="mock-skel w30" />
        <div className="mock-skel w20 sm" />
      </div>
      <div className="mock-kanban-cols">
        {KANBAN_COLS.map((col, ci) => (
          <div key={col.stage} className={`mock-kcol tone-${col.tone} ${highlight === ci ? "active" : ""}`}>
            <div className="mock-kcol-head">
              <span className={`mock-kdot tone-${col.tone}`} />
              <span className="mock-kcol-title">{col.stage}</span>
              <span className="mock-kcol-n">{col.cards.length}</span>
            </div>
            {col.cards.map((name, ki) => (
              <div key={name} className={`mock-kcard ${highlight === ci ? "lifted" : ""}`}
                style={{ animationDelay: `${ki * 80}ms` }}>
                <div className={`mock-kcard-av tone-${col.tone}`}>{name[0]}</div>
                <div>
                  <div className="mock-kcard-name">{name}</div>
                  <div className={`mock-kcard-pill tone-${col.tone}`}>{col.stage}</div>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function OfferScreen() {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setStep(s => (s + 1) % 4), 900);
    return () => clearInterval(t);
  }, []);
  const steps = ["Selected", "Offer Sent", "Accepted", "Hired 🎉"];
  const tones = ["brand", "pink", "teal", "green"];
  return (
    <div className="mock-screen mock-offer">
      <div className="mock-offer-head">
        <div className={`mock-offer-badge tone-${tones[step]}`}>{steps[step]}</div>
        <div className="mock-offer-title">Offer #42</div>
      </div>
      <ol className="mock-offer-flow">
        {steps.map((s, i) => (
          <li key={s} className={`mock-of-step ${i <= step ? "done" : ""} ${i === step ? "current" : ""}`}>
            <span className="mock-of-dot">{i < step ? "✓" : i + 1}</span>
            <span className="mock-of-label">{s}</span>
          </li>
        ))}
      </ol>
      <div className="mock-offer-facts">
        <div className="mock-of-fact"><span>Application</span><strong>#103</strong></div>
        <div className="mock-of-fact"><span>Joining</span><strong>Nov 1, 2026</strong></div>
        <div className="mock-of-fact"><span>Status</span>
          <strong className={`tone-${tones[step]}`}>{steps[step]}</strong>
        </div>
      </div>
    </div>
  );
}

function LiveDashboard() {
  const [screen, setScreen] = useState(0);
  const [variant, setVariant] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [paused, setPaused] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const previewRef = useRef(null);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setPrefersReducedMotion(media.matches);
    sync();
    media.addEventListener?.("change", sync);
    return () => media.removeEventListener?.("change", sync);
  }, []);

  useEffect(() => {
    if (paused || prefersReducedMotion) return undefined;
    const t = setInterval(() => {
      setAnimating(true);
      setTimeout(() => {
        setScreen(s => (s + 1) % SCREENS.length);
        setVariant(v => (v + 1) % METRIC_VARIANTS.length);
        setAnimating(false);
      }, 300);
    }, 4000);
    return () => clearInterval(t);
  }, [paused, prefersReducedMotion]);

  const handlePointerMove = (event) => {
    if (paused || prefersReducedMotion || !previewRef.current) return;
    const rect = previewRef.current.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    previewRef.current.style.setProperty("--tilt-x", `${(y * -3).toFixed(2)}deg`);
    previewRef.current.style.setProperty("--tilt-y", `${(x * 4).toFixed(2)}deg`);
    previewRef.current.style.setProperty("--spot-x", `${(x + 0.5) * 100}%`);
    previewRef.current.style.setProperty("--spot-y", `${(y + 0.5) * 100}%`);
  };

  const resetPointer = () => {
    if (!previewRef.current) return;
    previewRef.current.style.setProperty("--tilt-x", "0deg");
    previewRef.current.style.setProperty("--tilt-y", "0deg");
    previewRef.current.style.setProperty("--spot-x", "50%");
    previewRef.current.style.setProperty("--spot-y", "40%");
  };

  const changeScreen = (index) => {
    setScreen(index);
    setVariant((value) => (value + 1) % METRIC_VARIANTS.length);
    setAnimating(true);
    window.setTimeout(() => setAnimating(false), 300);
  };

  return (
    <div className="live-dashboard">
      <div
        ref={previewRef}
        className="preview-window"
        onPointerMove={handlePointerMove}
        onPointerLeave={resetPointer}
      >
        {/* Title bar */}
        <div className="preview-bar">
          <span /><span /><span />
          <div className="preview-tabs">
            {SCREENS.map((s, i) => (
              <button
                key={s.id}
                className={`preview-tab ${screen === i ? "active" : ""}`}
                onClick={() => changeScreen(i)}
              >
                {s.tab}
              </button>
            ))}
          </div>
          <em>hiretrack / {SCREENS[screen].label}</em>
        </div>

        {/* Body */}
        <div className="preview-body">
          {/* Sidebar */}
          <div className="preview-sidebar">
            {["D", "J", "A", "I", "O"].map((l, i) => (
              <div key={l} className={`preview-sb-item ${screen === 0 && i === 0 ? "active" : screen === 1 && i === 2 ? "active" : screen === 2 && i === 4 ? "active" : ""}`}>
                {l}
              </div>
            ))}
          </div>

          {/* Screen content */}
          <div className={`preview-content ${animating ? "fading" : "visible"}`}>
            {screen === 0 && <DashboardScreen variant={variant} />}
            {screen === 1 && <KanbanScreen />}
            {screen === 2 && <OfferScreen />}
          </div>
        </div>

        {/* Live indicator */}
        <div className="preview-live">
          <span className="preview-live-dot" />
          {paused || prefersReducedMotion ? "Preview paused" : "Live preview"}
          <div className="preview-dots">
            {SCREENS.map((_, i) => (
              <button
                key={i}
                type="button"
                className={`pdot ${screen === i ? "active" : ""}`}
                aria-label={`Show ${SCREENS[i].tab} preview`}
                aria-pressed={screen === i}
                onClick={() => changeScreen(i)}
              />
            ))}
          </div>
          <button
            type="button"
            className="preview-motion-toggle"
            onClick={() => setPaused((value) => !value)}
            aria-pressed={paused}
          >
            {paused ? "Play" : "Pause"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   INTERACTIVE PIPELINE
   Click a step to expand it with real detail about what your
   app does at that stage.
───────────────────────────────────────────────────────────── */
const PIPELINE_STEPS = [
  {
    icon: "briefcase",
    label: "Post a Role",
    role: "Delivery",
    roleColor: "brand",
    short: "Delivery drafts the job spec",
    detail: "A Delivery team member fills in job title, description, tech stack, experience, location, openings, and assigns a TAG member. The job is saved with status CREATED and queued for TFG review — it's never visible to candidates yet.",
    pills: ["Title & description", "Tech stack", "Salary & openings", "Deadline"],
  },
  {
    icon: "check",
    label: "TFG Review",
    role: "TFG",
    roleColor: "amber",
    short: "Approve before it goes live",
    detail: "A TFG reviewer sees all CREATED jobs in their review queue. They can approve the job (moves it to APPROVED, visible to candidates), request changes (back to Delivery), or reject it. Nothing goes live without a TFG sign-off.",
    pills: ["Approve", "Request changes", "Reject"],
  },
  {
    icon: "users",
    label: "Candidates Apply",
    role: "Candidate",
    roleColor: "teal",
    short: "One-click apply, no duplicates",
    detail: "Candidates browse APPROVED jobs with full details. One click submits the application. The backend checks for duplicates — you can't apply twice. The application appears in the TAG team's kanban board immediately.",
    pills: ["Browse jobs", "Apply once", "Track status", "Get notified"],
  },
  {
    icon: "calendar",
    label: "Interview Rounds",
    role: "TAG",
    roleColor: "violet",
    short: "L1 → L2 → HR with feedback",
    detail: "TAG schedules L1, L2, and R1 (HR) interview rounds. After each round, the interviewer adds feedback notes. The TAG team then decides: clear the round (moves to next), reject, or send an offer. Status updates propagate to the candidate's dashboard in real time.",
    pills: ["L1 Technical", "L2 Advanced", "R1 HR", "Feedback"],
  },
  {
    icon: "gift",
    label: "Release Offer",
    role: "TAG",
    roleColor: "pink",
    short: "Issue and track the offer",
    detail: "After all rounds clear, TAG creates an offer with a joining date. The candidate sees it on their Offers page and can Accept or Decline. If accepted, TAG marks the joining date to confirm. The offer status moves: OFFER_RELEASED → ACCEPTED → JOINED.",
    pills: ["Offer released", "Candidate accepts", "Joining confirmed"],
  },
  {
    icon: "sparkle",
    label: "Hired",
    role: "Everyone",
    roleColor: "green",
    short: "Candidate joins your team",
    detail: "Once the candidate marks joining, the application status becomes HIRED. The dashboard counters update, the pipeline fills, and the hired candidate no longer appears in the active queue. The full history — every interview, every status change — is preserved.",
    pills: ["Status: JOINED", "Pipeline complete", "History preserved"],
  },
];

function InteractivePipeline() {
  const [active, setActive] = useState(null);
  const [visited, setVisited] = useState(new Set());
  const lineRef = useRef(null);
  const stepsRef = useRef([]);

  const toggle = useCallback((i) => {
    setActive(prev => prev === i ? null : i);
    setVisited(v => new Set([...v, i]));
  }, []);

  // Animate the progress line to the active step
  useEffect(() => {
    if (!lineRef.current || active === null) return;
    const progress = (active + 0.5) / PIPELINE_STEPS.length;
    lineRef.current.style.setProperty("--progress", progress.toFixed(3));
  }, [active]);

  return (
    <div className="ipipe-wrapper">
      {/* Connector line with animated fill */}
      <div className="ipipe-track">
        <div className="ipipe-line-bg" />
        <div className="ipipe-line-fill" ref={lineRef}
          style={{ "--progress": active !== null ? ((active + 0.5) / PIPELINE_STEPS.length).toFixed(3) : "0" }} />

        {PIPELINE_STEPS.map((step, i) => (
          <div
            key={step.label}
            className={`ipipe-step ${active === i ? "open" : ""} ${visited.has(i) ? "visited" : ""}`}
            style={{ "--i": i }}
            ref={el => stepsRef.current[i] = el}
          >
            {/* Node */}
            <button
              className="ipipe-node"
              onClick={() => toggle(i)}
              aria-expanded={active === i}
              aria-label={`${step.label}: ${step.short}`}
            >
              <span className={`ipipe-node-ring tone-${step.roleColor}`} />
              <Icon name={step.icon} size={22} />
              {visited.has(i) && active !== i && (
                <span className="ipipe-visited-dot" aria-hidden="true" />
              )}
            </button>

            {/* Label below node */}
            <div className="ipipe-label">
              <strong>{step.label}</strong>
              <span className={`ipipe-role tone-${step.roleColor}`}>{step.role}</span>
            </div>

            {/* Expanded detail card — drops below the step */}
            {active === i && (
              <div className="ipipe-detail" role="region" aria-label={step.label}>
                <div className="ipipe-detail-inner">
                  <div className="ipipe-detail-head">
                    <span className={`ipipe-detail-icon tone-${step.roleColor}`}>
                      <Icon name={step.icon} size={18} />
                    </span>
                    <div>
                      <h4>{step.label}</h4>
                      <span className={`ipipe-role-badge tone-${step.roleColor}`}>{step.role}</span>
                    </div>
                  </div>
                  <p className="ipipe-detail-desc">{step.detail}</p>
                  <div className="ipipe-pills">
                    {step.pills.map(p => (
                      <span key={p} className={`ipipe-pill tone-${step.roleColor}`}>{p}</span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <p className="ipipe-hint">
        <Icon name="dot" size={8} />
        Click any stage to see exactly what happens in the app
      </p>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────────────────────────── */
export default function Landing() {
  const navigate = useNavigate();

  const candidateFeatures = [
    { icon: "search", title: "Browse open roles", desc: "Explore approved positions with tech stack, salary, location, and openings. Only live jobs appear." },
    { icon: "zap",    title: "One-click apply",   desc: "Submit in a click. Duplicate check enforced server-side — you can't accidentally apply twice." },
    { icon: "chart",  title: "Track every stage", desc: "Applied → Shortlisted → Interview → Offer → Hired. See where you are in real time." },
    { icon: "hand",   title: "Accept or decline", desc: "Review the offer with joining date. Accept or decline — the company sees your decision immediately." },
  ];

  const companyFeatures = [
    { icon: "layers", title: "Role-based access",   desc: "Delivery, TFG, TAG each see only their slice. JWT-secured, every endpoint role-checked." },
    { icon: "flow",   title: "Approval gate",       desc: "Nothing goes live without TFG sign-off. No rogue job postings, no unreviewed positions." },
    { icon: "people", title: "Team management",     desc: "Add team members with specific roles, set departments, locations, and employee IDs." },
    { icon: "shield", title: "Secure by default",   desc: "BCrypt hashing, JWT auth, Bean Validation on every input, and structured error responses." },
  ];

  return (
    <div className="landing">

      {/* ── Nav ──────────────────────────────────────────── */}
      <nav className="landing-nav">
        <div className="landing-brand">
          <span className="landing-brand-mark" aria-hidden="true" />
          HireTrack
        </div>
        <div className="landing-nav-links">
          <a href="#how">How it works</a>
          <a href="#features">Features</a>
          <button className="landing-nav-signin" onClick={() => navigate("/login")}>Sign in</button>
        </div>
      </nav>

      {/* ── Hero ─────────────────────────────────────────── */}
      <section className="landing-hero">
        <span className="hero-orb hero-orb-1" aria-hidden="true" />
        <span className="hero-orb hero-orb-2" aria-hidden="true" />
        <span className="hero-orb hero-orb-3" aria-hidden="true" />
        <span className="hero-grid" aria-hidden="true" />

        <div className="hero-content">
          <span className="hero-eyebrow">Hiring, tracked end to end</span>
          <h1>
            From application<br />
            to <span className="hero-accent">signed offer</span>
          </h1>
          <p className="hero-sub">
            One workspace for candidates and hiring teams. Post roles, review
            applicants, schedule interviews, and close offers — without
            spreadsheets, email chains, or lost candidates.
          </p>
          <div className="hero-ctas">
            <button className="hero-cta-primary" onClick={() => navigate("/signup")}>
              I'm looking for a job
              <Icon name="arrow" size={18} />
            </button>
            <button className="hero-cta-secondary" onClick={() => navigate("/company-signup")}>
              I'm hiring
            </button>
          </div>
          <div className="hero-stats">
            <div className="hero-stat"><strong>6</strong><span>pipeline stages</span></div>
            <div className="hero-stat"><strong>5</strong><span>team roles</span></div>
            <div className="hero-stat"><strong>1</strong><span>unified workspace</span></div>
          </div>
          <div className="hero-proof" aria-label="HireTrack highlights">
            <span><Icon name="check" size={14} /> Role-aware by default</span>
            <span><Icon name="check" size={14} /> Every stage visible</span>
          </div>
        </div>

        {/* Live animated dashboard */}
        <div className="hero-preview">
          <div className="hero-preview-badge">
            <span className="hero-preview-badge-dot" aria-hidden="true" />
            <span><strong>Live product preview</strong><small>Built around your workflow</small></span>
          </div>
          <LiveDashboard />
        </div>
      </section>

      {/* ── Pipeline ─────────────────────────────────────── */}
      <section className="landing-pipeline" id="how">
        <div className="section-head">
          <span className="section-eyebrow">How it works</span>
          <h2>A pipeline, not a pile of emails</h2>
          <p>Every candidate moves through the same clear stages. Click any step to see exactly what happens.</p>
        </div>
        <InteractivePipeline />
      </section>

      {/* ── Features ─────────────────────────────────────── */}
      <section className="landing-command" id="overview">
        <div className="command-grid">
          <div className="command-copy">
            <span className="section-eyebrow">Hiring command center</span>
            <h2>See what needs attention before it becomes a bottleneck.</h2>
            <p>HireTrack gives every team a shared view of open roles, candidate movement, interviews, and offers—while keeping permissions clear.</p>
            <ul className="command-benefits">
              <li><span><Icon name="check" size={16} /></span><div><strong>One source of truth</strong><small>Every decision stays attached to the candidate journey.</small></div></li>
              <li><span><Icon name="check" size={16} /></span><div><strong>Clear ownership</strong><small>Delivery, TFG, TAG, and candidates see their next action.</small></div></li>
              <li><span><Icon name="check" size={16} /></span><div><strong>Fewer handoff gaps</strong><small>Approval, interviews, and offers move in one connected flow.</small></div></li>
            </ul>
            <button className="command-link" onClick={() => navigate("/login")}>Explore the workspace <Icon name="arrow" size={16} /></button>
          </div>
          <div className="command-bento" aria-label="Illustrative HireTrack workflow overview">
            <div className="command-panel command-wide">
              <div className="command-panel-head"><span>Hiring overview</span><em>Live workflow</em></div>
              <div className="command-stage-row">
                <div><strong>12</strong><span>Open roles</span></div>
                <div><strong>38</strong><span>Applications</span></div>
                <div><strong>14</strong><span>Interviews</span></div>
                <div><strong>4</strong><span>Offers</span></div>
              </div>
              <div className="command-progress"><span style={{ "--progress": "78%" }} /></div>
              <div className="command-progress-label"><span>Hiring pipeline health</span><strong>78%</strong></div>
            </div>
            <div className="command-panel command-activity">
              <div className="command-panel-head"><span>Next actions</span><Icon name="arrow" size={15} /></div>
              <div className="command-action"><i className="tone-amber" /><span>TFG review pending</span><b>3</b></div>
              <div className="command-action"><i className="tone-teal" /><span>Interviews today</span><b>5</b></div>
              <div className="command-action"><i className="tone-pink" /><span>Offers awaiting reply</span><b>2</b></div>
            </div>
            <div className="command-panel command-timeline">
              <div className="command-panel-head"><span>Candidate journey</span><span className="command-live"><i /> Connected</span></div>
              <div className="command-timeline-track">
                {[["Applied", "info"], ["Shortlisted", "amber"], ["Interview", "brand"], ["Offer", "pink"], ["Hired", "green"]].map(([label, tone], i) => (
                  <div key={label} className="command-timeline-step"><span className={`tone-${tone}`} /><small>{label}</small>{i < 4 && <i />}</div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="landing-features" id="features">
        <div className="section-head">
          <span className="section-eyebrow">Built for both sides</span>
          <h2>One platform, two experiences</h2>
          <p>Candidates get clarity. Companies get control. Same real-time data, different views.</p>
        </div>
        <div className="features-grid">
          <div className="features-col">
            <div className="features-col-head tone-brand">
              <span className="features-col-icon"><Icon name="search" size={22} /></span>
              <div><h3>For Candidates</h3><p>Find, apply, and track — without the guesswork.</p></div>
            </div>
            <div className="features-list">
              {candidateFeatures.map((f, i) => (
                <div className="feature-card" key={f.title} style={{ "--i": i }}>
                  <span className="feature-icon tone-brand"><Icon name={f.icon} size={20} /></span>
                  <div><h4>{f.title}</h4><p>{f.desc}</p></div>
                </div>
              ))}
            </div>
          </div>
          <div className="features-col">
            <div className="features-col-head tone-amber">
              <span className="features-col-icon"><Icon name="layers" size={22} /></span>
              <div><h3>For Companies</h3><p>Post, review, interview, and hire — with role-based access.</p></div>
            </div>
            <div className="features-list">
              {companyFeatures.map((f, i) => (
                <div className="feature-card" key={f.title} style={{ "--i": i }}>
                  <span className="feature-icon tone-amber"><Icon name={f.icon} size={20} /></span>
                  <div><h4>{f.title}</h4><p>{f.desc}</p></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────── */}
      <section className="landing-cta">
        <div className="cta-card">
          <span className="cta-orb cta-orb-1" aria-hidden="true" />
          <span className="cta-orb cta-orb-2" aria-hidden="true" />
          <div className="cta-content">
            <h2>Ready to change how you hire?</h2>
            <p>Sign up in seconds. No credit card, no setup fee, no spreadsheets.</p>
            <div className="cta-btns">
              <button className="cta-btn-primary" onClick={() => navigate("/signup")}>Create candidate account</button>
              <button className="cta-btn-secondary" onClick={() => navigate("/company-signup")}>Register your company</button>
            </div>
            <p className="cta-foot">Already have an account? <button onClick={() => navigate("/login")}>Sign in</button></p>
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────── */}
      <footer className="landing-footer">
        <div className="footer-brand">
          <span className="landing-brand-mark sm" aria-hidden="true" />
          HireTrack
        </div>
        <p>Hiring, tracked end to end. Built for candidates and hiring teams.</p>
      </footer>
    </div>
  );
}
