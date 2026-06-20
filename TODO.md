# TODO

## Ticket submission + admin web display fix
- [x] Verified backend route mounting for support ticket endpoints.
- [x] Found that backend expects `/api/v1/...` but clients may call without the prefix.
- [x] Added backwards-compat mounts so `/support/*` and `/admin/*` work even without `/api/v1`.
- [x] Hardened ticket controller for missing `email` from client (uses user email if present).
- [x] Next: Verify admin web ticket list refresh logic (socket listener or REST polling) so newly created tickets appear immediately.
- [x] Run backend + admin web locally and test POST ticket and admin dashboard update.


