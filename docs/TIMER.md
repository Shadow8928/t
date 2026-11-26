# Timer

Timestamp-based remaining time: `remaining = ends_at - now` while running; paused stores `remaining_ms_when_paused`.

Global exclusivity: one `running`/`paused` session per user (DB-enforced).

Clients may start a provisional offline timer; on sync, `reconcileTimerStates` detects conflicts.
