# Sync

## Model

1. Client mutates local store and enqueues a `sync_op` with `client_op_id`.
2. Push batch to server with `base_version` for optimistic concurrency.
3. Server applies or returns conflicts; client reconciles without discarding pending ops.
4. Cursor (`sync_cursors`) advances per device; Realtime subscriptions refresh live rows.
5. Soft deletes use `deleted_at` / tombstone ops.

## Conflicts

- Version mismatch → conflict payload returned; UI prompts keep-server / merge.
- Timer: server session wins exclusivity; provisional offline timer surfaces conflict UI.
