import nodemailer from "nodemailer";

// Configure your transporter (use environment variables for real credentials)
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // Use TLS
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  debug: true, // Enable debug logging
});

// Log environment check
console.log('Mailer ENV check:', {
  hasUser: !!process.env.EMAIL_USER,
  userLength: process.env.EMAIL_USER?.length,
  hasPass: !!process.env.EMAIL_PASS,
  passLength: process.env.EMAIL_PASS?.length
});

// Verify transporter configuration at startup to catch missing credentials early
transporter.verify().then(() => {
  console.log('✅ Mailer is configured (SMTP auth verified)');
}).catch(err => {
  console.error('Mailer verification failed. Check EMAIL_USER and EMAIL_PASS in .env and your SMTP provider settings.');
  console.error(err && err.message ? err.message : err);
});

export async function sendConfirmationEmail(to, token) {
  const confirmUrl = `${process.env.BASE_URL || "http://localhost:3000"}/api/auth/confirm/${token}`;
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject: "Confirm your email",
    html: `<p>Thank you for registering! Please confirm your email by clicking the link below:</p>
           <a href="${confirmUrl}">${confirmUrl}</a>`
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Confirmation email sent to', to, 'messageId=', info.messageId || '(no id)');
    return info;
  } catch (err) {
    // Re-throw with a clearer message for the signup flow
    console.error('Error sending confirmation email:', err && err.message ? err.message : err);
    throw new Error('Failed to send confirmation email. Check SMTP credentials and provider settings.');
  }
}

// New function to send 6-digit confirmation code
export async function sendConfirmationCode(to, code) {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
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
    const info = await transporter.sendMail(mailOptions);
    console.log('Confirmation code sent to', to, 'messageId=', info.messageId || '(no id)');
    return info;
  } catch (err) {
    console.error('Error sending confirmation code:', err && err.message ? err.message : err);
    throw new Error('Failed to send confirmation code. Check SMTP credentials and provider settings.');
  }
}
