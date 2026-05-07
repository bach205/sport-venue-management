## Coding Convention Rule

Use this file as the default coding pattern for generated code in this repository.

## 1. Naming

### 1.1 Variables

- Use `camelCase`.
- Boolean names: `is`, `has`, `can`, `should`.
- Avoid one-letter or vague names such as `t`, `data`, `item`, `value`, `temp`.

Example:

```js
let totalScore;
let isActive;
let hasPermission;
```

### 1.2 Functions

- Use `camelCase`.
- Start with a verb.
- Avoid vague names such as `processData` or `handleStuff`.

Example:

```js
async function getUserById(userId) {}
```

### 1.3 Classes and Layer Names

- `XxxController`
- `XxxService`
- `XxxRepository`
- `XxxModel`
- `XxxRoute`

### 1.4 Files

- Backend files follow `PascalCase` with layer suffix.
- File name should match the main responsibility.

Example:

```js
UserController.js
```

## 2. Function Design

- One function, one responsibility.
- Prefer functions under 50 lines.
- If a function reaches 100 to 150 lines, split it.
- Prefer at most 3 nesting levels.
- Use early return to avoid deep nesting.
- Prefer pure functions for calculation or transformation logic.

Example:

```js
function calculateScore(firstScore, secondScore) {
  return firstScore + secondScore;
}
```

## 3. Error Handling

- Do not swallow errors.
- Re-throw or map errors explicitly.
- Use custom errors when the caller needs structured handling.

Example:

```js
try {
  await save();
} catch (error) {
  throw error;
}
```

## 4. API Shape

- Prefer consistent response wrappers when the module already uses them.
- Paginated responses should include `meta.page`, `meta.limit`, and `meta.total`.

Example:

```json
{
  "success": true,
  "data": {},
  "message": ""
}
```

## 5. Database Pattern

- Database naming: `snake_case`.
- Code naming: `camelCase`.
- Standard database fields when needed: `id`, `created_at`, `updated_at`, `deleted_at`.
- Standard code fields when needed: `id`, `createdAt`, `updatedAt`, `deletedAt`.

## 6. Anti-Patterns

- God function
- Duplicate logic
- Hardcoded business rules
- Magic numbers without naming or context
- Broad names that hide intent