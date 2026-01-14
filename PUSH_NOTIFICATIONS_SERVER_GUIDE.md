# Push Notifications - Server Implementation Guide

This guide covers the backend implementation required to support push notifications for the Trybe mobile app.

## Overview

The mobile client is now configured to:
1. Request notification permissions from users
2. Obtain Expo Push Tokens when users authenticate
3. Send push tokens to the server via `POST /api/users/push-token`
4. Send notification preferences (time, start date) when joining challenges

The server needs to:
1. Store push tokens for each user/device
2. Accept notification preferences when users join challenges
3. Schedule and send push notifications at appropriate times

---

## 1. Database Schema Changes

### A. Store Push Tokens

Create a table to store user device tokens:

```sql
-- Option 1: Separate table (recommended for multiple devices per user)
CREATE TABLE push_tokens (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(255) NOT NULL UNIQUE,
  device_info JSONB, -- optional: store device type, OS, etc.
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  last_used_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_push_tokens_user_id ON push_tokens(user_id);
CREATE INDEX idx_push_tokens_token ON push_tokens(token);

-- Option 2: Add to users table (simpler, one device per user)
ALTER TABLE users ADD COLUMN push_token VARCHAR(255);
ALTER TABLE users ADD COLUMN push_token_updated_at TIMESTAMP;
```

### B. Update MemberChallenges Table

Ensure the `member_challenges` table stores notification preferences:

```sql
-- Verify these columns exist (they should based on the mobile client code)
ALTER TABLE member_challenges
  ADD COLUMN IF NOT EXISTS notification_hour INTEGER,
  ADD COLUMN IF NOT EXISTS notification_minute INTEGER,
  ADD COLUMN IF NOT EXISTS start_at TIMESTAMP;

-- Add index for efficient notification queries
CREATE INDEX IF NOT EXISTS idx_member_challenges_notifications
  ON member_challenges(notification_hour, notification_minute)
  WHERE notification_hour IS NOT NULL;
```

---

## 2. API Endpoints

### A. Store Push Token

**Endpoint:** `POST /api/users/push-token`

**Authentication:** Required (Bearer token)

**Request Body:**
```json
{
  "token": "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]"
}
```

**Implementation Example (Node.js/Express):**

```javascript
// routes/users.ts
import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { db } from '../lib/db';

const router = Router();

router.post('/push-token', requireAuth, async (req, res) => {
  const { token } = req.body;
  const userId = req.user.id; // From auth middleware

  if (!token || !token.startsWith('ExponentPushToken[')) {
    return res.status(400).json({
      error: 'Invalid push token format'
    });
  }

  try {
    // Option 1: Upsert into push_tokens table (multiple devices)
    await db.query(`
      INSERT INTO push_tokens (user_id, token, last_used_at)
      VALUES ($1, $2, NOW())
      ON CONFLICT (token)
      DO UPDATE SET
        last_used_at = NOW(),
        updated_at = NOW()
    `, [userId, token]);

    // Option 2: Update users table (single device)
    // await db.query(`
    //   UPDATE users
    //   SET push_token = $1, push_token_updated_at = NOW()
    //   WHERE id = $2
    // `, [token, userId]);

    res.json({ success: true });
  } catch (error) {
    console.error('Error storing push token:', error);
    res.status(500).json({ error: 'Failed to store push token' });
  }
});

export default router;
```

### B. Update Join Challenge Endpoint

**Endpoint:** `POST /api/challenges/join-unjoin/:id`

**Current Implementation:** Already receives `notificationHour`, `notificationMinute`, and `startAt`

**Ensure these are saved:** Verify your existing endpoint saves these fields to the database.

```javascript
// Example verification
router.post('/join-unjoin/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  const { userId, notificationHour, notificationMinute, startAt } = req.body;

  // ... existing join logic ...

  // Ensure notification preferences are stored
  await db.query(`
    INSERT INTO member_challenges
      (user_id, challenge_id, notification_hour, notification_minute, start_at, ...)
    VALUES ($1, $2, $3, $4, $5, ...)
    ON CONFLICT (user_id, challenge_id)
    DO UPDATE SET
      notification_hour = $3,
      notification_minute = $4,
      start_at = $5,
      ...
  `, [userId, id, notificationHour, notificationMinute, startAt, ...]);

  // ... rest of logic ...
});
```

---

## 3. Sending Push Notifications

### A. Expo Push Notification Service

Expo provides a free push notification service. You can send notifications using their REST API.

**Install Expo Server SDK (recommended):**

```bash
npm install expo-server-sdk
```

**Create Notification Service:**

```javascript
// services/pushNotifications.ts
import { Expo, ExpoPushMessage } from 'expo-server-sdk';

const expo = new Expo();

export interface NotificationData {
  title: string;
  body: string;
  data?: Record<string, any>;
  sound?: 'default' | null;
  badge?: number;
}

export async function sendPushNotification(
  pushToken: string,
  notification: NotificationData
): Promise<void> {
  // Check if token is valid Expo push token
  if (!Expo.isExpoPushToken(pushToken)) {
    console.error(`Push token ${pushToken} is not a valid Expo push token`);
    return;
  }

  // Create message
  const message: ExpoPushMessage = {
    to: pushToken,
    title: notification.title,
    body: notification.body,
    data: notification.data,
    sound: notification.sound || 'default',
    badge: notification.badge,
  };

  try {
    // Send notification
    const tickets = await expo.sendPushNotificationsAsync([message]);

    // Handle receipts (optional but recommended)
    for (const ticket of tickets) {
      if (ticket.status === 'error') {
        console.error(`Error sending push notification:`, ticket.message);
        if (ticket.details?.error === 'DeviceNotRegistered') {
          // Token is invalid - remove from database
          await removePushToken(pushToken);
        }
      }
    }
  } catch (error) {
    console.error('Failed to send push notification:', error);
  }
}

export async function sendBatchPushNotifications(
  recipients: Array<{ token: string; notification: NotificationData }>
): Promise<void> {
  const messages: ExpoPushMessage[] = recipients
    .filter(r => Expo.isExpoPushToken(r.token))
    .map(r => ({
      to: r.token,
      title: r.notification.title,
      body: r.notification.body,
      data: r.notification.data,
      sound: r.notification.sound || 'default',
      badge: r.notification.badge,
    }));

  // Expo recommends sending max 100 at a time
  const chunks = expo.chunkPushNotifications(messages);

  for (const chunk of chunks) {
    try {
      const tickets = await expo.sendPushNotificationsAsync(chunk);
      // Handle tickets as above
    } catch (error) {
      console.error('Batch notification error:', error);
    }
  }
}

async function removePushToken(token: string): Promise<void> {
  // Implement token removal from your database
  await db.query('DELETE FROM push_tokens WHERE token = $1', [token]);
}
```

---

## 4. Scheduling Notifications

You need a scheduler to send notifications at the correct times. Options:

### Option A: Cron Jobs (Simple)

```javascript
// jobs/notificationScheduler.ts
import cron from 'node-cron';
import { db } from '../lib/db';
import { sendPushNotification } from '../services/pushNotifications';

// Run every minute to check for notifications to send
cron.schedule('* * * * *', async () => {
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();

  try {
    // Find all active memberships that need notifications now
    const result = await db.query(`
      SELECT
        mc.id as membership_id,
        mc.user_id,
        mc.challenge_id,
        c.name as challenge_name,
        c.frequency,
        pt.token as push_token
      FROM member_challenges mc
      JOIN challenges c ON c.id = mc.challenge_id
      JOIN push_tokens pt ON pt.user_id = mc.user_id
      WHERE
        mc.notification_hour = $1
        AND mc.notification_minute = $2
        AND mc.status = 'active'
        AND c.status = 'active'
        AND (
          -- For SCHEDULED challenges, check if within date range
          (c.type = 'SCHEDULED' AND NOW() BETWEEN c.start_at AND c.end_at)
          OR
          -- For SELF_LED challenges, check if within user's timeline
          (c.type = 'SELF_LED' AND NOW() BETWEEN mc.start_at AND (mc.start_at + c.duration_days * INTERVAL '1 day'))
        )
    `, [currentHour, currentMinute]);

    // Send notifications
    for (const row of result.rows) {
      await sendPushNotification(row.push_token, {
        title: row.challenge_name,
        body: `Time to check in! Complete today's ${row.frequency.toLowerCase()} challenge.`,
        data: {
          challengeId: row.challenge_id,
          membershipId: row.membership_id,
          type: 'daily_reminder',
        },
      });
    }

    console.log(`Sent ${result.rows.length} notifications at ${currentHour}:${currentMinute}`);
  } catch (error) {
    console.error('Error in notification scheduler:', error);
  }
});
```

### Option B: Queue-Based (Recommended for Scale)

Use a job queue like Bull (Redis-based):

```bash
npm install bull @types/bull
```

```javascript
// queues/notificationQueue.ts
import Queue from 'bull';
import { db } from '../lib/db';
import { sendBatchPushNotifications } from '../services/pushNotifications';

const notificationQueue = new Queue('notifications', {
  redis: process.env.REDIS_URL,
});

// Add repeatable job that runs every minute
notificationQueue.add(
  'process-scheduled-notifications',
  {},
  { repeat: { cron: '* * * * *' } }
);

// Process the job
notificationQueue.process('process-scheduled-notifications', async (job) => {
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();

  // Query for notifications (same as above)
  const result = await db.query(/* ... same query ... */);

  const notifications = result.rows.map(row => ({
    token: row.push_token,
    notification: {
      title: row.challenge_name,
      body: `Time to check in! Complete today's ${row.frequency.toLowerCase()} challenge.`,
      data: {
        challengeId: row.challenge_id,
        membershipId: row.membership_id,
        type: 'daily_reminder',
      },
    },
  }));

  await sendBatchPushNotifications(notifications);

  return { sent: notifications.length };
});

export default notificationQueue;
```

---

## 5. Testing

### A. Test Push Token Storage

```bash
# Get auth token from mobile app (check logs or network tab)
export TOKEN="your-jwt-token"

# Send test token
curl -X POST http://localhost:3000/api/users/push-token \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"token": "ExponentPushToken[test-token-123]"}'
```

### B. Test Sending Notification

```javascript
// scripts/testNotification.ts
import { sendPushNotification } from '../services/pushNotifications';

async function test() {
  const testToken = 'ExponentPushToken[...]'; // Get from database or mobile logs

  await sendPushNotification(testToken, {
    title: 'Test Notification',
    body: 'This is a test from the Trybe server!',
    data: { test: true },
  });

  console.log('Test notification sent');
}

test();
```

### C. Test on Physical Device

**Important:** Push notifications don't work in iOS Simulator or Android Emulator. You must test on a physical device.

1. Install the app on a physical device
2. Sign in and join a challenge
3. Check server logs to confirm push token was received
4. Manually trigger a notification or wait for scheduled time
5. Verify notification appears on device

---

## 6. Production Considerations

### A. Error Handling

- **Invalid Tokens:** Remove tokens that return `DeviceNotRegistered` errors
- **Rate Limiting:** Expo has rate limits; batch notifications efficiently
- **Retry Logic:** Implement retries for transient failures

### B. Analytics

Track notification metrics:
- Tokens registered per day
- Notifications sent
- Notifications failed
- User engagement (notification opened)

### C. Timezone Handling

**Important:** The mobile client sends notification times in the user's local timezone (hour/minute), but doesn't send timezone info.

Options:
1. **Simple:** Assume all times are in server timezone (works if users are in one region)
2. **Store User Timezone:** Add `timezone` field to users table, send from mobile
3. **Convert on Server:** Use user's location or profile to determine timezone

Example with user timezone:

```javascript
// Add to mobile app when joining challenge
const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
// Send with notification preferences

// Server query with timezone conversion
const result = await db.query(`
  SELECT ...
  WHERE
    EXTRACT(HOUR FROM NOW() AT TIME ZONE u.timezone) = mc.notification_hour
    AND EXTRACT(MINUTE FROM NOW() AT TIME ZONE u.timezone) = mc.notification_minute
`);
```

### D. Notification Content

Customize messages based on:
- Challenge type (daily, weekly)
- User progress (streak count)
- Day number (for programs)
- Time of day (morning/evening messaging)

---

## 7. Monitoring

Set up alerts for:
- High notification failure rates
- Push token errors
- Scheduler job failures
- Queue backups (if using Bull)

Example with logging:

```javascript
// Add to notification service
export async function sendPushNotification(
  pushToken: string,
  notification: NotificationData
): Promise<{ success: boolean; error?: string }> {
  try {
    // ... send logic ...

    // Log success
    await db.query(`
      INSERT INTO notification_logs (user_id, type, status, sent_at)
      VALUES ($1, $2, 'sent', NOW())
    `, [userId, 'daily_reminder']);

    return { success: true };
  } catch (error) {
    // Log failure
    await db.query(`
      INSERT INTO notification_logs (user_id, type, status, error, sent_at)
      VALUES ($1, $2, 'failed', $3, NOW())
    `, [userId, 'daily_reminder', error.message]);

    return { success: false, error: error.message };
  }
}
```

---

## 8. Deployment Checklist

- [ ] Database migrations applied (push_tokens table, notification columns)
- [ ] `/api/users/push-token` endpoint deployed
- [ ] Expo Server SDK installed (`expo-server-sdk`)
- [ ] Notification service implemented
- [ ] Scheduler configured (cron or queue)
- [ ] Tested on physical devices
- [ ] Error handling in place (invalid tokens, failures)
- [ ] Monitoring/logging configured
- [ ] Rate limiting considered
- [ ] Timezone handling determined
- [ ] Privacy policy updated (mention push notifications)

---

## Next Steps

1. Implement the database schema changes
2. Add the `/api/users/push-token` endpoint
3. Create the notification service with Expo SDK
4. Set up the scheduler (start with cron for simplicity)
5. Test with a physical device
6. Monitor logs and adjust as needed

For questions or issues, refer to:
- Expo Push Notifications: https://docs.expo.dev/push-notifications/overview/
- Expo Server SDK: https://github.com/expo/expo-server-sdk-node
