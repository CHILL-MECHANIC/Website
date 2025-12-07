# cURL Test Commands for Backend API

## Prerequisites
- Backend server running on `http://localhost:3001`
- Replace `YOUR_JWT_TOKEN` with actual JWT token from verify-otp response
- Replace `9876543210` with test phone number

## 1. Health Check
```bash
curl http://localhost:3001/health
```

**Expected Response:**
```json
{
  "success": true,
  "message": "SMS API is running",
  "timestamp": "2025-01-20T10:00:00.000Z"
}
```

## 2. Check Rate Limit
```bash
curl "http://localhost:3001/api/auth/check-rate-limit?phone=9876543210"
```

**Expected Response:**
```json
{
  "success": true,
  "canRequest": true,
  "message": "OTP can be requested"
}
```

## 3. Send OTP
```bash
curl -X POST http://localhost:3001/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phone":"9211970031"}'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "OTP sent successfully",
  "data": {
    "messageId": "...",
    "requestId": "...",
    "logId": 123
  },
  "debug": {
    "otp": "1234"
  }
}
```

## 4. Verify OTP
```bash
curl -X POST http://localhost:3001/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"phone":"9876543210","otp":"1234"}'
```

**Expected Response:**
```json
{
  "success": true,
  "verified": true,
  "message": "OTP verified successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "phone": "919876543210",
    "email": null,
    "fullName": null,
    "avatarUrl": null,
    "isProfileComplete": false,
    "authMethod": "phone",
    "isNewUser": true
  }
}
```

## 5. Resend OTP
```bash
curl -X POST http://localhost:3001/api/auth/resend-otp \
  -H "Content-Type: application/json" \
  -d '{"phone":"9876543210"}'
```

## 6. Get Profile (Requires Auth)
```bash
curl http://localhost:3001/api/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Expected Response:**
```json
{
  "success": true,
  "profile": {
    "id": "uuid",
    "phone": "919876543210",
    "email": null,
    "fullName": null,
    "avatarUrl": null,
    "dateOfBirth": null,
    "gender": null,
    "addressLine1": null,
    "addressLine2": null,
    "city": null,
    "state": null,
    "pincode": null,
    "country": "India",
    "isProfileComplete": false,
    "authMethod": "phone",
    "createdAt": "2025-01-20T10:00:00.000Z"
  }
}
```

## 7. Update Profile (Requires Auth)
```bash
curl -X PUT http://localhost:3001/api/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "John Doe",
    "email": "john@example.com",
    "city": "Mumbai",
    "state": "Maharashtra"
  }'
```

## 8. Get SMS Logs
```bash
curl http://localhost:3001/api/sms/logs
```

## 9. Send SMS
```bash
curl -X POST http://localhost:3001/api/sms/send \
  -H "Content-Type: application/json" \
  -d '{
    "recipient": "9876543210",
    "message": "Test message",
    "type": "TRANS"
  }'
```

## PowerShell Alternative Commands

### Health Check
```powershell
Invoke-RestMethod -Uri "http://localhost:3001/health" -Method GET
```

### Send OTP
```powershell
$body = @{ phone = "9876543210" } | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:3001/api/auth/send-otp" -Method POST -Body $body -ContentType "application/json"
```

### Verify OTP
```powershell
$body = @{ phone = "9876543210"; otp = "1234" } | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:3001/api/auth/verify-otp" -Method POST -Body $body -ContentType "application/json"
```

### Get Profile
```powershell
$headers = @{ Authorization = "Bearer YOUR_JWT_TOKEN" }
Invoke-RestMethod -Uri "http://localhost:3001/api/profile" -Method GET -Headers $headers
```

