import os
from datetime import datetime, timedelta, timezone

import jwt
from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import check_password_hash, generate_password_hash

from k8s_client import get_cluster_summary, get_deployment_rollout_status
from promql_client import get_traffic_summary
from argocd_client import get_applications as get_argocd_applications
from metrics import init_metrics

app = Flask(__name__)
init_metrics(app)  # exposes GET /metrics for Prometheus to scrape

app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv(
    "DATABASE_URL",
    "postgresql://postgres:password@localhost:5432/cloudflux"
)
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

db = SQLAlchemy(app)

CORS(
    app,
    origins=os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")
)

JWT_SECRET = os.getenv("JWT_SECRET", "dev-only-secret-change-me")


class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(255), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


class Application(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), unique=True, nullable=False)
    repository = db.Column(db.String(500))
    environment = db.Column(db.String(50), default="development")
    version = db.Column(db.String(100), default="v1.0.0")
    health = db.Column(db.String(50), default="Healthy")
    sync_status = db.Column(db.String(50), default="Synced")
    replicas = db.Column(db.Integer, default=2)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


class Deployment(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    application_id = db.Column(db.Integer, db.ForeignKey("application.id"), nullable=False)
    version = db.Column(db.String(100), nullable=False)
    status = db.Column(db.String(50), default="Progressing")
    commit_sha = db.Column(db.String(100))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


class Incident(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(255), nullable=False)
    severity = db.Column(db.String(50), default="warning")
    service = db.Column(db.String(120))
    status = db.Column(db.String(50), default="open")
    description = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


class Alert(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    severity = db.Column(db.String(50), nullable=False)
    service = db.Column(db.String(120), nullable=False)
    message = db.Column(db.String(500), nullable=False)
    value = db.Column(db.String(100))
    status = db.Column(db.String(50), default="firing")
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


def token_for(user):
    payload = {
        "sub": user.id,
        "email": user.email,
        "exp": datetime.now(timezone.utc) + timedelta(hours=12),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")


def auth_user():
    header = request.headers.get("Authorization", "")
    if not header.startswith("Bearer "):
        return None

    token = header.split(" ", 1)[1]

    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        return db.session.get(User, payload["sub"])
    except (jwt.InvalidTokenError, ValueError):
        return None


def serialize_application(a):
    return {
        "id": a.id,
        "name": a.name,
        "repository": a.repository,
        "environment": a.environment,
        "version": a.version,
        "health": a.health,
        "sync_status": a.sync_status,
        "replicas": a.replicas,
        "created_at": a.created_at.isoformat()
    }


@app.get("/api/health")
def health():
    return jsonify({"status": "healthy", "service": "cloudflux-api"})


@app.post("/api/auth/register")
def register():
    data = request.get_json() or {}
    name = data.get("name", "").strip()
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")

    if not name or not email or len(password) < 8:
        return jsonify({"error": "name, email and password of 8+ characters are required"}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({"error": "email already registered"}), 409

    user = User(
        name=name,
        email=email,
        password_hash=generate_password_hash(password)
    )
    db.session.add(user)
    db.session.commit()

    return jsonify({
        "user": {"id": user.id, "name": user.name, "email": user.email},
        "token": token_for(user)
    }), 201


@app.post("/api/auth/login")
def login():
    data = request.get_json() or {}
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")

    user = User.query.filter_by(email=email).first()

    if not user or not check_password_hash(user.password_hash, password):
        return jsonify({"error": "invalid credentials"}), 401

    return jsonify({
        "user": {"id": user.id, "name": user.name, "email": user.email},
        "token": token_for(user)
    })


@app.get("/api/me")
def me():
    user = auth_user()
    if not user:
        return jsonify({"error": "authentication required"}), 401

    return jsonify({
        "id": user.id,
        "name": user.name,
        "email": user.email
    })


@app.get("/api/applications")
def applications():
    user = auth_user()
    if not user:
        return jsonify({"error": "authentication required"}), 401

    items = Application.query.order_by(Application.created_at.desc()).all()
    argo_apps = {a["name"]: a for a in get_argocd_applications()}

    result = []
    for a in items:
        serialized = serialize_application(a)
        if a.name in argo_apps:
            serialized["health"] = argo_apps[a.name].get("health_status") or serialized["health"]
            serialized["sync_status"] = argo_apps[a.name].get("sync_status") or serialized["sync_status"]
            serialized["last_sync_at"] = argo_apps[a.name].get("last_sync_at")
            serialized["live_source"] = "ArgoCD"
        result.append(serialized)
    return jsonify(result)


@app.post("/api/applications")
def create_application():
    user = auth_user()
    if not user:
        return jsonify({"error": "authentication required"}), 401

    data = request.get_json() or {}
    name = data.get("name", "").strip()

    if not name:
        return jsonify({"error": "application name is required"}), 400

    if Application.query.filter_by(name=name).first():
        return jsonify({"error": "application already exists"}), 409

    app_record = Application(
        name=name,
        repository=data.get("repository"),
        environment=data.get("environment", "development"),
        version=data.get("version", "v1.0.0"),
        replicas=int(data.get("replicas", 2))
    )

    db.session.add(app_record)
    db.session.commit()

    return jsonify(serialize_application(app_record)), 201


@app.get("/api/applications/<int:application_id>")
def application_detail(application_id):
    user = auth_user()
    if not user:
        return jsonify({"error": "authentication required"}), 401

    app_record = db.session.get(Application, application_id)
    if not app_record:
        return jsonify({"error": "application not found"}), 404

    return jsonify(serialize_application(app_record))


@app.delete("/api/applications/<int:application_id>")
def delete_application(application_id):
    user = auth_user()
    if not user:
        return jsonify({"error": "authentication required"}), 401

    app_record = db.session.get(Application, application_id)
    if not app_record:
        return jsonify({"error": "application not found"}), 404

    db.session.delete(app_record)
    db.session.commit()

    return jsonify({"message": "application deleted"})


@app.get("/api/deployments")
def deployments():
    user = auth_user()
    if not user:
        return jsonify({"error": "authentication required"}), 401

    rows = (
        db.session.query(Deployment, Application)
        .join(Application, Deployment.application_id == Application.id)
        .order_by(Deployment.created_at.desc())
        .all()
    )

    rollouts = {r["name"]: r for r in get_deployment_rollout_status()}

    result = []
    for d, a in rows:
        item = {
            "id": d.id,
            "application": a.name,
            "version": d.version,
            "status": d.status,
            "commit_sha": d.commit_sha,
            "created_at": d.created_at.isoformat()
        }
        if a.name in rollouts:
            r = rollouts[a.name]
            item["desired_replicas"] = r.get("desired_replicas", a.replicas or 2)
            item["available_replicas"] = r.get("available_replicas", a.replicas or 2)
            item["percent_complete"] = r.get("percent_complete", 100)
            item["strategy"] = r.get("strategy", "RollingUpdate")
        else:
            item["desired_replicas"] = a.replicas or 2
            item["available_replicas"] = a.replicas or 2
            item["percent_complete"] = 100
            item["strategy"] = "RollingUpdate"
        result.append(item)

    return jsonify(result)


@app.post("/api/deployments")
def create_deployment():
    user = auth_user()
    if not user:
        return jsonify({"error": "authentication required"}), 401

    data = request.get_json() or {}
    application_id = data.get("application_id")

    app_record = db.session.get(Application, application_id)
    if not app_record:
        return jsonify({"error": "application not found"}), 404

    deployment = Deployment(
        application_id=app_record.id,
        version=data.get("version", app_record.version),
        status="Progressing",
        commit_sha=data.get("commit_sha")
    )

    db.session.add(deployment)
    app_record.version = deployment.version
    app_record.health = "Progressing"
    app_record.sync_status = "OutOfSync"
    db.session.commit()

    return jsonify({
        "id": deployment.id,
        "application": app_record.name,
        "version": deployment.version,
        "status": deployment.status
    }), 201


@app.get("/api/alerts")
def alerts():
    user = auth_user()
    if not user:
        return jsonify({"error": "authentication required"}), 401

    rows = Alert.query.order_by(Alert.created_at.desc()).limit(20).all()

    return jsonify([
        {
            "id": a.id,
            "severity": a.severity,
            "service": a.service,
            "message": a.message,
            "value": a.value,
            "status": a.status,
            "created_at": a.created_at.isoformat()
        }
        for a in rows
    ])


@app.get("/api/incidents")
def incidents():
    user = auth_user()
    if not user:
        return jsonify({"error": "authentication required"}), 401

    rows = Incident.query.order_by(Incident.created_at.desc()).limit(20).all()

    return jsonify([
        {
            "id": i.id,
            "title": i.title,
            "severity": i.severity,
            "service": i.service,
            "status": i.status,
            "description": i.description,
            "created_at": i.created_at.isoformat()
        }
        for i in rows
    ])


@app.get("/api/dashboard")
def dashboard():
    user = auth_user()
    if not user:
        return jsonify({"error": "authentication required"}), 401

    cluster = get_cluster_summary()
    traffic = get_traffic_summary()

    return jsonify({
        "applications": Application.query.count(),
        "healthy": Application.query.filter_by(health="Healthy").count(),
        "deployments": Deployment.query.count(),
        "open_incidents": Incident.query.filter_by(status="open").count(),
        "firing_alerts": Alert.query.filter_by(status="firing").count(),
        "cluster": cluster,       # ← now live from the Kubernetes API
        "traffic": traffic,       # ← now live from Prometheus
    })


@app.get("/api/argocd/applications")
def argocd_applications():
    """Live ArgoCD sync/health status — separate endpoint, polled by the
    'Applications Overview' panel on a short interval from the frontend."""
    user = auth_user()
    if not user:
        return jsonify({"error": "authentication required"}), 401
    return jsonify(get_argocd_applications())


@app.get("/api/deployments/rollout")
def deployments_rollout():
    """Live per-deployment rollout percentage — powers the 'Deployments' panel."""
    user = auth_user()
    if not user:
        return jsonify({"error": "authentication required"}), 401
    return jsonify(get_deployment_rollout_status())


@app.post("/api/seed")
def seed():
    # Development-only convenience endpoint.
    if os.getenv("ALLOW_SEED", "false").lower() != "true":
        return jsonify({"error": "seed disabled"}), 403

    if Application.query.count() == 0:
        apps = [
            Application(
                name="order-service",
                repository="github.com/cloudflux/order-service",
                environment="production",
                version="v1.4.2",
                health="Healthy",
                sync_status="Synced",
                replicas=3
            ),
            Application(
                name="payment-service",
                repository="github.com/cloudflux/payment-service",
                environment="production",
                version="v2.1.0",
                health="Progressing",
                sync_status="OutOfSync",
                replicas=4
            ),
            Application(
                name="user-service",
                repository="github.com/cloudflux/user-service",
                environment="production",
                version="v1.3.7",
                health="Healthy",
                sync_status="Synced",
                replicas=2
            )
        ]

        db.session.add_all(apps)

    if Alert.query.count() == 0:
        db.session.add_all([
            Alert(
                severity="critical",
                service="payment-service",
                message="High error rate",
                value="2.12%"
            ),
            Alert(
                severity="warning",
                service="order-service",
                message="High P95 latency",
                value="820ms"
            )
        ])

    if Incident.query.count() == 0:
        db.session.add(
            Incident(
                title="Payment latency spike",
                severity="warning",
                service="payment-service",
                description="P95 latency exceeded the configured threshold."
            )
        )

    db.session.commit()
    return jsonify({"message": "development data seeded"})


with app.app_context():
    db.create_all()


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
