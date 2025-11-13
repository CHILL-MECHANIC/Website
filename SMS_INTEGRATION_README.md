# SMS Integration - Complete Implementation Guide

This document provides a complete overview of the SMS integration system using Unique Digital Outreach API with Supabase backend and React TypeScript frontend.

## 📋 Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Quick Start](#quick-start)
4. [Project Structure](#project-structure)
5. [Features](#features)
6. [Setup Instructions](#setup-instructions)
7. [Usage Examples](#usage-examples)
8. [API Reference](#api-reference)
9. [Troubleshooting](#troubleshooting)

## 🎯 Overview

This is a production-ready SMS integration system that provides:

- **Backend**: Node.js/Express API with TypeScript
- **Frontend**: React TypeScript components with hooks
- **Database**: Supabase for SMS logging and tracking
- **API Provider**: Unique Digital Outreach (https://developers.uniquedigitaloutreach.com/)

## 🏗️ Architecture

```
┌─────────────────┐
│   React Frontend │
│  (Components &   │
│     Hooks)       │
└────────┬─────────┘
         │ HTTP
         ▼
┌─────────────────┐
│  Express API    │
│  (Backend)      │
└────────┬─────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌────────┐ ┌──────────┐
│ SMS API │ │ Supabase │
│ (UDO)  │ │ (Logs)   │
└────────┘ └──────────┘
```

## 🚀 Quick Start

### 1. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your credentials
npm run dev
```

### 2. Database Setup

Run the Supabase migration:
```bash
# Using Supabase CLI
supabase migration up

# Or apply manually in Supabase dashboard
# File: supabase/migrations/20250115000000_create_sms_logs.sql
```

### 3. Frontend Setup

```bash
# From project root
npm install
# Create .env file with VITE_API_URL
npm run dev
```

### 4. Access the Application

- Frontend: http://localhost:8080/sms
- Backend API: http://localhost:3001/api/sms
- Health Check: http://localhost:3001/health

## 📁 Project Structure

```
.
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── supabase.ts          # Supabase client config
│   │   ├── middleware/
│   │   │   ├── logger.ts             # Request logging
│   │   │   └── errorHandler.ts       # Error handling
│   │   ├── routes/
│   │   │   └── sms.ts                # SMS API routes
│   │   ├── services/
│   │   │   ├── smsService.ts         # SMS sending logic
│   │   │   └── supabaseService.ts   # Database operations
│   │   ├── types/
│   │   │   ├── database.ts           # Database types
│   │   │   └── sms.ts               # SMS types
│   │   └── index.ts                 # Express server
│   ├── package.json
│   ├── tsconfig.json
│   └── README.md
│
├── src/
│   ├── components/
│   │   ├── SMSForm.tsx              # Single SMS form
│   │   ├── BulkSMSForm.tsx          # Bulk SMS form
│   │   └── SMSLogsViewer.tsx         # Logs viewer
│   ├── hooks/
│   │   ├── useSMS.ts                 # Single SMS hook
│   │   ├── useBulkSMS.ts             # Bulk SMS hook
│   │   └── useSMSLogs.ts             # Logs hook
│   ├── services/
│   │   └── smsClient.ts              # API client
│   └── pages/
│       └── SMS.tsx                   # SMS management page
│
└── supabase/
    └── migrations/
        └── 20250115000000_create_sms_logs.sql
```

## ✨ Features

### Backend Features

- ✅ Single SMS sending
- ✅ Bulk SMS (up to 100 recipients)
- ✅ SMS types: TRANS, PROMO, OTP
- ✅ Unicode and Flash SMS support
- ✅ Template SMS with variables
- ✅ Input validation (phone, message)
- ✅ Exponential backoff retry logic
- ✅ Comprehensive error handling
- ✅ Supabase logging with RLS
- ✅ Request/response logging
- ✅ TypeScript strict mode

### Frontend Features

- ✅ Reusable SMS client service
- ✅ Custom React hooks with state management
- ✅ UI components with validation
- ✅ Error handling and loading states
- ✅ SMS logs viewer with filtering
- ✅ Resend failed SMS functionality
- ✅ Type-safe interfaces

## 🔧 Setup Instructions

### Environment Variables

#### Backend (.env)

```env
# SMS API Configuration
SMS_API_KEY=your_api_key_here
SMS_SENDER_ID=your_sender_id
SMS_API_URL=https://api.uniquedigitaloutreach.com/sms

# Supabase Configuration
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Server Configuration
PORT=3001
NODE_ENV=development

# Retry Configuration
SMS_MAX_RETRIES=3
SMS_RETRY_DELAY_MS=1000
SMS_TIMEOUT_MS=30000
```

#### Frontend (.env)

```env
VITE_API_URL=http://localhost:3001/api/sms
```

### Database Migration

The migration creates:
- `sms_logs` table with indexes
- Row Level Security policies
- Auto-update trigger for `updated_at`

Apply migration:
```sql
-- Run in Supabase SQL editor or via CLI
-- File: supabase/migrations/20250115000000_create_sms_logs.sql
```

## 💡 Usage Examples

### Send Single SMS (Frontend)

```typescript
import { useSMS } from '@/hooks/useSMS';

function MyComponent() {
  const { sendSMS, loading, error, response } = useSMS();

  const handleSend = async () => {
    await sendSMS({
      recipient: '+911234567890',
      message: 'Your OTP is 123456',
      type: 'OTP'
    });
  };

  return (
    <button onClick={handleSend} disabled={loading}>
      Send SMS
    </button>
  );
}
```

### Send Bulk SMS (Frontend)

```typescript
import { useBulkSMS } from '@/hooks/useBulkSMS';

function MyComponent() {
  const { sendBulkSMS, loading, response } = useBulkSMS();

  const handleBulkSend = async () => {
    await sendBulkSMS({
      recipients: ['+911234567890', '+919876543210'],
      message: 'Bulk message',
      type: 'PROMO'
    });
  };
}
```

### Fetch SMS Logs (Frontend)

```typescript
import { useSMSLogs } from '@/hooks/useSMSLogs';

function MyComponent() {
  const { logs, loading, fetchLogs } = useSMSLogs();

  useEffect(() => {
    fetchLogs({
      status: 'failed',
      limit: 20
    });
  }, []);

  return (
    <div>
      {logs.map(log => (
        <div key={log.id}>{log.recipient} - {log.status}</div>
      ))}
    </div>
  );
}
```

### API Usage (cURL)

```bash
# Send single SMS
curl -X POST http://localhost:3001/api/sms/send \
  -H "Content-Type: application/json" \
  -d '{
    "recipient": "+911234567890",
    "message": "Test message",
    "type": "TRANS"
  }'

# Send bulk SMS
curl -X POST http://localhost:3001/api/sms/send-bulk \
  -H "Content-Type: application/json" \
  -d '{
    "recipients": ["+911234567890", "+919876543210"],
    "message": "Bulk message"
  }'

# Get logs
curl "http://localhost:3001/api/sms/logs?status=failed&limit=10"
```

## 📚 API Reference

See [backend/API_DOCUMENTATION.md](./backend/API_DOCUMENTATION.md) for complete API reference.

### Main Endpoints

- `POST /api/sms/send` - Send single SMS
- `POST /api/sms/send-bulk` - Send bulk SMS
- `GET /api/sms/logs` - Get SMS logs
- `GET /api/sms/logs/:id` - Get specific log
- `POST /api/sms/resend` - Resend failed SMS

## 🔍 Troubleshooting

See [backend/TROUBLESHOOTING.md](./backend/TROUBLESHOOTING.md) for detailed troubleshooting guide.

### Common Issues

1. **API Key Not Working**
   - Verify API key in `.env`
   - Check API key format (no spaces)
   - Restart server after changes

2. **Database Connection Failed**
   - Verify Supabase credentials
   - Check migration applied
   - Verify RLS policies

3. **Phone Number Validation Failed**
   - Use E.164 format: `+[country][number]`
   - Example: `+911234567890`

4. **Messages Not Sending**
   - Check API endpoint URL
   - Verify network connectivity
   - Check server logs for errors

## 🧪 Testing

### Test Backend

```bash
cd backend
npm run dev
# Test health endpoint
curl http://localhost:3001/health
```

### Test Frontend

```bash
npm run dev
# Navigate to http://localhost:8080/sms
```

### Test API

Use the provided cURL examples or Postman collection.

## 📝 Validation Rules

### Phone Numbers
- Format: E.164 (e.g., `+911234567890`)
- Length: 10-15 digits
- Must include country code

### Messages
- Minimum: 1 character
- Maximum: 1600 characters
- Unicode: Auto-detected

### Bulk SMS
- Maximum: 100 recipients per request
- Each recipient validated independently

## 🔒 Security

- Row Level Security (RLS) on database
- Input validation and sanitization
- Sensitive data redacted in logs
- Service role key for backend only
- CORS configured for frontend

## 📊 Monitoring

- All SMS attempts logged to Supabase
- Full API responses stored for debugging
- Retry counts and timestamps tracked
- Status tracking (pending → sent/failed)

## 🚀 Production Deployment

### Backend

1. Set `NODE_ENV=production`
2. Configure production environment variables
3. Build: `npm run build`
4. Start: `npm start`
5. Use process manager (PM2, systemd)

### Frontend

1. Set `VITE_API_URL` to production API
2. Build: `npm run build`
3. Deploy `dist/` folder

### Database

1. Apply migrations to production Supabase
2. Verify RLS policies
3. Test service role key access

## 📖 Additional Documentation

- [Backend README](./backend/README.md)
- [API Documentation](./backend/API_DOCUMENTATION.md)
- [Troubleshooting Guide](./backend/TROUBLESHOOTING.md)

## 🤝 Support

For issues or questions:
1. Check troubleshooting guide
2. Review server logs
3. Verify environment variables
4. Test API connection independently

## 📄 License

This implementation is provided as-is for integration purposes.

