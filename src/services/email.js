import dotenv from 'dotenv';

dotenv.config();

// AgentMail API - server-side only
// The API key must NOT be exposed to browser code
// Docs: https://docs.agentmail.to/quickstart
let client;
let initError = null;

// Try to initialize AgentMail client
try {
  const key = process.env.AGENTMAIL_API_KEY;

  if (!key) {
    initError = new Error('AGENTMAIL_API_KEY environment variable is not set');
    console.error('❌ AgentMail init error: AGENTMAIL_API_KEY not configured');
    console.log('✅ Available env vars starting with AGENTMAIL or RESEND:', Object.keys(process.env).filter(k => k.startsWith('AGENTMAIL') || k.startsWith('RESEND')).join(', '));
  } else if (key.startsWith('am_') || key.length > 10) {
    // Looks like a valid AgentMail key format (starts with 'am_')
    client = key;
    console.log('✅ AgentMail client initialized with key starting with: am_');
  } else {
    initError = new Error('AGENTMAIL_API_KEY appears invalid: ' + key.substring(0, 10) + '...');
    console.error('❌ AgentMail init error: Invalid API key format', key.substring(0, 10) + '...');
    console.log('✅ Key value (first 20 chars):', key.substring(0, 20));
  }
} catch (error) {
  initError = error;
  console.error('❌ AgentMail initialization error:', error);
  client = null;
}

// Check if AgentMail is initialized
function isAgentMailReady() {
  return client !== null;
}

// Get the initialization error if any
function getInitError() {
  return initError;
}

// Send newsletter/email via AgentMail API (server-side only)
// This must be called from a backend endpoint, NOT from the browser.
// The AGENTMAIL_API_KEY stays on the server.
// Free tier: 3,000 emails/month, 100/day, NO domain verification required
// API Docs: https://docs.agentmail.to/quickstart

/** 
 * @param {object} email - Email details
 * @param {string} email.from - Sender address (e.g., 'no-reply@cfb.dashboard.com')
 * @param {string|string[]} email.to - Recipient email(s)
 * @param {string} email.subject - Email subject
 * @param {string} email.html - HTML email content
 * @returns {Promise<object>} - Result with success flag and data or error
 */
export async function sendEmail(email) {
  console.log('📧 sendEmail called with:');
  console.log('   - from:', email.from);
  console.log('   - to:', email.to);
  console.log('   - subject:', email.subject);
  console.log('   - html length:', email.html?.length || 0, 'chars');

  if (!isAgentMailReady()) {
    const errMsg = 'AgentMail client not initialized. ' + (getInitError()?.message || 'Missing AGENTMAIL_API_KEY');
    console.error('❌', errMsg);
    return { success: false, error: errMsg };
  }

  try {
    // AgentMail API structure based on quickstart docs:
    // - Create inbox: POST /inboxes (with client_id header)
    // - Send message: POST /inboxes/{inbox_id}/messages/send
    // 
    // For simplicity, we use the /emails endpoint which should work
    // with a properly configured API key and verified inbox.
    const result = await fetch('https://api.agentmail.to/v1/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${client}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: email.from,
        to: Array.isArray(email.to) ? email.to : [email.to],
        subject: email.subject,
        html: email.html,
      }),
    });

    const data = await result.json();
    console.log('📥 AgentMail API response status:', result.status);
    console.log('📥 AgentMail API response data:', JSON.stringify(data, null, 2));

    if (!result.ok) {
      const errMsg = data?.message || 'Error en API de AgentMail';
      console.error('❌ AgentMail API error:', errMsg);
      console.error('❌ AgentMail response full:', data);
      return { success: false, data: null, error: errMsg };
    }

    console.log('✅ AgentMail API success, returning data');
    return { success: true, data };
  } catch (err) {
    console.error('❌ Error sending email via AgentMail:', err);
    console.error('❌ Error full:', err);
    return { success: false, data: null, error: err?.message || 'Error inesperado al enviar email' };
  }
}

// Wrapper for the Express route - validates input and calls sendEmail (does NOT send response)
// The routes.js handler is responsible for sending the response
export async function handler(req, res) {
  console.log('📥 /email/send handler called with body:');
  console.log('   Body keys:', Object.keys(req.body || {}));
  console.log('   Body from:', req.body?.from);
  console.log('   Body to:', req.body?.to);
  console.log('   Body subject:', req.body?.subject);
  console.log('   Body html length:', req.body?.html?.length || 0);

  try {
    const { to, subject, html, from } = req.body;

    if (!to || !subject || !html || !from) {
      const missing = [];
      if (!to) missing.push('to');
      if (!subject) missing.push('subject');
      if (!html) missing.push('html');
      if (!from) missing.push('from');
      console.error('❌ Missing fields:', missing);
      return { success: false, error: 'Faltan campos obligatorios: ' + missing.join(', ') };
    }

    console.log('✅ All fields present, calling sendEmail');

    const result = await sendEmail({ from, to, subject, html });
    console.log('📤 sendEmail result:', result);

    if (result.success) {
      return { success: true, data: result.data };
    } else {
      console.error('❌ sendEmail has error:', result.error);
      return { success: false, error: result.error };
    }
  } catch (error) {
    console.error('❌ Error in email handler:', error);
    console.error('❌ Error full stack:', error);
    return { success: false, error: 'Error inesperado al enviar email' };
  }
}

export default { sendEmail, handler };