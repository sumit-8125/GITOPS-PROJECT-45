import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

async function api(path, options = {}) {
  const token = localStorage.getItem("cloudflux_token");

  const response = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {})
    }
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Request failed");
  }

  return data;
}

function Login({ onLogin }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: ""
  });
  const [error, setError] = useState("");

  async function submit(e) {
    e.preventDefault();
    setError("");

    try {
      const data = await api(`/auth/${mode === "login" ? "login" : "register"}`, {
        method: "POST",
        body: JSON.stringify(form)
      });

      localStorage.setItem("cloudflux_token", data.token);
      onLogin(data.user);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="brand large">
          <span className="brand-hitman">HITMAN</span> <span className="brand-cloud">CLOUD</span><span className="brand-flux">FLUX</span>
        </div>
        <p className="muted">Cloud-native deployment control plane</p>

        <form onSubmit={submit}>
          {mode === "register" && (
            <input
              placeholder="Name"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
            />
          )}

          <input
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={e => setForm({ ...form, email: e.target.value })}
            required
          />

          <input
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={e => setForm({ ...form, password: e.target.value })}
            required
          />

          {error && <div className="error">{error}</div>}

          <button className="primary full">
            {mode === "login" ? "Sign in" : "Create account"}
          </button>
        </form>

        <button className="link-button" onClick={() => setMode(mode === "login" ? "register" : "login")}>
          {mode === "login" ? "Create a new account" : "Already have an account? Sign in"}
        </button>
      </div>
    </div>
  );
}

function App() {
  const [user, setUser] = useState(null);
  const [page, setPage] = useState("dashboard");
  const [dashboard, setDashboard] = useState(null);
  const [applications, setApplications] = useState([]);
  const [deployments, setDeployments] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [modal, setModal] = useState(false);
  const [loading, setLoading] = useState(true);

  async function load(isInitial = false) {
    try {
      if (isInitial) {
        const me = await api("/me");
        setUser(me);
      }

      const [d, a, dep, al, inc] = await Promise.all([
        api("/dashboard"),
        api("/applications"),
        api("/deployments"),
        api("/alerts"),
        api("/incidents")
      ]);

      setDashboard(d);
      setApplications(a);
      setDeployments(dep);
      setAlerts(al);
      setIncidents(inc);
    } catch (err) {
      if (isInitial) {
        localStorage.removeItem("cloudflux_token");
        setUser(null);
      }
    } finally {
      if (isInitial) {
        setLoading(false);
      }
    }
  }

  useEffect(() => {
    load(true); // Initial load
    const timer = setInterval(() => {
      load(false); // Background live polling every 5s
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  if (loading) {
    return <div className="loading">Loading HITMAN CLOUDFLUX...</div>;
  }

  if (!user) {
    return <Login onLogin={setUser} />;
  }

  function logout() {
    localStorage.removeItem("cloudflux_token");
    setUser(null);
  }

  return (
    <div className="app">
      <Sidebar page={page} setPage={setPage} logout={logout} />

      <main className="main">
        <header className="topbar">
          <div>
            <h1>{pageTitle(page)}</h1>
            <p className="muted">Production environment · EKS</p>
          </div>

          <div className="top-actions">
            <span className="live-badge">
              <span className="pulse-dot"></span> Live Sync
            </span>
            <span className="status-dot">●</span>
            {dashboard?.cluster?.status || "Cluster Healthy"}
            <div className="avatar">{user.name?.slice(0, 1).toUpperCase()}</div>
          </div>
        </header>

        {page === "dashboard" && (
          <Dashboard
            data={dashboard}
            applications={applications}
            alerts={alerts}
            incidents={incidents}
            onCreate={() => setModal(true)}
          />
        )}

        {page === "applications" && (
          <Applications applications={applications} onCreate={() => setModal(true)} />
        )}

        {page === "deployments" && <Deployments deployments={deployments} />}

        {page === "incidents" && <Incidents incidents={incidents} />}

        {page === "observability" && <Observability data={dashboard} />}

        {page === "chaos" && <Chaos />}

        {modal && (
          <CreateApplication
            onClose={() => setModal(false)}
            onCreated={() => {
              setModal(false);
              load(false);
            }}
          />
        )}
      </main>
    </div>
  );
}

function Sidebar({ page, setPage, logout }) {
  const items = [
    ["dashboard", "⌂", "Dashboard"],
    ["applications", "▦", "Applications"],
    ["deployments", "↗", "Deployments"],
    ["observability", "◉", "Observability"],
    ["incidents", "!", "Incidents"],
    ["chaos", "⚡", "Chaos Lab"]
  ];

  return (
    <aside className="sidebar">
      <div className="brand">
        <span className="brand-hitman">HITMAN</span> <span className="brand-cloud">CLOUD</span><span className="brand-flux">FLUX</span>
      </div>

      <div className="environment">
        <small>ENVIRONMENT</small>
        <strong>production</strong>
        <span>●</span>
      </div>

      <nav>
        {items.map(([id, icon, label]) => (
          <button
            key={id}
            className={page === id ? "nav active" : "nav"}
            onClick={() => setPage(id)}
          >
            <span>{icon}</span>{label}
          </button>
        ))}
      </nav>

      <div className="sidebar-bottom">
        <button className="nav" onClick={logout}>↪ Sign out</button>
      </div>
    </aside>
  );
}

function Dashboard({ data, applications, alerts, incidents, onCreate }) {
  if (!data) return <div className="loading">Loading dashboard...</div>;

  return (
    <>
      <section className="hero-row">
        <div>
          <span className="eyebrow">PLATFORM OVERVIEW</span>
          <h2>Ship faster. Operate smarter.</h2>
          <p className="muted">One control plane for your Kubernetes workloads.</p>
        </div>
        <button className="primary" onClick={onCreate}>+ Create Application</button>
      </section>

      <section className="metrics">
        <Metric title="Applications" value={data.applications} sub={`${data.healthy} healthy`} />
        <Metric title="Deployments" value={data.deployments} sub="Last 24 hours" />
        <Metric title="Error Rate" value={`${data.traffic?.error_rate ?? 0}%`} sub="Within SLO" good />
        <Metric title="P95 Latency" value={`${data.traffic?.p95_latency_ms ?? 0}ms`} sub="Target < 300ms" good />
      </section>

      <div className="grid-2">
        <Card title="Service Health">
          <div className="service-map">
            {applications.map(a => (
              <div className="service" key={a.id}>
                <div className="service-icon">{a.name.slice(0, 1).toUpperCase()}</div>
                <div>
                  <strong>
                    {a.name}
                    {a.live_source && <span className="argo-badge">ArgoCD</span>}
                  </strong>
                  <small>{a.environment} · {a.version}</small>
                </div>
                <span className={a.health === "Healthy" ? "pill green" : "pill orange"}>
                  {a.health}
                </span>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Cluster">
          <div className="cluster">
            <div className="cluster-main">
              <div className="big-status">●</div>
              <div>
                <strong>prod-eks</strong>
                <span>{data.cluster?.status || "Healthy"} · {data.cluster?.nodes || 4} nodes</span>
              </div>
            </div>
            <div className="cluster-stats">
              <div><small>Pods</small><strong>{data.cluster?.pods || 0}</strong></div>
              <div><small>CPU</small><strong>{data.cluster?.cpu || 28}%</strong></div>
              <div><small>Memory</small><strong>{data.cluster?.memory || 45}%</strong></div>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid-2">
        <Card title="Recent Alerts">
          {alerts.length === 0 ? (
            <Empty text="No active alerts" />
          ) : alerts.slice(0, 4).map(a => (
            <div className="list-row" key={a.id}>
              <span className={`severity ${a.severity}`}>{a.severity}</span>
              <div>
                <strong>{a.message}</strong>
                <small>{a.service}</small>
              </div>
              <b>{a.value}</b>
            </div>
          ))}
        </Card>

        <Card title="Open Incidents">
          {incidents.length === 0 ? (
            <Empty text="No open incidents" />
          ) : incidents.slice(0, 4).map(i => (
            <div className="list-row" key={i.id}>
              <span className={`severity ${i.severity}`}>{i.severity}</span>
              <div>
                <strong>{i.title}</strong>
                <small>{i.service}</small>
              </div>
              <span className="pill orange">{i.status}</span>
            </div>
          ))}
        </Card>
      </div>
    </>
  );
}

function Applications({ applications, onCreate }) {
  return (
    <>
      <div className="page-actions">
        <div>
          <h2>Applications</h2>
          <p className="muted">Manage workloads and deployment state.</p>
        </div>
        <button className="primary" onClick={onCreate}>+ Create Application</button>
      </div>

      <Card>
        <div className="table">
          <div className="table-head">
            <span>Application</span>
            <span>Environment</span>
            <span>Version</span>
            <span>Health</span>
            <span>Sync</span>
          </div>

          {applications.map(a => (
            <div className="table-row" key={a.id}>
              <strong>
                {a.name}
                {a.live_source && <span className="argo-badge">ArgoCD</span>}
              </strong>
              <span>{a.environment}</span>
              <span className="mono">{a.version}</span>
              <span className={a.health === "Healthy" ? "pill green" : "pill orange"}>{a.health}</span>
              <span className={a.sync_status === "Synced" ? "pill green" : "pill red"}>{a.sync_status}</span>
            </div>
          ))}
        </div>
      </Card>
    </>
  );
}

function Deployments({ deployments }) {
  return (
    <Card title="Deployment History">
      <div className="table">
        <div className="table-head">
          <span>Application</span>
          <span>Version</span>
          <span>Status</span>
          <span>Commit</span>
          <span>Time</span>
        </div>

        {deployments.map(d => (
          <div className="table-row" key={d.id}>
            <div>
              <strong>{d.application}</strong>
              {d.desired_replicas && (
                <div className="progress-container" style={{marginTop: '4px'}}>
                  <div className="progress-bar-bg">
                    <div
                      className="progress-bar-fill"
                      style={{width: `${d.percent_complete || 100}%`}}
                    />
                  </div>
                  <small style={{fontSize: '10px', color: '#7184a4'}}>
                    {d.available_replicas}/{d.desired_replicas} pods ({d.percent_complete || 100}%)
                  </small>
                </div>
              )}
            </div>
            <span className="mono">{d.version}</span>
            <span className={d.status === "Synced" || d.status === "Deployed" ? "pill green" : "pill orange"}>
              {d.status}
            </span>
            <span className="mono">{d.commit_sha || "—"}</span>
            <span>{new Date(d.created_at).toLocaleString()}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

function Incidents({ incidents }) {
  return (
    <Card title="Incident Center">
      {incidents.map(i => (
        <div className="incident" key={i.id}>
          <div className={`incident-bar ${i.severity}`} />
          <div>
            <h3>{i.title}</h3>
            <p>{i.description}</p>
            <small>{i.service} · {i.status}</small>
          </div>
        </div>
      ))}
    </Card>
  );
}

function Observability({ data }) {
  const history = data?.traffic?.latency_history || [35, 48, 40, 62, 54, 75, 68, 82, 58, 64, 52, 72, 60, 80, 66];
  const maxVal = Math.max(...history, 50);

  return (
    <>
      <div className="metrics">
        <Metric title="Requests / min" value={data?.traffic?.requests_per_minute?.toLocaleString() || "—"} sub="Live traffic" />
        <Metric title="Error rate" value={`${data?.traffic?.error_rate ?? 0}%`} sub="5xx + 4xx" good />
        <Metric title="P95 latency" value={`${data?.traffic?.p95_latency_ms ?? 0}ms`} sub="API latency" good />
        <Metric title="Pods" value={data?.cluster?.pods ?? 0} sub="Running" />
      </div>

      <Card title="Request Latency (P95 Trend)">
        <div className="chart">
          {history.map((v, i) => {
            const heightPct = Math.min(100, Math.max(12, Math.round((v / maxVal) * 100)));
            return (
              <div
                key={i}
                className="bar"
                style={{ height: `${heightPct}%` }}
                title={`${v}ms`}
              />
            );
          })}
        </div>
      </Card>
    </>
  );
}

function Chaos() {
  const [mode, setMode] = useState("normal");
  const [running, setRunning] = useState(false);

  return (
    <Card title="Chaos Lab">
      <p className="muted">
        Controlled failure experiments for resilience testing.
      </p>

      <div className="chaos-grid">
        {[
          ["normal", "Normal"],
          ["latency", "Add 3s latency"],
          ["error", "Return HTTP 500"],
          ["database", "Database failure"]
        ].map(([value, label]) => (
          <button
            key={value}
            className={mode === value ? "chaos-option selected" : "chaos-option"}
            onClick={() => setMode(value)}
          >
            {label}
          </button>
        ))}
      </div>

      <button
        className="danger"
        onClick={() => {
          setRunning(true);
          setTimeout(() => setRunning(false), 3000);
        }}
      >
        {running ? "Running experiment..." : "Run Chaos Test"}
      </button>

      {running && (
        <div className="experiment">
          <span>Experiment: {mode}</span>
          <span>Telemetry: collecting</span>
          <span>Protection: enabled</span>
        </div>
      )}
    </Card>
  );
}

function CreateApplication({ onClose, onCreated }) {
  const [form, setForm] = useState({
    name: "",
    repository: "",
    environment: "production",
    version: "v1.0.0",
    replicas: 2
  });
  const [error, setError] = useState("");

  async function submit(e) {
    e.preventDefault();

    try {
      await api("/applications", {
        method: "POST",
        body: JSON.stringify(form)
      });

      onCreated();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <div className="modal-head">
          <div>
            <h2>Create Application</h2>
            <p className="muted">Register a new workload.</p>
          </div>
          <button className="close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={submit}>
          <label>Application name</label>
          <input
            value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
            placeholder="payment-service"
            required
          />

          <label>Git repository</label>
          <input
            value={form.repository}
            onChange={e => setForm({ ...form, repository: e.target.value })}
            placeholder="github.com/org/repository"
          />

          <label>Environment</label>
          <select
            value={form.environment}
            onChange={e => setForm({ ...form, environment: e.target.value })}
          >
            <option>development</option>
            <option>staging</option>
            <option>production</option>
          </select>

          <label>Initial version</label>
          <input
            value={form.version}
            onChange={e => setForm({ ...form, version: e.target.value })}
          />

          <label>Replicas</label>
          <input
            type="number"
            min="1"
            max="50"
            value={form.replicas}
            onChange={e => setForm({ ...form, replicas: Number(e.target.value) })}
          />

          {error && <div className="error">{error}</div>}

          <div className="modal-actions">
            <button type="button" className="secondary" onClick={onClose}>Cancel</button>
            <button className="primary">Create Application</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Metric({ title, value, sub, good }) {
  return (
    <div className="metric">
      <small>{title}</small>
      <strong>{value}</strong>
      <span className={good ? "good" : "muted"}>{sub}</span>
    </div>
  );
}

function Card({ title, children }) {
  return (
    <section className="card">
      {title && <div className="card-title">{title}</div>}
      {children}
    </section>
  );
}

function Empty({ text }) {
  return <div className="empty">{text}</div>;
}

function pageTitle(page) {
  return {
    dashboard: "Operations Center",
    applications: "Applications",
    deployments: "Deployments",
    observability: "Observability",
    incidents: "Incident Center",
    chaos: "Chaos Lab"
  }[page];
}

createRoot(document.getElementById("root")).render(<App />);
