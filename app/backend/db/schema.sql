CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS applications (
    id SERIAL PRIMARY KEY,
    name VARCHAR(120) UNIQUE NOT NULL,
    repository VARCHAR(500),
    environment VARCHAR(50) DEFAULT 'development',
    version VARCHAR(100) DEFAULT 'v1.0.0',
    health VARCHAR(50) DEFAULT 'Healthy',
    sync_status VARCHAR(50) DEFAULT 'Synced',
    replicas INTEGER DEFAULT 2,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS deployments (
    id SERIAL PRIMARY KEY,
    application_id INTEGER NOT NULL REFERENCES applications(id),
    version VARCHAR(100) NOT NULL,
    status VARCHAR(50) DEFAULT 'Progressing',
    commit_sha VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS incidents (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    severity VARCHAR(50) DEFAULT 'warning',
    service VARCHAR(120),
    status VARCHAR(50) DEFAULT 'open',
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS alerts (
    id SERIAL PRIMARY KEY,
    severity VARCHAR(50) NOT NULL,
    service VARCHAR(120) NOT NULL,
    message VARCHAR(500) NOT NULL,
    value VARCHAR(100),
    status VARCHAR(50) DEFAULT 'firing',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
