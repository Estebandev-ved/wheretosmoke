import webpush from 'web-push';
import fs from 'fs';

const keys = webpush.generateVAPIDKeys();

fs.writeFileSync('public_key.txt', keys.publicKey);
fs.writeFileSync('private_key.txt', keys.privateKey);

console.log('Keys saved to files.');
