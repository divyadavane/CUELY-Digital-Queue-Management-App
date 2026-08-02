const express = require('express');
const cors = require('cors');
const fs = require('fs');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

const app = express();
const PORT = process.env.WHATSAPP_PORT || 3005;

app.use(cors());
app.use(express.json());

// Helper function to auto-detect installed Chrome / Edge on Windows
function findBrowserExecutable() {
  const candidates = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    (process.env.LOCALAPPDATA || '') + '\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  ];
  for (const executablePath of candidates) {
    if (executablePath && fs.existsSync(executablePath)) {
      return executablePath;
    }
  }
  return undefined;
}

const browserPath = findBrowserExecutable();
if (browserPath) {
  console.log(`🔍 Detected browser for WhatsApp Web: ${browserPath}`);
} else {
  console.log('ℹ️ Using default bundled Puppeteer Chromium...');
}

// Initialize WhatsApp Web Client with LocalAuth session persistence
const client = new Client({
  authStrategy: new LocalAuth({
    dataPath: './.wwebjs_auth'
  }),
  puppeteer: {
    headless: true,
    executablePath: browserPath,
    timeout: 60000,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--disable-gpu',
      '--disable-software-rasterizer'
    ]
  }
});

let isReady = false;
let clientStatus = 'INITIALIZING';

// QR Code Event
client.on('qr', (qr) => {
  clientStatus = 'QR_REQUIRED';
  console.log('\n======================================================');
  console.log('📱 SCAN THIS QR CODE WITH YOUR WHATSAPP (LINKED DEVICES):');
  console.log('======================================================\n');
  qrcode.generate(qr, { small: true });
  console.log('\n======================================================\n');
});

// Authenticated Event
client.on('authenticated', () => {
  clientStatus = 'AUTHENTICATED';
  isReady = true; // Force ready state early as a workaround for wwebjs sync bugs
  console.log('✅ WhatsApp session authenticated successfully! Session saved in ./.wwebjs_auth');
});

// Ready Event
client.on('ready', () => {
  isReady = true;
  clientStatus = 'READY';
  console.log('🚀 WhatsApp Web Client is READY! Connected & listening for outbound queue alerts.');
});

// Disconnected Event
client.on('disconnected', (reason) => {
  isReady = false;
  clientStatus = 'DISCONNECTED';
  console.warn('⚠️ WhatsApp client disconnected. Reason:', reason);
  console.log('🔄 Attempting to re-initialize WhatsApp client session...');
  client.initialize().catch((err) => console.error('Re-initialization error:', err));
});

// Auth Failure
client.on('auth_failure', (msg) => {
  clientStatus = 'AUTH_FAILURE';
  console.error('❌ WhatsApp authentication failed:', msg);
});

// ==========================================
// Rate-Limited Automatic Outbound Queue
// ==========================================
const messageQueue = [];
let isProcessingQueue = false;

async function processQueue() {
  if (isProcessingQueue || messageQueue.length === 0) return;
  isProcessingQueue = true;

  while (messageQueue.length > 0) {
    const task = messageQueue.shift();
    const { formattedPhone, textMessage, resolve, retries = 0 } = task;

    if (!isReady) {
      if (retries < 20) {
        console.log(`[Queue Delay] Client not ready yet. Retrying message to ${formattedPhone} in 3s... (Attempt ${retries + 1}/20)`);
        await new Promise((r) => setTimeout(r, 3000));
        messageQueue.unshift({ ...task, retries: retries + 1 });
        continue;
      } else {
        console.error(`[Queue Error] Failed to send to ${formattedPhone}: WhatsApp client not ready after retries.`);
        resolve({ success: false, error: 'WhatsApp client is not ready / authenticated yet' });
        continue;
      }
    }

    try {
      const cleanDigits = formattedPhone.replace(/\D/g, '');
      
      // Look up target WhatsApp registered number ID automatically
      let targetJid = `${cleanDigits}@c.us`;
      try {
        const numberId = await client.getNumberId(cleanDigits);
        if (numberId && numberId._serialized) {
          targetJid = numberId._serialized;
        }
      } catch (numErr) {
        console.warn(`[Number Lookup Warning] Using fallback format ${targetJid}:`, numErr?.message);
      }

      console.log(`[Automatic WhatsApp Sending] To: ${targetJid}`);
      await client.sendMessage(targetJid, textMessage);
      console.log(`[Automatic WhatsApp Delivered] Successfully sent to ${formattedPhone}`);
      resolve({ success: true, to: formattedPhone });
    } catch (err) {
      console.error(`[Automatic WhatsApp Send Failed] To: ${formattedPhone}, Error:`, err?.message || err);
      resolve({ success: false, error: err?.message || 'Failed to send automatic WhatsApp message' });
    }

    // Rate Limiter: Space out messages by 2 seconds to ensure 100% reliable background delivery
    await new Promise((r) => setTimeout(r, 2000));
  }

  isProcessingQueue = false;
}

// Function to queue an automatic WhatsApp message
function sendWhatsAppMessage(phoneNumber, message) {
  return new Promise((resolve, reject) => {
    let cleanNumber = phoneNumber.trim().replace(/\D/g, '');
    
    // Auto-format 10 digit Indian number
    if (cleanNumber.length === 10 && /^[6-9]/.test(cleanNumber)) {
      cleanNumber = '91' + cleanNumber;
    }
    // Auto-format 10 digit US number
    if (cleanNumber.length === 10 && /^[2-5]/.test(cleanNumber)) {
      cleanNumber = '1' + cleanNumber;
    }

    messageQueue.push({
      formattedPhone: cleanNumber,
      textMessage: message,
      resolve,
      reject
    });

    processQueue();
  });
}

// ==========================================
// Express API Endpoints
// ==========================================

// GET /api/status - Check WhatsApp connection status
app.get('/api/status', (req, res) => {
  res.json({
    success: true,
    connected: isReady,
    status: clientStatus,
    queueLength: messageQueue.length
  });
});

// POST /api/notify-token - Automatic Queue Notification Endpoint
app.post('/api/notify-token', async (req, res) => {
  try {
    const { phoneNumber, tokenNumber, clinicName, status, roomNumber, waitTime, message: customMessage } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({ success: false, error: 'phoneNumber is required' });
    }

    const clinic = clinicName || 'Sunrise Clinic';
    const token = tokenNumber || 'Token';
    let textMessage = customMessage;

    if (!textMessage) {
      if (status === 'waiting' || status === 'joined') {
        textMessage = `Hi! Your token ${token} at ${clinic} has been generated. Estimated wait: ${waitTime || '5 mins'}. We will update you when your turn is close.`;
      } else if (status === 'called') {
        textMessage = `TOKEN ${token}! Please proceed to ${roomNumber || 'Room/Desk 1'} now. Your turn has arrived at ${clinic}.`;
      } else if (status === 'almost_there') {
        textMessage = `Almost your turn! Token ${token} is next in line at ${clinic}. Please head to the waiting area.`;
      } else {
        textMessage = `Update for Token ${token} at ${clinic}: Your queue status has been updated.`;
      }
    }

    // Queue automatic WhatsApp background message
    const result = await sendWhatsAppMessage(phoneNumber, textMessage);
    return res.json(result);
  } catch (err) {
    console.error('API Error in /api/notify-token:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Start Express Server & Initialize WhatsApp Client
app.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`🟢 Automatic WhatsApp Service Server listening on http://localhost:${PORT}`);
  console.log(`======================================================\n`);
  
  console.log('🔄 Initializing whatsapp-web.js client...');
  client.initialize().catch((err) => console.error('Client init error:', err));
});
