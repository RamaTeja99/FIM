import crypto from 'crypto';

export class SimulatedTPM {
  private keyPair = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
  });

  sign(data: string): string {
    const signer = crypto.createSign('SHA512');
    signer.update(data);
    return signer.sign(this.keyPair.privateKey, 'base64');
  }

  verify(data: string, signature: string): boolean {
    const verifier = crypto.createVerify('SHA512');
    verifier.update(data);
    return verifier.verify(this.keyPair.publicKey, signature, 'base64');
  }
}