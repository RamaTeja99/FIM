import crypto from 'crypto';
export class SimulatedTPM {
  private keyPair: crypto.KeyPairSyncResult<string, string>;

  constructor() {
    this.keyPair = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: {
        type: 'spki',
        format: 'pem'
      },
      privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem'
      }
    });
  }

  // Returns the public key for external verification if needed
  getPublicKey(): string {
    return this.keyPair.publicKey;
  }

  // Signs a string using SHA512 and returns a base64 signature
  sign(data: string): string {
    const signer = crypto.createSign('SHA512');
    signer.update(data);
    signer.end();
    return signer.sign(this.keyPair.privateKey, 'base64');
  }

  // Verifies a signature with the public key
  verify(data: string, signature: string): boolean {
    const verifier = crypto.createVerify('SHA512');
    verifier.update(data);
    verifier.end();
    return verifier.verify(this.keyPair.publicKey, signature, 'base64');
  }
}