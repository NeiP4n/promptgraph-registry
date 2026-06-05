---
name: api-design
description: Design REST or GraphQL APIs — endpoints, schemas, versioning, error handling, auth patterns. Use before implementing any new API surface.
---

# API Design

## REST API checklist

### Resource naming
- Nouns, not verbs: `/users` not `/getUsers`
- Plural for collections: `/users`, `/orders`
- Nested for owned resources: `/users/{id}/orders`
- Max 2 levels of nesting

### HTTP methods
| Action | Method | Idempotent? |
|---|---|---|
| Get collection | GET /resources | Yes |
| Get one | GET /resources/{id} | Yes |
| Create | POST /resources | No |
| Full replace | PUT /resources/{id} | Yes |
| Partial update | PATCH /resources/{id} | No |
| Delete | DELETE /resources/{id} | Yes |

### Status codes (use correctly)
- 200 OK, 201 Created, 204 No Content
- 400 Bad Request (client error), 401 Unauthorized, 403 Forbidden, 404 Not Found, 409 Conflict, 422 Validation Error
- 500 Internal Server Error (never expose stack traces)

### Request/Response design
```json
// Error response — always structured
{
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "Email is invalid",
    "field": "email",
    "request_id": "uuid"
  }
}

// List response — always paginated
{
  "data": [...],
  "pagination": {
    "page": 1,
    "per_page": 20,
    "total": 142,
    "next_cursor": "..."
  }
}
```

### Versioning
- URL versioning: `/v1/users` (simplest, most visible)
- Header: `API-Version: 2026-06-01` (cleaner URLs)
- Never break existing versions — deprecate with notice period

### Auth
- Use Bearer tokens (JWT or opaque)
- Refresh token rotation
- Scopes on tokens, not on users

### Documentation
Every endpoint needs:
- Description + use case
- Request schema with examples
- All possible response codes
- Rate limit info

## GraphQL additions
- Every query/mutation needs a description
- Use Input types for mutations
- Implement cursor-based pagination
- DataLoader for N+1 prevention
- Depth limiting + query cost analysis
