# Troubleshooting Guide

Common issues and solutions for the SMS integration backend.

## API Connection Issues

### Error: "SMS API key not configured"

**Solution:**
- Ensure `SMS_API_KEY` is set in your `.env` file
- Verify the API key is correct and active
- Restart the server after updating environment variables

### Error: "Network timeout" or "Request failed"

**Possible Causes:**
1. API endpoint is down or unreachable
2. Network connectivity issues
3. Firewall blocking requests

**Solutions:**
- Check if `SMS_API_URL` is correct
- Verify network connectivity: `curl https://api.uniquedigitaloutreach.com/sms`
- Check firewall rules
- Increase `SMS_TIMEOUT_MS` if needed

### Error: "API request failed with status 401"

**Solution:**
- Verify your API key is valid
- Check if the API key has expired
- Ensure the API key format is correct (no extra spaces)

### Error: "API request failed with status 429" (Rate Limit)

**Solution:**
- The system will automatically retry with exponential backoff
- Reduce the frequency of requests
- Contact Unique Digital Outreach to increase rate limits
- Documentation: https://developers.uniquedigitaloutreach.com/

## Database Issues

### Error: "Failed to create SMS log"

**Possible Causes:**
1. Supabase connection issues
2. Missing `sms_logs` table
3. RLS policies blocking access

**Solutions:**
- Verify `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are correct
- Run the migration: `supabase migration up`
- Check Supabase dashboard for connection status
- Verify service role key has proper permissions

### Error: "Failed to fetch SMS logs"

**Solution:**
- Check if RLS policies are correctly configured
- Verify the service role key is being used (not anon key)
- Check Supabase logs for detailed error messages

## Validation Errors

### Error: "Invalid phone number format"

**Solution:**
- Phone numbers must be in E.164 format: `+[country code][number]`
- Examples:
  - ✅ `+911234567890` (India)
  - ✅ `+12125551234` (USA)
  - ❌ `911234567890` (missing +)
  - ❌ `+91 1234567890` (spaces not allowed)

### Error: "Message cannot exceed 1600 characters"

**Solution:**
- Reduce message length
- For longer messages, consider splitting into multiple SMS
- Unicode messages count each character as 1 unit

## Retry Issues

### SMS not retrying automatically

**Check:**
1. Verify `SMS_MAX_RETRIES` is set correctly (default: 3)
2. Check if retry count has exceeded max retries
3. Verify `next_retry_at` timestamp in database

**Solution:**
- Use the `/api/sms/resend` endpoint to manually retry
- Check logs for retry attempts

### Too many retries

**Solution:**
- Reduce `SMS_MAX_RETRIES` in environment variables
- Check if the issue is persistent (may indicate API problem)

## Performance Issues

### Slow response times

**Possible Causes:**
1. High retry delays
2. Network latency
3. Database query performance

**Solutions:**
- Reduce `SMS_RETRY_DELAY_MS` if appropriate
- Add database indexes (already included in migration)
- Consider using connection pooling for Supabase

### Memory issues

**Solution:**
- For bulk SMS, process in batches
- Monitor memory usage
- Consider implementing queue system for large volumes

## Development Issues

### TypeScript compilation errors

**Solution:**
- Run `npm install` to ensure all dependencies are installed
- Check `tsconfig.json` configuration
- Verify Node.js version (requires >= 18.0.0)

### Port already in use

**Solution:**
- Change `PORT` in `.env` file
- Or kill the process using the port:
  ```bash
  # Find process
  lsof -i :3001
  # Kill process
  kill -9 <PID>
  ```

## Testing

### Test API connection

```bash
curl -X POST http://localhost:3001/api/sms/send \
  -H "Content-Type: application/json" \
  -d '{
    "recipient": "+911234567890",
    "message": "Test message",
    "type": "TRANS"
  }'
```

### Test health endpoint

```bash
curl http://localhost:3001/health
```

### Check database connection

Verify Supabase connection in your code:
```typescript
import { supabase } from './config/supabase';
const { data, error } = await supabase.from('sms_logs').select('count');
console.log(error || 'Connected');
```

## Common Error Codes

| Code | Description | Solution |
|------|-------------|----------|
| `VALIDATION_ERROR` | Invalid input data | Check request body format |
| `NOT_FOUND` | Resource not found | Verify ID exists |
| `MAX_RETRIES_EXCEEDED` | Too many retry attempts | Use manual resend endpoint |
| `INTERNAL_ERROR` | Server error | Check server logs |

## Getting Help

1. Check server logs for detailed error messages
2. Verify all environment variables are set correctly
3. Test API connection independently
4. Check Supabase dashboard for database issues
5. Review Unique Digital Outreach API documentation

## Debug Mode

Enable detailed logging by setting:
```env
NODE_ENV=development
```

This will show:
- Full request/response logs
- Stack traces for errors
- Retry attempt details

