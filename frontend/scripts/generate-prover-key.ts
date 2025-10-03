/**
 * Generate Prover Keypair
 *
 * This script generates a new ECDSA keypair for the prover service.
 * The private key will be stored in .env.local (server-side only)
 * The public key will be stored in the verifier contract
 */

import { ec, encode } from 'starknet';
import * as fs from 'fs';
import * as path from 'path';

// Generate new keypair
const privateKeyBytes = ec.starkCurve.utils.randomPrivateKey();
const privateKey = '0x' + encode.buf2hex(privateKeyBytes);
const publicKey = ec.starkCurve.getStarkKey(privateKey);

console.log('🔐 Generated Prover Keypair\n');
console.log('Private Key (keep secret!):', privateKey);
console.log('Public Key (store in contract):', publicKey);
console.log('');

// Update .env.local
const envPath = path.join(__dirname, '..', '.env.local');
let envContent = '';

if (fs.existsSync(envPath)) {
  envContent = fs.readFileSync(envPath, 'utf-8');

  // Replace existing PROVER_PRIVATE_KEY or add new one
  if (envContent.includes('PROVER_PRIVATE_KEY=')) {
    envContent = envContent.replace(
      /PROVER_PRIVATE_KEY=.*/,
      `PROVER_PRIVATE_KEY=${privateKey}`
    );
  } else {
    envContent += `\nPROVER_PRIVATE_KEY=${privateKey}\n`;
  }

  // Replace existing PROVER_PUBLIC_KEY or add new one
  if (envContent.includes('PROVER_PUBLIC_KEY=')) {
    envContent = envContent.replace(
      /PROVER_PUBLIC_KEY=.*/,
      `PROVER_PUBLIC_KEY=${publicKey}`
    );
  } else {
    envContent += `PROVER_PUBLIC_KEY=${publicKey}\n`;
  }
} else {
  envContent = `PROVER_PRIVATE_KEY=${privateKey}\nPROVER_PUBLIC_KEY=${publicKey}\n`;
}

fs.writeFileSync(envPath, envContent);

console.log('✅ Saved to .env.local');
console.log('');
console.log('📝 Next steps:');
console.log('1. Deploy contracts with: cd ../cairo-contracts && bash deploy.sh');
console.log('2. Set prover public key in contract: sozo execute dojo_starter-stark_age_verifier set_prover_pubkey ' + publicKey);
console.log('');
