# Offline

Desktop uses Dexie tables mirroring domain entities plus `pending_ops`.

Rules:

- Writes always succeed locally when offline.
- Pending ops persist until acknowledged.
- Never silent discard.
- On reconnect: push → pull → reconcile timers.
