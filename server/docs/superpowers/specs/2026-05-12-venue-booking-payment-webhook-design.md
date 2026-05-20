# Venue Booking Payment Webhook Design

## Goal

Define the backend API contract for venue browsing, slot availability polling, 3-step booking, payment confirmation by external webhook, booking history, refund handling, and slot reopening after refund.

This design keeps the existing `venue` module structure and refines it into a clear production-facing contract.

## Scope

This design covers:

- public venue listing with per-date availability summary
- venue slot listing by date
- temporary slot holds
- payment creation for a held booking
- payment confirmation by external provider webhook
- double-booking prevention
- booking history APIs for end users
- automatic refunds within 5 minutes from successful payment
- manual refund requests after the automatic refund window expires
- slot reopening after completed refunds

This design does not cover:

- Socket.IO or push-based realtime updates
- multi-slot bookings in one booking record
- multi-timezone support
- provider-specific checkout implementation details beyond the webhook contract
- admin workflows beyond manual refund resolution already aligned with owner/admin review flows

## Fixed Product Decisions

The following decisions are fixed for this phase:

- realtime means polling REST APIs, not WebSocket push
- the booking flow remains 3-step:
  1. create hold
  2. create payment
  3. confirm payment by provider webhook
- the automatic refund window is measured from `payment.paid_at`
- one booking maps to exactly one slot
- a slot is identified by `venue_id + date + start_time + end_time`
- slot price comes from the venue's default slot price for this phase
- a slot reopens only after refund completion, not immediately when a refund is requested

## Architecture

The feature lives in the existing `venue` module and follows the established route -> controller -> service -> model pattern.

Primary files affected or referenced:

- `server/src/modules/venue/model.js`
- `server/src/modules/venue/service.js`
- `server/src/modules/venue/controller.js`
- `server/src/modules/venue/route.js`
- `server/src/validations/venue.validation.js`
- `server/tests/venue.integration.test.js`

The design continues to use derived slot availability instead of storing physical daily slot rows.

Availability for a given date is computed from:

1. the venue's recurring weekly schedule
2. availability overrides for that date
3. active bookings for the same slot

## Data Model

The existing data model is largely sufficient.

### Venue

Venue stores:

- core venue metadata
- `slot_price`
- `slot_duration_minutes`
- `weekly_schedule`

### VenueAvailabilityOverride

Override documents store unavailable exceptions for a venue on a specific date and time range.

Fields:

- `venue_id`
- `date`
- `start_time`
- `end_time`
- `status = unavailable`
- `created_by`
- `reason`

### Booking

Booking represents one slot reservation lifecycle.

Fields:

- `user_id`
- `venue_id`
- `date`
- `start_time`
- `end_time`
- `amount`
- `status`
- `hold_expires_at`
- timestamps

Booking statuses:

- `hold`
- `payment_pending`
- `confirmed`
- `refund_processing`
- `refunded`
- `refund_rejected`
- `expired`

Recommended business interpretation:

- `refund_rejected` may remain supported for compatibility, but rejected refunds should primarily be represented on the refund record while the booking returns to or remains `confirmed`

### Payment

Payment is a 1:1 record linked to a booking.

Fields:

- `booking_id`
- `provider`
- `status`
- `provider_reference`
- `paid_at`
- `refunded_at`
- timestamps

Payment statuses:

- `pending`
- `paid`
- `failed`
- `refund_pending`
- `refunded`

### Refund

Refund stores both automatic and manual refund flows.

Fields:

- `booking_id`
- `payment_id`
- `requested_by`
- `processed_by`
- `type`
- `status`
- `reason`
- `processed_at`
- timestamps

Refund types:

- `auto`
- `manual`

Refund statuses:

- `pending_auto`
- `pending_manual`
- `approved`
- `rejected`
- `completed`

## Availability Model

### Slot states returned by APIs

For client-facing slot views, return these slot statuses:

- `available`
- `held`
- `booked`
- `unavailable`
- `refund_processing`

Recommended mapping from booking state to slot state:

- `hold` -> `held`
- `payment_pending` -> `booked`
- `confirmed` -> `booked`
- `refund_processing` -> `refund_processing`
- `refunded` -> slot no longer blocked
- `expired` -> slot no longer blocked
- rejected refund outcomes -> slot remains blocked only if booking remains `confirmed`

### Venue availability summary

The venue list endpoint should optionally accept a `date` query and return a polling-friendly availability summary for each venue on that date.

Per venue summary fields:

- `date`
- `total_slots`
- `available_slots`
- `held_slots`
- `booked_slots`
- `unavailable_slots`

This summary is derived data, not separately persisted state.

## API Design

The routes below are written relative to the existing API mount.

### 1. GET `/venues?date=YYYY-MM-DD&page=1&limit=10`

Return a paginated list of venues.

If `date` is provided, each venue also includes `availability_summary` for that date.

Response shape per venue includes:

- `id`
- `name`
- `location`
- `sport_type`
- `slot_price`
- `slot_duration_minutes`
- `availability_summary` when `date` is requested

Purpose:

- let the client browse venues
- support polling-based availability without calling the slot-detail endpoint for every venue upfront

### 2. GET `/venues/:venueId/slots?date=YYYY-MM-DD`

Return generated slots for one venue and one date.

Response shape per slot includes:

- `date`
- `start_time`
- `end_time`
- `status`
- `booking_id` when relevant

Rules:

- expired holds must be cleared before availability is calculated
- unavailable overrides must mask the slot as `unavailable`
- active bookings must mask the slot as `held`, `booked`, or `refund_processing` depending on booking state

### 3. POST `/bookings/holds`

Create a temporary hold for one slot.

Request body:

```json
{
  "venue_id": "ObjectId",
  "date": "2026-05-20",
  "start_time": "18:00",
  "end_time": "19:00"
}
```

Behavior:

- require authenticated user
- validate the slot belongs to the venue's generated schedule for that date
- reject unavailable slots
- reject slots already occupied by active bookings
- create booking with status `hold`
- set `hold_expires_at = now + 5 minutes`

Response includes:

- `booking`
- `hold_expires_at`
- enough venue/price information for the next payment step if desired

### 4. POST `/bookings/:bookingId/payments`

Create a payment record for a held booking.

Request body example:

```json
{
  "provider": "vnpay",
  "return_url": "https://frontend.example.com/payment-result"
}
```

Behavior:

- require authenticated user
- only the booking owner may call this endpoint
- booking must still be in `hold`
- hold must not be expired
- booking must not already have a payment
- create a payment with status `pending`
- transition booking from `hold` to `payment_pending`
- return provider checkout/initiation data and internal payment identifiers

### 5. POST `/webhooks/payments/:provider`

This is the production confirmation path for external payment providers.

Purpose:

- the provider notifies the backend of payment success or failure
- webhook confirmation is the source of truth for booking confirmation

Required behavior:

- verify webhook signature or hash based on provider rules
- resolve the internal payment using `provider_reference` or equivalent provider transaction id
- process idempotently so repeated callbacks do not duplicate state transitions
- persist enough webhook metadata for audit/debug if the integration layer supports it

Success path:

1. verify provider authenticity
2. load payment and linked booking
3. ensure the payment is still actionable
4. set payment to `paid`
5. set `paid_at`
6. set booking to `confirmed`
7. acknowledge success

Failure path:

1. verify provider authenticity
2. load payment and linked booking
3. set payment to `failed`
4. set booking to `expired`
5. release the slot by removing it from the active booking set
6. acknowledge failure processing

Late or duplicate webhook rule:

- duplicate events must return a safe success acknowledgement if the state has already been applied
- late success for an already expired or otherwise terminal booking must not blindly reopen or reconfirm the booking; any reconciliation beyond that is out of scope for this phase

### 6. GET `/bookings/me?page=1&limit=10&status=confirmed`

Return the current user's booking history.

Supported response data:

- booking summary
- venue summary
- payment summary if present
- latest refund summary if present

Supported filters:

- pagination
- optional booking status

### 7. GET `/bookings/me/:bookingId`

Return one booking detail for the current user.

This response should include:

- booking
- venue
- payment if present
- latest refund record if present

### 8. POST `/bookings/:bookingId/refund`

Create a refund request for a confirmed and paid booking.

Rules:

- require authenticated user
- only the booking owner may call this endpoint
- booking must be `confirmed`
- payment must be `paid`
- automatic refund window is measured from `payment.paid_at`

Automatic refund path:

If the request is within 5 minutes of `payment.paid_at`:

- create refund with type `auto`
- move booking to `refund_processing`
- move payment to `refund_pending`
- complete refund immediately
- set payment to `refunded`
- set booking to `refunded`
- set refund to `completed`
- reopen the slot immediately after completion

Manual refund path:

If the request is after 5 minutes of `payment.paid_at`:

- create refund with type `manual`
- set refund status to `pending_manual`
- leave booking as `confirmed` until a reviewer resolves it
- keep the slot occupied until refund completion

Response should make the mode explicit, for example:

- `mode = auto`
- `mode = manual`

### 9. PATCH `/my-venues/refund-requests/:refundId`

Resolve a manual refund request.

This endpoint keeps the current owner/admin review pattern.

Approval path:

- require owner/admin authorization according to existing project policy
- set refund to `approved`
- move booking to `refund_processing`
- move payment to `refund_pending`
- finalize refund
- set booking to `refunded`
- set payment to `refunded`
- set refund to `completed`
- reopen the slot

Rejection path:

- set refund to `rejected`
- booking remains `confirmed`
- payment remains `paid`
- slot remains occupied

## Booking and Payment State Machines

### Booking lifecycle

Booking states used by this design:

- `hold`
- `payment_pending`
- `confirmed`
- `refund_processing`
- `refunded`
- `refund_rejected`
- `expired`

Recommended transitions:

- create hold -> `hold`
- create payment -> `hold -> payment_pending`
- webhook success -> `payment_pending -> confirmed`
- webhook failure -> `payment_pending -> expired`
- hold timeout -> `hold -> expired`
- automatic refund -> `confirmed -> refund_processing -> refunded`
- manual refund approval -> `confirmed -> refund_processing -> refunded`
- manual refund rejection -> booking stays `confirmed`

`refund_rejected` may remain available for compatibility, but the preferred business representation is a rejected refund record while the booking stays `confirmed`.

### Payment lifecycle

Payment states used by this design:

- `pending`
- `paid`
- `failed`
- `refund_pending`
- `refunded`

Recommended transitions:

- payment creation -> `pending`
- webhook success -> `pending -> paid`
- webhook failure -> `pending -> failed`
- refund start -> `paid -> refund_pending`
- refund completion -> `refund_pending -> refunded`

## Double-Booking Prevention

Double-booking must be prevented at two layers.

### 1. Application-level availability check

Before creating a hold, the service checks for an active booking on the same slot.

Active booking statuses for slot blocking:

- `hold`
- `payment_pending`
- `confirmed`
- `refund_processing`

### 2. Database-level uniqueness guarantee

MongoDB enforces a partial unique index on:

- `venue_id`
- `date`
- `start_time`
- `end_time`

for active booking states only.

This remains the final protection against race conditions.

If concurrent requests target the same slot:

- one request succeeds
- the other fails with a booking conflict response

## Hold Expiry Rules

Hold TTL is 5 minutes.

Rules:

- expired holds must not continue blocking slot availability
- the service should expire stale holds before slot reads and before hold/payment actions that depend on freshness
- if payment creation is attempted after hold expiry, the API must reject it
- if a webhook arrives for a no-longer-actionable booking, processing must be idempotent and safe

## Refund Rules

### Automatic refund window

A refund is eligible for automatic processing only when:

`now - payment.paid_at <= 5 minutes`

### Slot reopening rule

A slot reopens only when the refund is completed.

That means:

- auto refund reopens the slot immediately after completion
- manual refund reopens the slot only after approval and completion
- rejected manual refund does not reopen the slot

### Manual refund responsibility

After the 5-minute automatic window expires, the refund becomes a manual workflow.

The request is recorded and remains pending until an owner/admin reviewer resolves it.

## Error Handling

Recommended API status usage:

- `400 Bad Request`
  - invalid date or time format
  - invalid slot range
  - unsupported payment provider
  - malformed webhook payload
- `401 Unauthorized`
  - missing or invalid JWT for protected user endpoints
- `403 Forbidden`
  - user attempts to access another user's booking
  - caller lacks required owner/admin role for refund resolution
- `404 Not Found`
  - venue not found
  - booking not found
  - payment not found
  - refund request not found
- `409 Conflict`
  - slot already held or booked
  - hold no longer valid
  - booking no longer payable
  - duplicate or conflicting state transition attempt
- `500 Internal Server Error`
  - unexpected persistence or provider-processing failure

Recommendation:

Use `409 Conflict` for slot collisions and state-transition collisions rather than generic `400`, because the failure is caused by resource state rather than payload syntax.

## Response Design Principles

Booking-related responses should include enough linked state for the client to continue the flow without an immediate extra fetch.

Recommended response building blocks:

- booking summary
- payment summary if present
- refund summary if present
- venue summary when relevant

Example hold response:

```json
{
  "data": {
    "booking": {
      "id": "booking_id",
      "status": "hold",
      "date": "2026-05-20",
      "start_time": "18:00",
      "end_time": "19:00",
      "amount": 250000,
      "hold_expires_at": "2026-05-20T11:05:00.000Z"
    }
  }
}
```

## Testing Plan

The design should be validated with integration-focused tests using the project's existing testing stack.

Required scenarios:

### Availability

- list venues with date-based availability summary
- return detailed slot statuses correctly
- ensure expired holds no longer block slots
- ensure unavailable overrides affect slot output immediately

### Hold creation

- create hold for an available slot
- reject a slot outside the generated schedule
- reject unavailable override slots
- reject duplicate or concurrent hold requests for the same slot

### Payment

- create payment only for the booking owner
- reject payment creation after hold expiry
- reject second payment creation for the same booking
- webhook success confirms the booking
- webhook failure expires the booking
- repeated webhook callbacks are idempotent

### Refund

- automatic refund succeeds within 5 minutes from `payment.paid_at`
- manual refund request is created after the 5-minute window
- approved manual refund reopens the slot
- rejected manual refund keeps the slot occupied
- refunded slots become available again in slot listing

### History

- booking history supports pagination and status filtering
- booking detail returns venue, payment, and refund information

## Open Compatibility Notes

This design intentionally stays close to the current venue implementation.

Expected implementation delta from the current backend:

- extend `GET /venues` to accept `date` and return `availability_summary`
- add a real provider webhook endpoint for payment confirmation
- keep or phase out the internal confirmation endpoint depending on rollout strategy
- align booking conflict responses toward `409 Conflict` if the team wants stricter HTTP semantics

## Implementation Guidance

The design should be implemented by extending existing venue flows rather than introducing a new booking subsystem.

Keep these boundaries clear:

- route/controller validate input and map HTTP contracts
- service owns booking/payment/refund rules and state transitions
- models enforce uniqueness and lifecycle persistence
- tests cover concurrency, webhook idempotency, and refund reopening behavior
