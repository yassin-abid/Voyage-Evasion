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
