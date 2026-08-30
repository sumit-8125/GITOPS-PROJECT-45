const http = require('http');

let users = [
  { id: 1, name: "Admin", email: "admin@cloudflux.io", password: "password123" }
];

let applications = [
  {
    id: 1,
    name: "order-service",
    repository: "github.com/cloudflux/order-service",
    environment: "production",
    version: "v1.4.2",
    health: "Healthy",
    sync_status: "Synced",
    replicas: 3,
    live_source: "ArgoCD",
    created_at: new Date().toISOString()
  },
  {
    id: 2,
    name: "payment-service",
    repository: "github.com/cloudflux/payment-service",
    environment: "production",
    version: "v2.1.0",
    health: "Degraded",
    sync_status: "OutOfSync",
    replicas: 4,
    live_source: "ArgoCD",
    created_at: new Date().toISOString()
  },
  {
    id: 3,
    name: "user-service",
    repository: "github.com/cloudflux/user-service",
    environment: "production",
    version: "v1.3.7",
    health: "Healthy",
    sync_status: "Synced",
    replicas: 2,
    live_source: "ArgoCD",
    created_at: new Date().toISOString()
  }
];

let deployments = [
  {
    id: 1,
    application: "order-service",
    version: "v1.4.2",
    status: "Synced",
    commit_sha: "7f4c91a",
    desired_replicas: 3,
    available_replicas: 3,
    percent_complete: 100,
    created_at: new Date(Date.now() - 3600000).toISOString()
  },
  {
    id: 2,
    application: "payment-service",
    version: "v2.1.0",
    status: "Progressing",
    commit_sha: "e38a20f",
    desired_replicas: 4,
    available_replicas: 3,
    percent_complete: 75,
    created_at: new Date(Date.now() - 1200000).toISOString()
  },
  {
    id: 3,
    application: "user-service",
    version: "v1.3.7",
    status: "Synced",
    commit_sha: "b91d4e2",
    desired_replicas: 2,
    available_replicas: 2,
    percent_complete: 100,
    created_at: new Date(Date.now() - 7200000).toISOString()
  }
];

let alerts = [
  {
    id: 1,
    severity: "critical",
    service: "payment-service",
    message: "High error rate (4xx/5xx spike)",
    value: "2.14%",
    status: "firing",
    created_at: new Date().toISOString()
  },
  {
    id: 2,
    severity: "warning",
    service: "order-service",
    message: "P95 latency elevated",
    value: "820ms",
    status: "firing",
    created_at: new Date().toISOString()
  }
];

let incidents = [
  {
    id: 1,
    title: "Payment gateway latency degradation",
    severity: "critical",
    service: "payment-service",
    status: "open",
    description: "Upstream payment provider experiencing transient timeout spikes.",
    created_at: new Date().toISOString()
  }
];

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host}`);
  const path = url.pathname;

  let body = '';
  req.on('data', chunk => { body += chunk; });
  req.on('end', () => {
    let data = {};
    if (body) {
      try { data = JSON.parse(body); } catch (e) {}
    }

    const sendJson = (statusCode, payload) => {
      res.writeHead(statusCode, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(payload));
    };

    // Routing
    if (path === '/api/health') {
      return sendJson(200, { status: 'healthy', service: 'cloudflux-api' });
    }

    if (path === '/api/auth/register' && req.method === 'POST') {
      const { name, email, password } = data;
      const user = { id: users.length + 1, name: name || "Admin", email: email || "admin@cloudflux.io", password: password || "password123" };
      users.push(user);
      return sendJson(201, {
        user: { id: user.id, name: user.name, email: user.email },
        token: "token-" + Date.now()
      });
    }

    if (path === '/api/auth/login' && req.method === 'POST') {
      const { email } = data;
      const user = users.find(u => u.email === (email || "").toLowerCase()) || users[0];
      return sendJson(200, {
        user: { id: user.id, name: user.name, email: user.email },
        token: "token-" + Date.now()
      });
    }

    if (path === '/api/me') {
      const user = users[0];
      return sendJson(200, { id: user.id, name: user.name, email: user.email });
    }

    if (path === '/api/dashboard') {
      // Dynamic live variance for latency chart
      const latencyHistory = [35, 42, 38, 55, 48, 64, 52, 70, 45, 58, 49, 65, 54, 72, 42];
      return sendJson(200, {
        applications: applications.length,
        healthy: applications.filter(a => a.health === "Healthy").length,
        deployments: deployments.length,
        open_incidents: incidents.filter(i => i.status === "open").length,
        firing_alerts: alerts.filter(a => a.status === "firing").length,
        cluster: {
          status: "Healthy",
          nodes: 4,
          pods: 12,
          pods_running: 12,
          deployments: applications.length,
          cpu: Math.floor(25 + Math.random() * 8),
          memory: 48
        },
        traffic: {
          requests_per_minute: 1240 + Math.floor(Math.random() * 50),
          error_rate: 0.04,
          p95_latency_ms: 42 + Math.floor(Math.random() * 5),
          latency_history: latencyHistory
        }
      });
    }

    if (path === '/api/applications') {
      if (req.method === 'GET') {
        return sendJson(200, applications);
      }
      if (req.method === 'POST') {
        const newApp = {
          id: applications.length + 1,
          name: data.name || "new-service",
          repository: data.repository || "",
          environment: data.environment || "production",
          version: data.version || "v1.0.0",
          health: "Healthy",
          sync_status: "Synced",
          replicas: Number(data.replicas) || 2,
          live_source: "ArgoCD",
          created_at: new Date().toISOString()
        };
        applications.unshift(newApp);
        return sendJson(201, newApp);
      }
    }

    if (path === '/api/deployments') {
      if (req.method === 'GET') {
        return sendJson(200, deployments);
      }
      if (req.method === 'POST') {
        const app = applications.find(a => a.id === data.application_id) || applications[0];
        const newDep = {
          id: deployments.length + 1,
          application: app.name,
          version: data.version || "v1.0.0",
          status: "Progressing",
          commit_sha: data.commit_sha || "a9b8c7d",
          desired_replicas: app.replicas || 2,
          available_replicas: 1,
          percent_complete: 50,
          created_at: new Date().toISOString()
        };
        deployments.unshift(newDep);
        return sendJson(201, newDep);
      }
    }

    if (path === '/api/alerts') {
      return sendJson(200, alerts);
    }

    if (path === '/api/incidents') {
      return sendJson(200, incidents);
    }

    return sendJson(404, { error: 'Not found' });
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`CloudFlux API server listening on http://localhost:${PORT}`);
});
