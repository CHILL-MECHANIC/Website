# Security Configuration

## API Key Storage

The Unique Digital Outreach API key has been securely configured in the environment variables.

### ✅ Security Measures Implemented

1. **Environment Variables**: API key is stored in `backend/.env` file
2. **Git Ignore**: `.env` file is excluded from version control (see `.gitignore`)
3. **No Hardcoding**: API key is never hardcoded in source files
4. **Example File**: `.env.example` contains placeholders (no real keys)

### 🔐 API Key Location

- **Actual Key**: `backend/.env` (gitignored, not committed)
- **Example Template**: `backend/.env.example` (safe to commit)

### 📝 Current Configuration

The API key is configured in `backend/.env`:
```
SMS_API_KEY=your_api_key_here
```

**Note:** The actual API key is stored in `backend/.env` (gitignored). Never commit the actual key to version control.

### ⚠️ Important Security Notes

1. **Never commit `.env` files** - They contain sensitive credentials
2. **Use `.env.example`** - For sharing configuration structure without secrets
3. **Rotate keys regularly** - Update API keys periodically
4. **Restrict access** - Only authorized team members should have access to `.env`
5. **Production deployment** - Use secure secret management (e.g., AWS Secrets Manager, Azure Key Vault)

### 🔄 Updating the API Key

If you need to update the API key:

1. Edit `backend/.env` file
2. Update `SMS_API_KEY` value
3. Restart the backend server
4. The new key will be loaded automatically

### 🚀 Production Deployment

For production environments:

1. **Do NOT** use `.env` files
2. Use environment variables set by your hosting platform
3. Use secret management services:
   - AWS Secrets Manager
   - Azure Key Vault
   - HashiCorp Vault
   - Kubernetes Secrets
4. Enable encryption at rest for secrets
5. Use least-privilege access policies

### ✅ Verification

To verify the API key is loaded correctly:

1. Start the backend server: `cd backend && npm run dev`
2. Check server logs - should not show "SMS API key not configured" error
3. Test sending an SMS through the API

### 📚 Related Documentation

- [Backend README](./README.md)
- [API Documentation](./API_DOCUMENTATION.md)
- [Troubleshooting Guide](./TROUBLESHOOTING.md)
- [Unique Digital Outreach Developer Portal](https://developers.uniquedigitaloutreach.com/)

