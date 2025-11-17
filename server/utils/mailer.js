import sgMail from '@sendgrid/mail';

// Configure SendGrid
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  console.log('✅ SendGrid API key configured');
} else {
  console.warn('⚠️  SENDGRID_API_KEY not set - email sending will fail');
}

// Verify from email is set
const fromEmail = process.env.SENDGRID_FROM_EMAIL || process.env.EMAIL_USER;
if (!fromEmail) {
  console.error('❌ SENDGRID_FROM_EMAIL or EMAIL_USER not set in environment variables');
} else {
  console.log('📧 Emails will be sent from:', fromEmail);
}

export async function sendConfirmationEmail(to, token) {
  const confirmUrl = `${process.env.BASE_URL || "http://localhost:3000"}/api/auth/confirm/${token}`;
  
  const msg = {
    to,
    from: fromEmail,
    subject: "Confirm your email - Voyage Évasion",
    html: `<p>Thank you for registering! Please confirm your email by clicking the link below:</p>
           <a href="${confirmUrl}">${confirmUrl}</a>`
  };

  try {
    const result = await sgMail.send(msg);
    console.log('Confirmation email sent to', to);
    return result;
  } catch (err) {
    console.error('Error sending confirmation email:', err.response?.body || err.message);
    throw new Error('Failed to send confirmation email.');
  }
}

// New function to send 6-digit confirmation code
export async function sendConfirmationCode(to, code) {
  const msg = {
    to,
    from: fromEmail,
    subject: "Voyage Évasion - Confirmation Code",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #4CAF50;">Welcome to Voyage Évasion!</h2>
        <p>Thank you for registering. Please use the following code to confirm your email address:</p>
        <div style="background-color: #f4f4f4; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;">
          <h1 style="color: #333; font-size: 36px; letter-spacing: 8px; margin: 0;">${code}</h1>
        </div>
        <p>This code will expire in <strong>15 minutes</strong>.</p>
        <p>If you didn't request this code, please ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
        <p style="color: #666; font-size: 12px;">Voyage Évasion - Your travel companion</p>
      </div>
    `
  };

  try {
    const result = await sgMail.send(msg);
    console.log('Confirmation code sent to', to);
    return result;
  } catch (err) {
    console.error('Error sending confirmation code:', err.response?.body || err.message);
    throw new Error('Failed to send confirmation code.');
  }
}
