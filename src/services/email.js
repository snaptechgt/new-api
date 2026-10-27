import dotenv from 'dotenv';

dotenv.config();

// AgentMail API - Free tier: 3,000 emails/month, 100/day, no domain verification required
// Free tier does not require verified domains like Resend
// API KEY must be set as environment variable AGENTMAIL_API_KEY
// Never expose this to browser code
let client;
let initError = null;

// Try to initialize AgentMail client
try {
  const key = process.env.AGENTMAIL_API_KEY;

  if (!key) {
    initError = new Error('AGENTMAIL_API_KEY environment variable is not set');
    console.error('AgentMail init error: AGENTMAIL_API_KEY not configured');
  } else if (key.startsWith('am_') || key.length > 10) {
    // Looks like a valid AgentMail key format
    client = key;
  } else {
    initError = new Error('AGENTMAIL_API_KEY appears invalid: ' + key.substring(0, 10) + '...');
    console.error('AgentMail init error: Invalid API key format', key.substring(0, 10) + '...');
  }
} catch (error) {
  initError = error;
  console.error('AgentMail initialization error:', error);
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

/**
 * @param {object} email - Email details
 * @param {string} email.from - Sender address (e.g., 'no-reply@cfb.dashboard.com')
 * @param {string|string[]} email.to - Recipient email(s)
 * @param {string} email.subject - Email subject
 * @param {string} email.html - HTML email content
 * @returns {Promise<object>} - Result with success flag and data or error
 */
export async function sendEmail(email) {
  if (!isAgentMailReady()) {
    return { success: false, error: 'AgentMail client not initialized. ' + (getInitError()?.message || 'Missing AGENTMAIL_API_KEY') };
  }

  try {
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

    if (!result.ok) {
      return { success: false, data: null, error: data?.message || 'Error en API de AgentMail' };
    }

    return { success: true, data };
  } catch (err) {
    console.error('Error sending email via AgentMail:', err);
    return { success: false, data: null, error: err?.message || 'Error inesperado al enviar email' };
  }
}

// Wrapper for the Express route - validates input and calls sendEmail (does NOT send response)
// The routes.js handler is responsible for sending the response
export async function handler(req, res) {
  try {
    const { to, subject, html, from } = req.body;

    if (!to || !subject || !html || !from) {
      // Return error result without sending response (routes.js will handle it)
      return { success: false, error: 'Faltan campos obligatorios: to, subject, html, from' };
    }

    const result = await sendEmail({ from, to, subject, html });

    if (result.success) {
      return { success: true, data: result.data };
    } else {
      return { success: false, error: result.error };
    }
  } catch (error) {
    console.error('Error in email handler:', error);
    return { success: false, error: 'Error inesperado al enviar email' };
  }
}

export default { sendEmail, handler };
