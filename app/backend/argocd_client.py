"""
Reads live app sync/health status from the ArgoCD API.

Needs a bearer token from an ArgoCD project role (created once, manually):
    argocd proj role create-token default backend-reader
The resulting token is stored in AWS Secrets Manager (same secret as
DATABASE_URL/JWT_SECRET) as ARGOCD_AUTH_TOKEN, and synced into the cluster
by the External Secrets Operator — see terraform/rds.tf and
helm/cloudflux/templates/external-secret.yaml.
"""
import os
import logging

import requests

logger = logging.getLogger(__name__)

ARGOCD_SERVER = os.getenv(
    "ARGOCD_SERVER",
    "https://argocd-server.argocd.svc.cluster.local",
)
ARGOCD_AUTH_TOKEN = os.getenv("ARGOCD_AUTH_TOKEN", "")


def get_applications():
    """List of ArgoCD Applications with their sync + health status."""
    if not ARGOCD_AUTH_TOKEN:
        logger.warning("ARGOCD_AUTH_TOKEN not set — returning empty application list")
        return []

    try:
        resp = requests.get(
            f"{ARGOCD_SERVER}/api/v1/applications",
            headers={"Authorization": f"Bearer {ARGOCD_AUTH_TOKEN}"},
            timeout=5,
            # ArgoCD's in-cluster service usually presents a self-signed cert;
            # for a real production setup, mount the cluster CA and verify
            # properly instead of disabling verification.
            verify=os.getenv("ARGOCD_TLS_VERIFY", "false").lower() == "true",
        )
        resp.raise_for_status()
        items = resp.json().get("items", [])

        return [
            {
                "name": item["metadata"]["name"],
                "sync_status": item.get("status", {}).get("sync", {}).get("status", "Unknown"),
                "health_status": item.get("status", {}).get("health", {}).get("status", "Unknown"),
                "last_sync_at": item.get("status", {}).get("operationState", {}).get("finishedAt"),
            }
            for item in items
        ]
    except requests.RequestException as e:
        logger.error("ArgoCD API error: %s", e)
        return []
