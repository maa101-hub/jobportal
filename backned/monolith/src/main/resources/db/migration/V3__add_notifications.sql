CREATE TABLE IF NOT EXISTS notifications (
    id BIGSERIAL PRIMARY KEY,
    recipient_id BIGINT NOT NULL,
    recipient_role VARCHAR(32) NOT NULL,
    type VARCHAR(80) NOT NULL,
    title VARCHAR(160) NOT NULL,
    message VARCHAR(500) NOT NULL,
    link VARCHAR(255),
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL,
    read_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notifications_recipient
    ON notifications (recipient_id, recipient_role, created_at DESC);
