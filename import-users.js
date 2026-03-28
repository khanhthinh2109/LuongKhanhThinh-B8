require('dotenv').config();
const fs = require('fs');
const crypto = require('crypto');
const { parse } = require('csv-parse');
const { sendWelcomeEmail } = require('./utils/mailHandler');

const CSV_FILE = './users.csv';

function generatePassword(length = 16) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  const bytes = crypto.randomBytes(length);
  return Array.from(bytes)
    .map((b) => chars[b % chars.length])
    .join('');
}

async function readCSV(filePath) {
  return new Promise((resolve, reject) => {
    const results = [];
    fs.createReadStream(filePath)
      .pipe(parse({ columns: true, trim: true, skip_empty_lines: true }))
      .on('data', (row) => results.push(row))
      .on('end', () => resolve(results))
      .on('error', reject);
  });
}

async function importUsers() {
  const users = await readCSV(CSV_FILE);
  console.log(`Found ${users.length} users. Starting import...\n`);

  let success = 0;
  let failed = 0;

  for (const { username, email } of users) {
    const password = generatePassword();
    try {
      await sendWelcomeEmail(username, email, password);
      console.log(`✓ ${username} (${email})`);
      success++;
    } catch (err) {
      console.error(`✗ ${username} (${email}) — ${err.message}`);
      failed++;
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  console.log(`\nDone: ${success} success, ${failed} failed`);
}

importUsers().catch((err) => {
  console.error(err);
  process.exit(1);
});
