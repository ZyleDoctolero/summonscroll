# SummonScroll API Documentation

This directory contains the OpenAPI 3.0 specification for the SummonScroll API.

## Accessing the Documentation

### Development Mode

When running the server in development mode (`NODE_ENV !== 'production'`), the interactive Swagger UI documentation is available at:

```
http://localhost:3001/api-docs
```

### Features

- **Interactive API Explorer**: Test endpoints directly from the browser
- **Authentication Support**: Persist JWT tokens for authenticated requests
- **Request/Response Examples**: See example payloads for all endpoints
- **Schema Validation**: View request and response schemas
- **Rate Limiting Information**: See rate limits for each endpoint

### Raw OpenAPI Specification

The raw OpenAPI JSON specification is available at:

```
http://localhost:3001/api-docs/openapi.json
```

## OpenAPI Specification

The API documentation follows the OpenAPI 3.0.3 specification and includes:

### Documented Endpoints

#### Authentication (`/api/auth`)
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/refresh` - Refresh access token
- `GET /api/auth/me` - Get current user profile
- `POST /api/auth/logout` - Logout user
- `POST /api/auth/login-reward` - Claim daily login reward
- `GET /api/auth/login-reward/status` - Get login reward status

#### Banners (`/api/banners`)
- `GET /api/banners` - List active banners (cached 60s)
- `GET /api/banners/{id}` - Get banner details
- `POST /api/banners/{id}/pull` - Pull from banner (rate limited: 10/min)

#### Monsters (`/api/monsters`)
- `GET /api/monsters` - List all monsters (cached 5min)
- `GET /api/monsters/{id}` - Get monster details
- `GET /api/user/monsters` - Get user's collection
- `GET /api/user/monsters/{id}` - Get specific user monster
- `PATCH /api/user/monsters/{id}/team` - Assign to team
- `PATCH /api/user/monsters/{id}/skin` - Equip skin
- `GET /api/realms` - List all realms
- `GET /api/user/collection-stats` - Collection statistics

#### Icons (`/api/icons`)
- `GET /api/icons` - List all icons (cached 5min)
- `GET /api/icons/{id}` - Get icon details
- `POST /api/icons/upload` - Upload icon (admin only)
- `PATCH /api/icons/{id}` - Update icon (admin only)
- `DELETE /api/icons/{id}` - Delete icon (admin only)

#### Health & Monitoring
- `GET /health` - Health check with database connectivity
- `GET /metrics` - Application performance metrics

### Security

All protected endpoints require JWT authentication via the `Authorization` header:

```
Authorization: Bearer <access_token>
```

Access tokens expire after 15 minutes. Use the `/api/auth/refresh` endpoint with a refresh token to obtain new tokens.

### Rate Limiting

- **Global Rate Limit**: 100 requests per 15 minutes per IP
- **Pull Rate Limit**: 10 pulls per minute per user

Rate limit headers are included in responses:
- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Remaining requests in window
- `X-RateLimit-Reset`: Unix timestamp when limit resets

### Caching

Certain endpoints implement HTTP caching:

- **Banners** (`GET /api/banners`): 60 seconds
- **Monsters** (`GET /api/monsters`): 5 minutes
- **Icons** (`GET /api/icons`): 5 minutes
- **Realms** (`GET /api/realms`): 5 minutes

Cache headers:
```
Cache-Control: public, max-age=<seconds>, stale-while-revalidate=<seconds>
```

### Error Responses

All error responses follow a consistent format:

```json
{
  "message": "Error description",
  "errors": {
    "field": ["Validation error message"]
  }
}
```

Common HTTP status codes:
- `200 OK` - Success
- `201 Created` - Resource created
- `204 No Content` - Success with no response body
- `400 Bad Request` - Invalid input
- `401 Unauthorized` - Authentication required or invalid
- `402 Payment Required` - Insufficient currency
- `404 Not Found` - Resource not found
- `409 Conflict` - Resource conflict (e.g., duplicate)
- `429 Too Many Requests` - Rate limit exceeded
- `500 Internal Server Error` - Server error
- `503 Service Unavailable` - Service degraded (e.g., database down)

## Updating the Documentation

When adding new endpoints or modifying existing ones:

1. Update `openapi.json` with the new endpoint definition
2. Add request/response schemas to `components.schemas`
3. Include authentication requirements using `security: [{"bearerAuth": []}]`
4. Add rate limiting information if applicable
5. Include request/response examples
6. Document all error responses

### Example Endpoint Definition

```json
"/api/example/{id}": {
  "get": {
    "tags": ["Example"],
    "summary": "Get example by ID",
    "description": "Returns detailed information about an example",
    "security": [{"bearerAuth": []}],
    "parameters": [
      {
        "name": "id",
        "in": "path",
        "required": true,
        "schema": {"type": "string", "format": "uuid"}
      }
    ],
    "responses": {
      "200": {
        "description": "Example retrieved successfully",
        "content": {
          "application/json": {
            "schema": {
              "$ref": "#/components/schemas/Example"
            }
          }
        }
      },
      "401": {
        "$ref": "#/components/responses/Unauthorized"
      },
      "404": {
        "description": "Example not found"
      }
    }
  }
}
```

## Production Deployment

**Important**: API documentation is **disabled in production** for security and performance reasons.

The `/api-docs` endpoint is only available when `NODE_ENV !== 'production'`.

For production API documentation, consider:
- Hosting static documentation separately
- Using a documentation portal (e.g., ReadMe, Stoplight)
- Providing the OpenAPI spec file for client generation

## Tools & Integration

### Client Generation

Use the OpenAPI specification to generate type-safe API clients:

```bash
# TypeScript/JavaScript
npx openapi-typescript http://localhost:3001/api-docs/openapi.json --output ./types/api.ts

# Other languages
openapi-generator-cli generate -i http://localhost:3001/api-docs/openapi.json -g <language>
```

### Testing

Import the OpenAPI spec into API testing tools:
- Postman: Import → OpenAPI 3.0
- Insomnia: Import → OpenAPI
- Hoppscotch: Import → OpenAPI

### Validation

Validate the OpenAPI specification:

```bash
npx @apidevtools/swagger-cli validate src/docs/openapi.json
```

## Resources

- [OpenAPI 3.0 Specification](https://swagger.io/specification/)
- [Swagger UI Documentation](https://swagger.io/tools/swagger-ui/)
- [OpenAPI Generator](https://openapi-generator.tech/)
