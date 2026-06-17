# TODO - Ecommerce User App + Admin Web Completion

## Phase 1: Admin Order Timeline wiring (safe, minimal)
- [ ] Inspect backend admin orders module routing for timeline endpoints (order timeline controller/repo may not exist)
- [ ] Implement backend admin order timeline endpoints:
  - GET /admin/orders/:orderId/timeline
  - POST /admin/orders/:orderId/timeline/event
  - PATCH /admin/orders/:orderId/timeline/:eventId (optional)
  - GET /admin/orders/:orderId/timeline/lifecycle (optional)
- [ ] Ensure admin endpoints update order.statusHistory consistently and emit socket events to user
- [x] Update Admin Web `OrderTimelineSection.tsx` to call `ecommerce-admin-web/src/services/orderTimeline.ts` instead of mock

- [ ] Add/verify types/response mapping to match admin-web expectations

## Phase 2+: Other modules
- [ ] RBAC DB permissions and admin management endpoints
- [ ] Products/categories/subcategories/inventory + attributes
- [ ] Image upload Multer+Cloudinary
- [ ] Shipments backend + user track screen syncing
- [ ] Refund system + user UI
- [ ] Ticket attachments + real-time updates + SLA
- [ ] Product-specific chat (socket rooms)
- [ ] Notifications (FCM lifecycle)
- [ ] Persistent login AsyncStorage

