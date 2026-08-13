import fs from 'fs';
const env = fs.readFileSync('.env', 'utf8');
const token = env.split('\n').find(line => line.startsWith('TELEGRAM_BOT_TOKEN=')).split('=')[1];
const url = 'https://api.telegram.org/bot' + token + '/getWebhookInfo';
const res = await fetch(url);
console.log(await res.json());
