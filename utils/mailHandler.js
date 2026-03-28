require('dotenv').config();
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.MAILTRAP_HOST || 'sandbox.smtp.mailtrap.io',
  port: parseInt(process.env.MAILTRAP_PORT) || 2525,
  auth: {
    user: process.env.MAILTRAP_USER,
    pass: process.env.MAILTRAP_PASS,
  },
});

async function sendWelcomeEmail(username, email, password) {
  await transporter.sendMail({
    from: process.env.MAIL_FROM || 'noreply@haha.com',
    to: email,
    subject: 'Your account has been created',
    html: `
      <h2>Welcome, ${username}!</h2>
      <p>Your account has been created. Here are your login credentials:</p>
      <table style="border-collapse:collapse;">
        <tr><td style="padding:4px 12px;"><b>Username:</b></td><td>${username}</td></tr>
        <tr><td style="padding:4px 12px;"><b>Email:</b></td><td>${email}</td></tr>
        <tr><td style="padding:4px 12px;"><b>Password:</b></td><td>${password}</td></tr>
      </table>
      <p>Please change your password after first login.</p>
    `,
  });
}

module.exports = { sendWelcomeEmail };
