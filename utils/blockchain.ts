import { SimulatedTPM } from './tpm';
import crypto from 'crypto';
interface Node {
  id: number;
  tpm: SimulatedTPM;
  prepareMessages: Map<string, boolean>;
  commitMessages: Map<string, boolean>;
}

export class PBFTBlockchain {
  private nodes: Node[] = [];
  private chain: any[] = [];

  constructor(nodeCount: number = 4) {
    for (let i = 0; i < nodeCount; i++) {
      this.nodes.push({
        id: i,
        tpm: new SimulatedTPM(),
        prepareMessages: new Map(),
        commitMessages: new Map()
      });
    }
  }

  async addBlock(file: Buffer): Promise<{ valid: boolean; error?: string }> {
    try {
      const primary = this.nodes[0];
      const hash = crypto.createHash('sha512').update(file).digest('hex');
      const signature = primary.tpm.sign(hash);

      // PBFT Consensus
      const prePrepareValid = this.validatePrePrepare(hash, signature, primary);
      if (!prePrepareValid) {
        return { valid: false, error: "Pre-prepare phase failed" };
      }

      const prepareValid = await this.preparePhase(hash, signature);
      if (!prepareValid) {
        return { valid: false, error: "Prepare phase failed" };
      }

      const commitValid = await this.commitPhase(hash);
      if (!commitValid) {
        return { valid: false, error: "Commit phase failed" };
      }

      this.chain.push({ hash, signature, timestamp: Date.now() });
      return { valid: true };
    } catch (error) {
      return { valid: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  private validatePrePrepare(hash: string, signature: string, primary: Node): boolean {
    return primary.tpm.verify(hash, signature);
  }

  private async preparePhase(hash: string, signature: string): Promise<boolean> {
    const promises = this.nodes.map(async (node) => {
      const isValid = node.tpm.verify(hash, signature);
      node.prepareMessages.set(hash, isValid);
    });
    
    await Promise.all(promises);
    return this.countApprovals(hash, 'prepare') >= this.requiredQuorum;
  }

  private async commitPhase(hash: string): Promise<boolean> {
    const promises = this.nodes.map(async (node) => {
      node.commitMessages.set(hash, true);
    });
    
    await Promise.all(promises);
    return this.countApprovals(hash, 'commit') >= this.requiredQuorum;
  }

  private get requiredQuorum(): number {
    return Math.floor((2 * this.nodes.length) / 3) + 1;
  }

  private countApprovals(hash: string, phase: 'prepare' | 'commit'): number {
    return this.nodes.filter(node => 
      phase === 'prepare' 
        ? node.prepareMessages.get(hash)
        : node.commitMessages.get(hash)
    ).length;
  }

  getChain() {
    return this.chain;
  }
}