# Clerk Localhost Development Setup

## The Problem
When testing on localhost, Clerk webhooks can't reach your local server to sync user data. This causes authentication issues where the server returns HTML (login page) instead of JSON.

## Solution: Forward Clerk Webhooks to Localhost

### Option 1: Use Clerk CLI (Recommended)

1. **Install Clerk CLI** (if not already installed):
   ```bash
   npm install -g @clerk/clerk-sdk-node
   ```

2. **Start webhook forwarding** in a separate terminal:
   ```bash
   npx @clerk/clerk-sdk-node localhost
   ```
   
   This will:
   - Create a tunnel to your localhost server
   - Forward webhook events from Clerk to your local server
   - Allow user data to sync properly

3. **Configure Clerk Dashboard**:
   - Go to your Clerk Dashboard → Webhooks
   - The CLI will provide you with a webhook endpoint URL
   - Make sure your webhook is configured to use this endpoint

### Option 2: Use ngrok

1. **Install ngrok**:
   ```bash
   npm install -g ngrok
   # or download from https://ngrok.com/
   ```

2. **Start ngrok tunnel**:
   ```bash
   ngrok http 3000
   ```

3. **Update Clerk Webhook URL**:
   - Copy the ngrok URL (e.g., `https://abc123.ngrok.io`)
   - Go to Clerk Dashboard → Webhooks
   - Update the webhook endpoint to: `https://abc123.ngrok.io/api/webhooks/clerk`
   - Save the changes

### Option 3: Development Mode - JWT Validation Only

If your server can validate Clerk JWT tokens without requiring the user to exist in the database first, you can temporarily:

1. Skip the user existence check in your server code for development
2. Create the user on-demand when they first make a request
3. This is less ideal but works for quick testing

## Verification

After setting up webhook forwarding, test by:
1. Signing in through your app
2. Check your server logs - you should see webhook events coming through
3. Check your database - the user should be created/updated
4. Try joining a challenge - it should work now

## Notes

- **JWT Validation**: Your server should validate Clerk JWT tokens directly using Clerk's backend SDK
- **Webhooks**: Are primarily for syncing user data to your database, not for JWT validation
- **Production**: In production, webhooks work automatically since your server has a public URL
