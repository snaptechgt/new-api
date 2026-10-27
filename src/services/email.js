import dotenv from 'dotenv';

dotenv.config();

// AgentMail SDK - use official agentmail npm package
// https://www.npmjs.com/package/agentmail
// Docs: https://github.com/agentmail-to/agentmail-node

// Initialize AgentMail SDK client (server-side only)
// The API key must NOT be exposed to browser code
let agentMailClient;
let initError = null;

// Try to initialize AgentMail SDK client
try {
  const agentmail = require('agentmail');
  const key = process.env.AGENTMAIL_API_KEY;

  if (!key) {
    initError = new Error('AGENTMAIL_API_KEY environment variable is not set');
    console.error('❌ AgentMail SDK init error: AGENTMAIL_API_KEY not configured');
  } else if (key.startsWith('am_') || key.length > 10) {
    // Looks like a valid AgentMail key format
    agentMailClient = agentmail(key);
    console.log('✅ AgentMail SDK client initialized');
  } else {
    initError = new Error('AGENTMAIL_API_KEY appears invalid: ' + key.substring(0, 10) + '...');
    console.error('❌ AgentMail SDK init error: Invalid API key format', key.substring(0, 10) + '...');
  }
} catch (error) {
  initError = error;
  console.error('❌ AgentMail SDK initialization error:', error);
  agentMailClient = null;
}

// Check if AgentMail SDK is initialized
function isAgentMailReady() {
  return agentMailClient !== null;
}

// Get the initialization error if any
function getInitError() {
  return initError;
}

// Send newsletter/email via AgentMail SDK (server-side only)
// This must be called from a backend endpoint, NOT from the browser.
// The AGENTMAIL_API_KEY stays on the server.
// Free tier: 3,000 emails/month, 100/day, NO domain verification required
// API Docs: https://github.com/agentmail-to/agentmail-node

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
    const errMsg = 'AgentMail SDK client not initialized. ' + (getInitError()?.message || 'Missing AGENTMAIL_API_KEY');
    console.error('❌', errMsg);
    return { success: false, error: errMsg };
  }

  try {
    // Use AgentMail SDK to send email
    // The SDK handles the correct API endpoint and method
    const result = await agentMailClient.send({ from: email.from, to: email.to, subject: email.subject, html: email.html });
    console.log('✅ AgentMail SDK send result:', result);

    if (result && result.success) {
      return { success: true, data: result };
    } else {
      const errMsg = result?.error || 'Unknown error from AgentMail SDK';
      console.error('❌ AgentMail SDK error:', errMsg);
      return { success: false, error: errMsg };
    }
  } catch (err) {
    console.error('❌ Error sending email via AgentMail SDK:', err);
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
