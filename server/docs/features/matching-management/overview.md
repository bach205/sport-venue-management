# Matchmaking and Discover Design

## Goal

Add a first backend version of:

- auto matching for one-to-one match requests
- discover posts for manual player connection
- direct chat creation after auto match or manual contact

This phase supports:

- creating and managing match requests
- matching exactly two users by request criteria
- creating a match record plus a direct conversation on success
- creating and browsing discover posts
- opening or reusing a direct conversation from `Contact Now`
- realtime notifications through socket events after REST actions complete

This phase does not support:

- group matching
- group chat for matches
- automatic matching for more than two users
- custom free-text location matching
- flexible skill matching
- discover posts inside the social feed

## Scope

The feature will live in the existing `matching` module and reuse the `chat` module for conversation creation.

- `src/modules/matching/model.js`: schemas and indexes
- `src/modules/matching/service.js`: request, match, discover, and contact logic
- `src/modules/matching/controller.js`: request handling and response formatting
- `src/modules/matching/route.js`: REST endpoints
- `src/validations/matching.validation.js`: request validation
- `src/sockets/index.js`: matching and discover notification events
- `route.v1.js`: route registration

The `social` module stays unchanged. Discover is a separate posting system, not a social post variant.

## Product Decisions

The following decisions are fixed for this phase:

- auto matching only matches two users
- auto matching creates or reuses a `direct` conversation
- skill level must match exactly: `casual`, `intermediate`, or `competitive`
- location matches by radius when both requests include coordinates; otherwise it falls back to exact selected location value
- time may differ by at most two hours
- `teammate` only matches `teammate`, and `opponent` only matches `opponent`
- `Contact Now` must open or reuse the same direct conversation for the same pair of users

## Data Model

The matching domain keeps five collections:

- `match_requests`
- `matches`
- `match_participants`
- `match_ratings`
- `discover_posts`

### MatchRequest

Fields:

- `user_id`
- `sport`
- `location`
- `location_lat`
- `location_lng`
- `search_radius_km`
- `time`
- `time_type`: `fixed | flexible`
- `skill_level`: `casual | intermediate | competitive`
- `number_of_players`
- `match_type`: `teammate | opponent`
- `status`: `pending | matched | cancelled`
- timestamps

Rules:

- only `pending` requests are eligible for matching
- one user may have only one `pending` request at a time; creating a new request cancels older pending requests from that user
- `number_of_players` remains in the schema for future growth, but validation restricts it to `1` in this phase
- `time` must not be in the past
- when coordinates exist on both requests, location compatibility uses distance within the smaller selected search radius

Recommended indexes:

- `{ user_id: 1, status: 1 }`
- `{ status: 1, sport: 1, location: 1, skill_level: 1, match_type: 1, time: 1 }`

### Match

Fields:

- `sport`
- `location`
- `location_lat`
- `location_lng`
- `search_radius_km`
- `time`
- `status`
- `conversation_id`
- `request_ids`: two related match request ids
- timestamps

Rules:

- one match record represents one successful pairing
- `conversation_id` points to the direct conversation opened for the pair
- `status` starts as `matched`

### MatchParticipant

Fields:

- `match_id`
- `user_id`
- timestamps

Rules:

- every match has exactly two participants in this phase
- keep the participant table even for one-to-one matches so later expansion does not require a data-model rewrite

Recommended index:

- unique `{ match_id: 1, user_id: 1 }`

### MatchRating

Fields:

- `match_id`
- `reviewer_user_id`
- `rated_user_id`
- `rating`: integer from `1` to `5`
- timestamps

Rules:

- only match participants may rate a match
- the reviewer rates the other participant in the same match
- one reviewer may submit one rating per match; later submissions update the same rating row

Recommended indexes:

- unique `{ match_id: 1, reviewer_user_id: 1 }`
- `{ rated_user_id: 1 }`

### DiscoverPost

Fields:

- `user_id`
- `sport`
- `location`
- `location_lat`
- `location_lng`
- `search_radius_km`
- `time`
- `time_type`: `fixed | flexible`
- `skill_level`: `casual | intermediate | competitive`
- `number_of_players`
- `match_type`: `teammate | opponent`
- `content`
- `status`: `open | closed | cancelled`
- timestamps

Rules:

- discover posts are not part of auto matching
- only `open` posts appear in the public discover listing
- `Contact Now` is available only while a post is `open`

Recommended indexes:

- `{ status: 1, createdAt: -1 }`
- `{ status: 1, sport: 1, location: 1, skill_level: 1, match_type: 1, time: 1 }`

## Business Rules

### Auto Matching

Two requests are compatible only when all rules below pass:

- both requests are `pending`
- requests belong to different users
- `sport` matches exactly
- location is within the selected search radius when coordinates exist on both requests; otherwise `location` matches exactly
- `skill_level` matches exactly
- `match_type` matches exactly
- requested times differ by no more than two hours

Matching flow:

1. User creates a match request.
2. Service stores the request as `pending`.
3. Service searches for one compatible `pending` request from another user.
4. If none exists, return the saved request with no match.
5. If a compatible request exists:
   - create a `match`
   - create two `match_participants`
   - update both requests to `matched`
   - call `chatService.createOrGetDirectConversation(userA, userB)`
   - save `conversation_id` on the match
   - emit socket notifications for both users

### Discover

Discover is a manual connection system.

- users create posts with sport, location, time, skill level, number of players, and match type
- the feed lists open posts in reverse creation order
- users may filter by sport, location, skill level, match type, and optional time range
- the post owner may update, close, or delete the post
- other users may press `Contact Now` to open or reuse a direct conversation with the owner

### Chat Integration

The `matching` module owns the business decision. The `chat` module only guarantees that a direct conversation exists for two users.

- auto match uses `chatService.createOrGetDirectConversation`
- discover contact uses the same method
- if a direct conversation already exists, the backend returns it instead of creating a new one

## API Design

### Match Requests

#### POST `/api/v1/matching/requests`

Create a match request and immediately attempt auto matching.

Request body:

```json
{
  "sport": "football",
  "location": "District 1",
  "location_lat": 10.7769,
  "location_lng": 106.7009,
  "search_radius_km": 5,
  "time": "2026-05-11T19:00:00.000Z",
  "time_type": "fixed",
  "skill_level": "intermediate",
  "number_of_players": 1,
  "match_type": "opponent"
}
```

Response when no match is found:

```json
{
  "message": "Match request created successfully.",
  "data": {
    "request": {},
    "match": null,
    "conversation": null
  }
}
```

Response when a match is found:

```json
{
  "message": "Match found successfully.",
  "data": {
    "request": {},
    "match": {},
    "conversation": {},
    "partner": {}
  }
}
```

#### GET `/api/v1/matching/requests/me`

Return the current user's requests, newest first.

#### GET `/api/v1/matching/requests/me/:requestId`

Return one request if it belongs to the current user.

#### PATCH `/api/v1/matching/requests/:requestId/cancel`

Cancel the caller's pending request.

Rules:

- only the owner may cancel
- only `pending` requests may be cancelled

### Matches

#### GET `/api/v1/matching/matches/me`

Return the current user's matches.

Each item should include:

- `id`
- `sport`
- `location`
- `time`
- `status`
- `conversationId`
- `partner`
- `createdAt`

#### GET `/api/v1/matching/matches/:matchId`

Return one match if the caller is a participant.

#### POST `/api/v1/matching/matches/:matchId/rating`

Submit or update the caller's rating for the other match participant.

Request body:

```json
{
  "rating": 5
}
```

Rules:

- caller must be a participant in the match
- rating must be an integer from `1` to `5`
- caller cannot choose an arbitrary rated user; the service rates the other participant automatically

Response:

```json
{
  "message": "Match rating submitted successfully.",
  "data": {
    "id": "rating-id",
    "matchId": "match-id",
    "reviewerUserId": "current-user-id",
    "ratedUserId": "partner-user-id",
    "rating": 5,
    "ratedUserStats": {
      "averageRating": 5,
      "ratingCount": 1
    }
  }
}
```

### Discover Posts

#### POST `/api/v1/matching/discover-posts`

Create a discover post.

#### GET `/api/v1/matching/discover-posts`

Return open discover posts with pagination and optional filters.

Query filters:

- `sport`
- `location`
- `skill_level`
- `match_type`
- `time_from`
- `time_to`
- `page`
- `limit`

#### GET `/api/v1/matching/discover-posts/:postId`

Return one discover post.

#### PATCH `/api/v1/matching/discover-posts/:postId`

Update the caller's open discover post.

#### PATCH `/api/v1/matching/discover-posts/:postId/close`

Close the caller's discover post.

#### DELETE `/api/v1/matching/discover-posts/:postId`

Delete the caller's discover post.

#### POST `/api/v1/matching/discover-posts/:postId/contact`

Open or reuse a direct conversation with the post owner.

Rules:

- reject when the caller is the owner
- reject when the post is not `open`
- return the conversation summary that the frontend can open immediately

Response:

```json
{
  "message": "Conversation ready.",
  "data": {
    "post": {},
    "conversation": {},
    "peer": {}
  }
}
```

## Response Formatting

The module should follow the response style already used in `chat`, `social`, and `venue`.

- successful responses include `message`
- payloads return under `data`
- list payloads use `items`
- paginated results use `pagination`

Recommended service helpers:

- `formatMatchRequest`
- `formatMatchSummary`
- `formatDiscoverPost`
- `formatPartnerSummary`
- `buildPagination`

## Validation

Add `src/validations/matching.validation.js`.

### Match Request Validation

- `sport` is required
- `location` is required
- optional `location_lat` must be a valid latitude between `-90` and `90`
- optional `location_lng` must be a valid longitude between `-180` and `180`
- when coordinates are provided, `search_radius_km` must be between `1` and `50`
- `time` is required and must be a valid date
- `time` must not be in the past
- `time_type` must be `fixed` or `flexible`
- `skill_level` must be `casual`, `intermediate`, or `competitive`
- `number_of_players` is required and must equal `1` in this phase
- `match_type` must be `teammate` or `opponent`

### Discover Post Validation

- all match-request fields above are required
- `content` is required, trimmed, and length-limited
- `number_of_players` must be a positive integer

### Query Validation

- `page` and `limit` follow the same pattern as `chat`
- optional filter values must match allowed enums when provided

### Match Rating Validation

- `rating` is required
- `rating` must be an integer from `1` to `5`

## Realtime Design

REST remains the source of truth. Socket events notify clients after a successful server-side state change.

User room joins must include a valid JWT for the requested user ID. Match events are emitted by the server after persistence; clients must not relay authoritative match events to other users.

Recommended new events:

- `matching:request:created`
- `matching:request:matched`
- `discover:contact:started`

Payload expectations:

- `matching:request:created`: current request summary
- `matching:request:matched`: match summary, conversation summary, and partner summary
- `discover:contact:started`: discover post summary, conversation summary, and peer summary

The socket layer should not perform matching itself. It should emit events only after the service completes.

## Error Handling

Use `createHttpError` for service-level failures.

Expected errors:

- `400 Bad Request`
  - invalid payload
  - invalid ObjectId
  - time in the past
  - invalid rating
  - contacting your own post
  - cancelling a non-pending request
  - contacting a closed or cancelled post
- `403 Forbidden`
  - caller does not own the request or discover post
  - caller does not belong to the requested match
- `404 Not Found`
  - request not found
  - match not found
  - discover post not found

If auto match succeeds logically but conversation creation fails, the server should fail the whole operation rather than leave a half-finished match. The implementation should prefer a Mongoose session for the match-creation path when practical.

## Implementation Notes

- keep the feature inside `matching` rather than splitting discover into `social`
- keep the current `chat` direct-conversation contract unchanged
- add route registration in `route.v1.js`
- add matching-specific socket constants in `src/constants/index.js`
- follow the current repo style for controllers and validators
- avoid broad refactors unrelated to the feature

## Testing Strategy

The repository does not yet have a finished test setup for this module, so this phase should define the required cases clearly.

### Match Request Cases

1. Create a valid request and return `pending` when no partner exists.
2. Create a valid request and match it with an existing compatible request.
3. Cancel older pending requests from the same user when a new request is created.
4. Reject requests with past time values.
5. Reject matches when sport, location/radius, skill level, or match type differ.
6. Reject matches when time difference is greater than two hours.
7. Cancel a pending request successfully.
8. Reject cancelling a matched or already cancelled request.
9. Match users with different location text when their coordinates are inside the selected radius.

### Match Result Cases

1. List only matches that belong to the current user.
2. Return a match detail only to a participant.
3. Store and return the direct conversation created from auto matching.
4. Allow a participant to rate the matched partner.
5. Reject ratings from users who did not join the match.
6. Reject ratings outside the `1` to `5` range.

### Discover Cases

1. Create a discover post successfully.
2. List only open discover posts.
3. Filter discover posts by supported query fields.
4. Update, close, and delete a discover post as the owner.
5. Reject update, close, or delete by a non-owner.
6. Open or reuse a direct conversation on `Contact Now`.
7. Reject `Contact Now` for the post owner.
8. Reject `Contact Now` when the post is closed or cancelled.

### Realtime Cases

1. Emit `matching:request:matched` for both users on successful auto match.
2. Emit `discover:contact:started` when a conversation is opened from Discover.

## Out of Scope

The following items are intentionally excluded from this phase:

- group match requests
- group chat
- waitlists or queues
- location-radius search
- ranking or scoring-based matchmaking
- push notifications
- read receipts beyond the current chat module behavior
- moderation workflows for discover posts
- merging discover into the social feed

## Rollout Summary

This design keeps the first version small and coherent:

- one module owns matchmaking and discover logic
- chat stays reusable infrastructure
- auto matching is strict and one-to-one
- discover remains manual
- realtime notifies clients after REST actions succeed
