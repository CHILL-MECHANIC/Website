# API Documentation

Complete API reference for the SMS integration backend.

## Base URL

```
http://localhost:3001/api/sms
```

Production: Replace with your production URL.

## Authentication

Currently, the API does not require authentication. In production, you should add:
- API key authentication
- JWT tokens
- Rate limiting per user

## Endpoints

### 1. Send Single SMS

**Endpoint:** `POST /api/sms/send`

**Description:** Sends a single SMS to one recipient.

**Request Body:**
```json
{
  "recipient": "+911234567890",
  "message": "Your OTP is 123456",
  "type": "OTP",
  "senderId": "SMS",
  "unicode": false,
  "flash": false,
  "templateId": "template_123",
  "variables": {
    "otp": "123456",
    "name": "John"
  }
}
```

**Parameters:**
- `recipient` (required): Phone number in E.164 format
- `message` (required): SMS message text (1-1600 characters)
- `type` (optional): SMS type - `TRANS`, `PROMO`, or `OTP` (default: `TRANS`)
- `senderId` (optional): Sender ID (default: from env or "SMS")
- `unicode` (optional): Enable Unicode encoding (default: auto-detected)
- `flash` (optional): Send as flash SMS (default: `false`)
- `templateId` (optional): Template ID for template SMS
- `variables` (optional): Variables for template SMS

**Response (Success):**
```json
{
  "success": true,
  "message": "SMS sent successfully",
  "data": {
    "logId": 1,
    "messageId": "msg_123456789",
    "status": "sent"
  }
}
```

**Response (Error):**
```json
{
  "success": false,
  "error": "Invalid phone number format",
  "code": "VALIDATION_ERROR"
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:3001/api/sms/send \
  -H "Content-Type: application/json" \
  -d '{
    "recipient": "+911234567890",
    "message": "Your OTP is 123456",
    "type": "OTP"
  }'
```

---

### 2. Send Bulk SMS

**Endpoint:** `POST /api/sms/send-bulk`

**Description:** Sends SMS to multiple recipients.

**Request Body:**
```json
{
  "recipients": [
    "+911234567890",
    "+919876543210",
    "+911111111111"
  ],
  "message": "Bulk promotional message",
  "type": "PROMO",
  "senderId": "PROMO",
  "unicode": false,
  "flash": false
}
```

**Parameters:**
- `recipients` (required): Array of phone numbers (max 100)
- `message` (required): SMS message text (1-1600 characters)
- `type` (optional): SMS type (default: `TRANS`)
- `senderId` (optional): Sender ID
- `unicode` (optional): Enable Unicode
- `flash` (optional): Flash SMS

**Response (Success):**
```json
{
  "success": true,
  "message": "Bulk SMS completed: 3 sent, 0 failed",
  "data": {
    "total": 3,
    "success": 3,
    "failed": 0,
    "results": [
      {
        "recipient": "+911234567890",
        "logId": 1,
        "success": true,
        "messageId": "msg_123"
      },
      {
        "recipient": "+919876543210",
        "logId": 2,
        "success": true,
        "messageId": "msg_124"
      },
      {
        "recipient": "+911111111111",
        "logId": 3,
        "success": false,
        "error": "Invalid phone number"
      }
    ]
  }
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:3001/api/sms/send-bulk \
  -H "Content-Type: application/json" \
  -d '{
    "recipients": ["+911234567890", "+919876543210"],
    "message": "Bulk message",
    "type": "PROMO"
  }'
```

---

### 3. Get SMS Logs

**Endpoint:** `GET /api/sms/logs`

**Description:** Retrieves SMS logs with optional filtering and pagination.

**Query Parameters:**
- `recipient` (optional): Filter by phone number
- `status` (optional): Filter by status - `pending`, `sent`, `failed`, `delivered`
- `type` (optional): Filter by type - `TRANS`, `PROMO`, `OTP`
- `limit` (optional): Results per page (default: 50, max: 100)
- `offset` (optional): Pagination offset (default: 0)
- `startDate` (optional): ISO 8601 date string
- `endDate` (optional): ISO 8601 date string

**Response:**
```json
{
  "success": true,
  "data": {
    "logs": [
      {
        "id": 1,
        "recipient": "+911234567890",
        "message": "Your OTP is 123456",
        "status": "sent",
        "messageId": "msg_123",
        "type": "OTP",
        "retryCount": 0,
        "maxRetries": 3,
        "createdAt": "2025-01-15T10:00:00Z",
        "updatedAt": "2025-01-15T10:00:01Z"
      }
    ],
    "pagination": {
      "total": 100,
      "limit": 50,
      "offset": 0,
      "hasMore": true
    }
  }
}
```

**cURL Examples:**
```bash
# Get all logs
curl http://localhost:3001/api/sms/logs

# Filter by status
curl "http://localhost:3001/api/sms/logs?status=failed"

# Filter by recipient
curl "http://localhost:3001/api/sms/logs?recipient=%2B911234567890"

# Pagination
curl "http://localhost:3001/api/sms/logs?limit=10&offset=20"

# Date range
curl "http://localhost:3001/api/sms/logs?startDate=2025-01-01T00:00:00Z&endDate=2025-01-31T23:59:59Z"
```

---

### 4. Get SMS Log by ID

**Endpoint:** `GET /api/sms/logs/:id`

**Description:** Retrieves a specific SMS log by ID.

**Path Parameters:**
- `id` (required): SMS log ID

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "recipient": "+911234567890",
    "message": "Your OTP is 123456",
    "status": "sent",
    "messageId": "msg_123",
    "apiResponse": {
      "success": true,
      "message_id": "msg_123"
    },
    "type": "OTP",
    "retryCount": 0,
    "maxRetries": 3,
    "createdAt": "2025-01-15T10:00:00Z",
    "updatedAt": "2025-01-15T10:00:01Z"
  }
}
```

**cURL Example:**
```bash
curl http://localhost:3001/api/sms/logs/1
```

---

### 5. Resend Failed SMS

**Endpoint:** `POST /api/sms/resend`

**Description:** Resends a failed SMS (if retry count hasn't exceeded max).

**Request Body:**
```json
{
  "id": 123
}
```

**Parameters:**
- `id` (required): SMS log ID to resend

**Response:**
```json
{
  "success": true,
  "message": "SMS resent successfully",
  "data": {
    "logId": 123,
    "messageId": "msg_456",
    "status": "sent",
    "retryCount": 1
  }
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:3001/api/sms/resend \
  -H "Content-Type: application/json" \
  -d '{"id": 123}'
```

---

## Error Responses

All endpoints return consistent error responses:

```json
{
  "success": false,
  "error": "Error message description",
  "code": "ERROR_CODE"
}
```

### Common Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Invalid input data |
| `NOT_FOUND` | 404 | Resource not found |
| `MAX_RETRIES_EXCEEDED` | 400 | Maximum retry attempts reached |
| `INVALID_STATUS` | 400 | Invalid status for operation |
| `INTERNAL_ERROR` | 500 | Server error |

## Status Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 400 | Bad Request (validation error) |
| 404 | Not Found |
| 500 | Internal Server Error |

## Rate Limiting

Currently not implemented. Recommended for production:
- Per-IP rate limiting
- Per-user rate limiting
- Bulk SMS throttling

## Validation Rules

### Phone Numbers
- Format: E.164 (e.g., `+911234567890`)
- Length: 10-15 digits
- Must start with `+` and country code

### Messages
- Minimum: 1 character
- Maximum: 1600 characters
- Unicode: Auto-detected if not specified

### Bulk SMS
- Maximum recipients: 100 per request
- Each recipient validated independently

## Best Practices

1. **Always validate phone numbers** before sending
2. **Use appropriate SMS types** (TRANS for transactional, PROMO for marketing)
3. **Monitor logs** for failed messages
4. **Implement retry logic** on client side for critical messages
5. **Respect rate limits** to avoid API throttling
6. **Store message IDs** for tracking and delivery status

## Testing

Use the provided cURL examples or tools like Postman/Insomnia for testing.

For automated testing, consider:
- Unit tests for validation logic
- Integration tests for API endpoints
- E2E tests for complete flows

## Additional Resources

- **API Documentation**: https://developers.uniquedigitaloutreach.com/
- **Support**: Contact Unique Digital Outreach through their developer portal

