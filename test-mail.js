// test-mail.js
import 'dotenv/config';
import { sendConfirmationEmail } from './server/utils/mailer.js';

const testMail = async () => {
  // Log environment variables (without exposing full password)
  console.log('Environment check:', {
    EMAIL_USER: process.env.EMAIL_USER,
    EMAIL_PASS_LENGTH: process.env.EMAIL_PASS?.length || 0
  });
  try {
    console.log('Starting mail test...');
    // Replace with your test email
    await sendConfirmationEmail('aboudayassin28@gmail.com', 'test-token-123');
    console.log('Test email sent successfully!');
  } catch (err) {
    console.error('Failed to send test email:', err);
    if (err.code === 'EAUTH') {
      console.error('Authentication failed. Check your Gmail App Password and make sure:');
      console.error('1. 2-Step Verification is enabled on your Google Account');
      console.error('2. The App Password is correctly copied to EMAIL_PASS');
      console.error('3. EMAIL_USER matches the Gmail account where you generated the App Password');
    }
  }
};

testMail().catch(console.error);