# SMS Integration Backend

Production-ready SMS integration backend using Unique Digital Outreach API with Supabase logging.

## Features

- ✅ Single SMS sending with validation
- ✅ Bulk SMS to multiple recipients
- ✅ OTP, Transactional, and Promotional SMS support
- ✅ Unicode and Flash SMS support
- ✅ Template SMS with custom variables
- ✅ Exponential backoff retry logic
- ✅ Comprehensive error handling
- ✅ Supabase logging with RLS policies
- ✅ Request/response logging middleware
- ✅ TypeScript with strict mode

## Setup

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Environment Variables

Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

Required environment variables:
- `SMS_API_KEY` - Your Unique Digital Outreach API key (get from https://developers.uniquedigitaloutreach.com/)
- `SMS_SENDER_ID` - Your sender ID (optional, defaults to "SMS")
- `SMS_API_URL` - API endpoint (defaults to https://api.uniquedigitaloutreach.com/sms)
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (for backend operations)
- `PORT` - Server port (defaults to 3001)
- `NODE_ENV` - Environment (development/production)

### 3. Database Migration

Run the Supabase migration to create the `sms_logs` table:

```bash
# Using Supabase CLI
supabase migration up

# Or apply the migration manually in Supabase dashboard
# File: supabase/migrations/20250115000000_create_sms_logs.sql
```

### 4. Run the Server

Development:
```bash
npm run dev
```

Production:
```bash
npm run build
npm start
```

The server will start on `http://localhost:3001` (or your configured PORT).

## API Endpoints

### POST /api/sms/send

Send a single SMS.

**Request Body:**
```json
{
  "recipient": "+911234567890",
  "message": "Your OTP is 123456",
  "type": "OTP",
  "senderId": "SMS",
  "unicode": false,
  "flash": false
}
```

**Response:**
```json
{
  "success": true,
  "message": "SMS sent successfully",
  "data": {
    "logId": 1,
    "messageId": "msg_123456",
    "status": "sent"
  }
}
```

### POST /api/sms/send-bulk

Send bulk SMS to multiple recipients.

**Request Body:**
```json
{
  "recipients": ["+911234567890", "+919876543210"],
  "message": "Bulk message",
  "type": "PROMO"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Bulk SMS completed: 2 sent, 0 failed",
  "data": {
    "total": 2,
    "success": 2,
    "failed": 0,
    "results": [...]
  }
}
```

### GET /api/sms/logs

Retrieve SMS logs with optional filtering.

**Query Parameters:**
- `recipient` - Filter by phone number
- `status` - Filter by status (pending, sent, failed, delivered)
- `type` - Filter by type (TRANS, PROMO, OTP)
- `limit` - Results per page (default: 50)
- `offset` - Pagination offset (default: 0)
- `startDate` - ISO date string
- `endDate` - ISO date string

**Response:**
```json
{
  "success": true,
  "data": {
    "logs": [...],
    "pagination": {
      "total": 100,
      "limit": 50,
      "offset": 0,
      "hasMore": true
    }
  }
}
```

### GET /api/sms/logs/:id

Get specific SMS log details.

### POST /api/sms/resend

Resend a failed SMS.

**Request Body:**
```json
{
  "id": 123
}
```

## Error Handling

All endpoints return consistent error responses:

```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

Common error codes:
- `VALIDATION_ERROR` - Invalid input data
- `NOT_FOUND` - Resource not found
- `MAX_RETRIES_EXCEEDED` - Maximum retry attempts reached
- `INTERNAL_ERROR` - Server error

## Validation

### Phone Numbers
- Must be in E.164 format (e.g., +911234567890)
- Minimum 10 digits, maximum 15 digits
- Must start with country code

### Messages
- Minimum 1 character
- Maximum 1600 characters
- Unicode detection is automatic if not specified

## Retry Logic

Failed SMS attempts are automatically retried with exponential backoff:
- Default max retries: 3
- Initial delay: 1000ms
- Backoff multiplier: 2x
- Maximum delay: 30000ms

Retries are not performed for:
- Client errors (4xx) except 429 (rate limit)
- Validation errors

## Logging

All SMS attempts are logged to Supabase `sms_logs` table with:
- Full API responses for debugging
- Retry counts and next retry timestamps
- Status tracking (pending → sent/failed)
- Message IDs for tracking

## Security

- Row Level Security (RLS) enabled on `sms_logs` table
- Service role key used only for backend operations
- Input validation and sanitization
- Sensitive data redacted in logs

## Troubleshooting

See [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) for common issues and solutions.

