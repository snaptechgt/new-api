import { Resend } from 'resend';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Resend client server-side only
// The API key must NOT be exposed to the browser
let resend;

try {
  resend = new Resend(process.env.RESEND_API_KEY);
} catch (error) {
  console.error('Resend initialization error:', error);
  resend = null;
}

/**
 * Send newsletter/email via Resend API (server-side only)
 * 
 * This must be called from a backend endpoint, NOT from the browser.
 * The RESEND_API_KEY stays on the server.
 * 
 * @param {object} email - Email details
 * @param {string} email.from - Sender address (e.g., 'Iglesia CFB <boletin@news.iglesiacfb.org>')
 * @param {string|string[]} email.to - Recipient email(s)
 * @param {string} email.subject - Email subject
 * @param {string} email.html - HTML email content
 * @returns {Promise<object>} - Result with success flag and data or error
 */
export async function sendEmail(email) {
  if (!resend) {
    return { success: false, error: 'Resend client not initialized - missing RESEND_API_KEY' };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: email.from,
      to: Array.isArray(email.to) ? email.to : [email.to],
      subject: email.subject,
      html: email.html,
    });

    if (error) {
      return { success: false, error: error.message || 'Error en API de Resend' };
    }

    return { success: true, data };
  } catch (err) {
    console.error('Error sending email via Resend:', err);
    return { success: false, error: err?.message || 'Error inesperado al enviar email' };
  }
}

/**
 * Wrapper for the Express route - validates input and calls sendEmail
 */
export async function handler(req, res) {
  try {
    const { to, subject, html, from } = req.body;

    if (!to || !subject || !html) {
      return res.status(400).json({ error: 'Faltan campos obligatorios: to, subject, html' });
    }

    const result = await sendEmail({ from, to, subject, html });

    if (result.success) {
      return res.json(result);
    } else {
      return res.status(500).json(result);
    }
  } catch (error) {
    console.error('Error in email handler:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}

export default { sendEmail, handler };
