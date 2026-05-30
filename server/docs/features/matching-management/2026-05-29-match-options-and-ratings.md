# Match Options and Post-Match Ratings Update

## Summary

This update improves the matching and discover flows by replacing free-form matching inputs with shared option sets, expanding the supported sports, clarifying skill level choices, adding OpenStreetMap-based match location picking with radius search, renaming community-facing labels, and adding post-match user ratings.

## Frontend Changes

### Shared Match Options

Added `frontend/src/shared/constants/matchOptions.ts` as the shared source for:

- sport options
- sport labels and icons
- location options
- skill level descriptions

Supported sports now include:

- Tennis
- Basketball
- Badminton
- Football
- Pickleball
- Volleyball
- Table Tennis
- Running
- Swimming
- Cycling
- Gym
- Yoga
- Golf
- Boxing
- Martial Arts
- Other

The frontend `Sport` and `SkillLevel` types now derive from this shared option file so matching, discover, and profile screens stay aligned.

### Location Selection

Matching, discover post creation, and profile editing now use a selectable location list instead of a free-text input. The backend still stores `location` as a string, but the UI now sends controlled values such as `District 1, Ho Chi Minh City`.

### OpenStreetMap Match Picker

The match request modal uses `react-leaflet` and OpenStreetMap tiles without requiring a map API key. It renders a draggable Leaflet marker and reverse-geocodes selected coordinates through OpenStreetMap's Nominatim service. Reverse-geocoding calls are debounced and cached in the browser to avoid unnecessary requests to the public endpoint.

Users can:

- click the map to choose a match location
- drag the marker to refine the location
- search for an address and choose from up to five Nominatim results
- use the locate control to return the marker to the browser's current GPS location
- see the selected address through reverse geocoding
- set a search radius with a slider that displays the current distance

The radius circle updates immediately as the slider moves. Submitting the form sends the same value as `search_radius_km`, so the visual radius and backend matching radius stay aligned.

The frontend sends:

- `location`
- `location_lat`
- `location_lng`
- `search_radius_km`

The OpenStreetMap tile attribution remains visible on the map as required by the tile provider.

### Matching Navigation

The `Find Match` action is displayed in the main navigation immediately after `Messages` instead of as a floating bottom-right button. At narrower desktop widths, the navigation action collapses to its icon while retaining an accessible tooltip.

### Skill Level Guidance

Skill level choices now include descriptions to help users choose the right matching level:

- `Casual`: new or relaxed player, prioritizes fun and light pace
- `Intermediate`: plays regularly, knows the rules, and keeps a stable rhythm
- `Competitive`: trains seriously and wants high-tempo matches

These descriptions appear in the match request modal, discover post modal, and profile edit form.

### Community Label Rename

User-facing community labels were renamed to more direct product language:

- navigation `Community` became `Messages`
- discover copy now says users connect with teammates
- feed modal copy now says posts go to the feed
- profile rating copy now says `Player Rating`
- the mock achievement `Community Hero` became `Team Chat Hero`

### Match Rating UI

The match success screen now includes a 1-to-5 star rating control. After a match is found, the user can rate the matched partner and submit the rating directly from the modal.

## Backend Changes

### Match Rating Model

Added a new `match_ratings` collection with:

- `match_id`
- `reviewer_user_id`
- `rated_user_id`
- `rating`
- timestamps

Indexes:

- unique `{ match_id: 1, reviewer_user_id: 1 }`
- `{ rated_user_id: 1 }`

This allows one rating per reviewer per match while still allowing users to update their previous rating.

### Rating API

Added:

```http
POST /api/v1/matching/matches/:matchId/rating
```

Request body:

```json
{
  "rating": 5
}
```

Rules:

- the caller must be a participant in the match
- the rating must be an integer from `1` to `5`
- the rated user is inferred as the other participant in the match
- repeated submissions update the existing rating row for that match and reviewer

Response includes the saved rating and aggregate stats for the rated user:

```json
{
  "ratedUserStats": {
    "averageRating": 5,
    "ratingCount": 1
  }
}
```

### User Summary Ratings

Matching user summaries now include:

- `rating`
- `matchCount`

These values are computed from `match_ratings`. If a user has no match ratings, the service falls back to the profile `reputation_score`.

### Radius-Based Matching

Match requests now support coordinate-aware matching. When both requests include latitude and longitude, the service computes the distance with the Haversine formula and considers the pair compatible when the distance is within the smaller of the two users' requested radii.

If either request has no coordinates, matching falls back to exact location string comparison.

### Authoritative Realtime Matching

REST remains the source of truth for creating and cancelling match requests. After the service stores a successful match, the server emits `matching:request:matched` to both authenticated user rooms. Clients rejoin their room after socket reconnects and no longer relay match events to other users.

Cancelling the searching screen calls `PATCH /api/v1/matching/requests/:requestId/cancel` so the pending backend request is removed from future matching.

Matched location summaries are viewer-specific. Each user receives the other player's selected address, coordinates, and radius in HTTP responses, realtime socket events, and match detail queries. This lets nearby players see where their matched peer requested to play instead of receiving one shared address.

## Tests

Updated `server/tests/matching.integration.test.js` to cover:

- successful rating submission by a match participant
- creation of the `MatchRating` document
- returned aggregate rating stats
- coordinate-based matching within the selected search radius
- rejection when two players are outside the smaller selected radius
- server-side realtime match events for both matched user rooms
- viewer-specific peer locations in HTTP responses, socket events, and match detail queries
- existing behavior where creating a new match request cancels older pending requests from the same user

## Verification

Commands run:

```bash
npm run build
npm test -- --runInBand matching.integration.test.js
```

Frontend build passed. Backend matching integration tests passed after running with local port binding allowed for `mongodb-memory-server`.
