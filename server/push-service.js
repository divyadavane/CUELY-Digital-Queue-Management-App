const express = require('express');
const cors = require('cors');
const webpush = require('web-push');

const app = express();
const PORT = process.env.PUSH_PORT || 3006;

app.use(cors());
app.use(express.json());

// Initialize Web Push with VAPID keys
// In production, these should be securely loaded from env variables
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || 'BPBPYM1X-Do5GmNNyFWyrsqc_JciIFKr_BN8b0FRRBSZc4TBM4vJVEUNhy8CMtCUv0rKPLM_lCmeFY_RS7Z39lI';
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || 'UQQSJ0XFa7Qkdiq221ovHTvK7TRUQeNNslPyPEhuQVg';

webpush.setVapidDetails(
  'mailto:hello@cuely.app', // Your contact email
  vapidPublicKey,
  vapidPrivateKey
);

// GET / - Root route to avoid "Cannot GET /"
app.get('/', (req, res) => {
  res.send('Cuely Push Service is running. Access the main app at http://localhost:3000');
});

// GET /api/status - Check Push service status
app.get('/api/status', (req, res) => {
  res.json({
    success: true,
    service: 'push-notifications',
    status: 'READY'
  });
});

// POST /api/notify-push - Trigger a push notification to a specific subscription
app.post('/api/notify-push', async (req, res) => {
  try {
    const { subscription, payload } = req.body;

    if (!subscription || !subscription.endpoint) {
      return res.status(400).json({ success: false, error: 'Valid subscription object is required' });
    }

    // Send the push notification
    await webpush.sendNotification(
      subscription,
      JSON.stringify(payload || { title: 'Cuely Update', body: 'Your queue status has been updated.' })
    );

    console.log(`[Push Delivered] Successfully sent to endpoint: ${subscription.endpoint.substring(0, 50)}...`);
    return res.json({ success: true });

  } catch (err) {
    if (err.statusCode === 410 || err.statusCode === 404) {
      console.warn(`[Push Error] Subscription has expired or is no longer valid (Status: ${err.statusCode})`);
      return res.status(410).json({ success: false, error: 'Subscription expired', expired: true });
    }
    
    console.error('[Push Send Failed]', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Start Express Server
app.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`📡 Web Push Service Server listening on http://localhost:${PORT}`);
  console.log(`======================================================\n`);
});
