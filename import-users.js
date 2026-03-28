require('dotenv').config();
const fs = require('fs');
const { parse } = require('csv-parse');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

const CSV_FILE = './users.csv';

const transporter = nodemailer.createTransport({
  host: process.env.MAILTRAP_HOST,
  port: process.env.MAILTRAP_PORT,
  auth: {
    user: process.env.MAILTRAP_USER,
    pass: process.env.MAILTRAP_PASS,
  },
});

function generatePassword(length = 16) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  const bytes = crypto.randomBytes(length);
  return Array.from(bytes)
    .map((b) => chars[b % chars.length])
    .join('');
}

async function sendWelcomeEmail(username, email, password) {
  await transporter.sendMail({
    from: process.env.MAIL_FROM,
    to: email,
    subject: 'Your account has been created',
    html: `
      <h2>Welcome, ${username}!</h2>
      <p>Your account has been created successfully.</p>
      <table>
        <tr><td><b>Username:</b></td><td>${username}</td></tr>
        <tr><td><b>Email:</b></td><td>${email}</td></tr>
        <tr><td><b>Password:</b></td><td>${password}</td></tr>
        <tr><td><b>Role:</b></td><td>user</td></tr>
      </table>
      <p>Please change your password after first login.</p>
    `,
  });
}

async function importUsers() {
  const users = await new Promise((resolve, reject) => {
    const results = [];
    fs.createReadStream(CSV_FILE)
      .pipe(parse({ columns: true, trim: true, skip_empty_lines: true }))
      .on('data', (row) => results.push(row))
      .on('end', () => resolve(results))
      .on('error', reject);
  });

  console.log(`Found ${users.length} users. Starting import...\n`);

  const results = [];

  for (const { username, email } of users) {
    const password = generatePassword();
    const user = { username, email, password, role: 'user' };

    try {
      await sendWelcomeEmail(username, email, password);
      console.log(`✓ ${username} (${email}) — email sent`);
      results.push({ ...user, status: 'success' });
    } catch (err) {
      console.error(`✗ ${username} (${email}) — failed: ${err.message}`);
      results.push({ ...user, status: 'failed', error: err.message });
    }
  }

  fs.writeFileSync('./users-output.json', JSON.stringify(results, null, 2));
  const success = results.filter((r) => r.status === 'success').length;
  const failed = results.filter((r) => r.status === 'failed').length;
  console.log(`\nDone: ${success} success, ${failed} failed`);
  console.log('Results saved to users-output.json');
}

importUsers().catch(console.error);
