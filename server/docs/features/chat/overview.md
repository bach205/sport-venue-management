# 1-1 Chat Design

## Goal

Add a first version of one-to-one chat to the backend.

This version supports:

- direct conversations between two users
- sending and receiving messages
- message statuses: `sent`, `received`, `seen`
- automatic conversation creation on first contact
- text messages plus an `attachments` field reserved for future use

This version does not support:

- group chat
- message edit
- message delete
- realtime socket delivery
- file upload handling

## Scope

The feature will live in the existing `chat` module and follow the current backend style:

- Express routes in `src/modules/chat/route.js`
- request handling in `controller.js`
- business logic in `service.js`
- Mongoose schemas in `model.js`
- payload validation in `src/validations`
- integration tests in `tests`

The implementation will replace the current room-style chat behavior with a direct-message model that matches the database documentation.

## Data Model

The feature will keep the existing collection split:

- `conversations`
- `conversation_participants`
- `messages`

### Conversation

Fields:

- `type`: only `direct` is valid for this phase
- `last_message_id`: optional reference to the latest message for fast conversation listing
- timestamps

Rules:

- one direct conversation exists for one pair of users
- group conversations stay out of scope for this phase

### ConversationParticipant

Fields:

- `conversation_id`
- `user_id`
- `joined_at`
- timestamps

Rules:

- every direct conversation has exactly two participants
- add a unique index on `conversation_id + user_id`

### Message

Fields:

- `conversation_id`
- `sender_id`
- `content`
- `attachments`: array, default `[]`
- `status`: `sent | received | seen`
- `received_at`
- `seen_at`
- timestamps

Rules:

- new messages start with `status = sent`
- `attachments` exists in the response contract, but upload logic is out of scope
- empty messages are invalid unless a later phase adds attachment-only support

## Business Rules

- a user can chat with any other existing user
- a user cannot create a conversation with themselves
- when a user starts a direct chat with another user, the backend returns the existing conversation or creates one if none exists
- only conversation participants can read messages, send messages, or mark messages as seen
- when the receiver fetches messages, all matching incoming messages in `sent` state become `received`
- when the receiver calls the seen endpoint, all matching incoming messages not yet seen become `seen`

## API Design

### POST `/api/v1/chat/conversations/direct`

Create or fetch a direct conversation.

Request body:

```json
{
  "target_user_id": "..."
}
```

Behavior:

- reject self-chat
- reject unknown target user
- return existing direct conversation if the pair already has one
- otherwise create a conversation and two participant records

Response:

```json
{
  "message": "Conversation ready.",
  "data": {
    "id": "...",
    "type": "direct",
    "peerUser": {
      "id": "...",
      "email": "...",
      "name": "..."
    },
    "lastMessage": null,
    "unseenCount": 0,
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

### GET `/api/v1/chat/conversations`

Return the current user's direct conversations.

Response shape:

- `items`: array of conversation summaries
- `peerUser`
- `lastMessage`
- `unseenCount`
- `createdAt`
- `updatedAt`

Sort order:

- latest activity first

### GET `/api/v1/chat/conversations/:conversationId/messages?page=1&limit=20`

Return paginated messages for a conversation.

Behavior:

- reject non-participants
- when the caller is the receiver, convert incoming messages from `sent` to `received`

Response:

```json
{
  "message": "Messages fetched successfully.",
  "data": {
    "items": [
      {
        "id": "...",
        "conversationId": "...",
        "senderId": "...",
        "content": "hello",
        "attachments": [],
        "status": "received",
        "receivedAt": "...",
        "seenAt": null,
        "createdAt": "...",
        "updatedAt": "...",
        "isOwner": false
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 1,
      "pages": 1
    }
  }
}
```

### POST `/api/v1/chat/conversations/:conversationId/messages`

Send a message in a direct conversation.

Request body:

```json
{
  "content": "hello",
  "attachments": []
}
```

Behavior:

- reject non-participants
- reject empty content for this phase
- create message with `status = sent`
- update `conversation.last_message_id`

### POST `/api/v1/chat/conversations/:conversationId/seen`

Mark incoming messages as seen.

Behavior:

- only affects messages sent by the other participant
- convert all matching `sent` or `received` messages to `seen`
- set `seen_at`
- if a message skipped `received`, set `received_at` at the same time for consistency

Response:

```json
{
  "message": "Messages marked as seen.",
  "data": {
    "updatedCount": 3
  }
}
```

## Response Formatting

The chat module should follow the same response style used in `social` and `venue`:

- successful responses include `message`
- object payloads return under `data`
- list payloads use `items`
- paginated list payloads use `pagination`

Recommended formatting helpers:

- `formatConversation`
- `formatMessage`
- `buildPagination`

These helpers should live inside the chat service unless a shared helper becomes necessary later.

## Validation

Add chat-specific validators in `src/validations/chat.validation.js`.

Validation rules:

- `target_user_id` must be present and be a valid ObjectId
- `conversationId` must be a valid ObjectId
- `content` is required and trimmed for this phase
- `content` length should use the same practical limit pattern as social content
- `attachments` is optional and defaults to `[]`
- pagination uses the same page and limit rules as other modules

## Error Handling

Use `createHttpError` for service-level failures and keep controller responses consistent with current modules.

Expected errors:

- `400 Bad Request`
  - invalid payload
  - invalid ObjectId
  - empty message
  - self-chat attempt
- `403 Forbidden`
  - caller is not a participant in the conversation
- `404 Not Found`
  - target user does not exist
  - conversation does not exist

The codebase currently favors `400` over `409` for business-rule conflicts, so the chat module should keep that convention for now.

## Implementation Notes

- refactor `src/modules/chat/service.js` because it still references `ChatRoom` and `ChatMessage`, which no longer match the chat model file
- update `src/modules/chat/controller.js` to use validation helpers before entering the service layer
- replace room-based routes with conversation-based routes
- keep socket files unchanged in this phase unless the old event names directly break the server
- add useful indexes for direct-chat lookups and unread status queries

## Testing Strategy

Add integration coverage in a new test file for chat behavior.

Required scenarios:

1. create a direct conversation automatically on first request
2. return the same conversation when the same pair starts chat again
3. reject self-chat
4. reject unknown target user
5. send a message successfully
6. list conversations with `lastMessage` and `unseenCount`
7. fetching messages as the receiver changes message status from `sent` to `received`
8. marking messages as seen changes `sent` and `received` to `seen`
9. reject message access for a user outside the conversation
10. paginate messages correctly

Use the same integration style already present in `tests/venue.integration.test.js`:

- `mongodb-memory-server`
- `supertest`
- real Express app instance
- seeded users and auth tokens

## Out of Scope

The following items are intentionally excluded from this phase:

- online presence
- typing indicators
- push notifications
- delivery through Socket.IO
- soft delete or hard delete for conversations
- block lists
- archive, mute, pin
- attachment upload and storage
- conversation search

## Rollout Summary

This design keeps the module small and consistent with the current backend:

- direct chat only
- REST only
- status progression from `sent` to `received` to `seen`
- conversation auto-create on first contact
- integration-test coverage for the full flow
