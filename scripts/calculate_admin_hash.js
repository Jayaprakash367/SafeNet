const crypto = require('crypto');

const password = 'admin123';
const salt = 'safenet-disaster-salt';

const hash = crypto.createHash('sha256').update(password + salt).digest('hex');

console.log(`Password: ${password}`);
console.log(`Salt: ${salt}`);
console.log(`Hash: ${hash}`);
