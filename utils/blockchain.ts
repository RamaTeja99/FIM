import { SimulatedTPM } from './tpm';
import crypto from 'crypto';

interface Node {
  id: number;
  tpm: SimulatedTPM;
  prepareMessages: Map<string, boolean>;
  commitMessages: Map<string, boolean>;
}

export class Blockchain {
  private nodes: Node[] = [];
  private chain: any[] = [];
  private currentBlock: { hash: string; signature: string } | null = null;

  constructor(nodeCount: number = 4) {
    // Initialize nodes with independent TPM instances
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
      const hash = crypto.createHash('sha512').update(file).digest('hex');
      const primaryNode = this.nodes[0];
      
      // PBFT Consensus Process
      const signature = primaryNode.tpm.sign(hash);
      this.currentBlock = { hash, signature };

      // Phase 1: Pre-Prepare
      if (!this.validatePrePrepare(primaryNode)) {
        return { valid: false, error: "Pre-prepare phase failed: Invalid primary node signature" };
      }

      // Phase 2: Prepare
      const prepareValid = await this.collectPrepareMessages();
      if (!prepareValid) {
        return { valid: false, error: "Prepare phase failed: Insufficient node approvals" };
      }

      // Phase 3: Commit
      const commitValid = await this.collectCommitMessages();
      if (!commitValid) {
        return { valid: false, error: "Commit phase failed: Insufficient node commitments" };
      }

      // Add block to chain
      this.chain.push({
        hash,
        signature,
        timestamp: Date.now(),
        approvals: this.getApprovalCounts()
      });

      return { valid: true };

    } catch (error) {
      return { valid: false, error: error instanceof Error ? error.message : 'Unknown consensus error' };
    }
  }

  private validatePrePrepare(primaryNode: Node): boolean {
    if (!this.currentBlock) return false;
    return primaryNode.tpm.verify(this.currentBlock.hash, this.currentBlock.signature);
  }

  private async collectPrepareMessages(): Promise<boolean> {
    if (!this.currentBlock) return false;

    await Promise.all(this.nodes.map(async (node) => {
      const isValid = node.tpm.verify(this.currentBlock!.hash, this.currentBlock!.signature);
      node.prepareMessages.set(this.currentBlock!.hash, isValid);
    }));

    return this.countApprovals('prepare') >= this.requiredQuorum;
  }

  private async collectCommitMessages(): Promise<boolean> {
    if (!this.currentBlock) return false;

    await Promise.all(this.nodes.map(async (node) => {
      node.commitMessages.set(this.currentBlock!.hash, true);
    }));

    return this.countApprovals('commit') >= this.requiredQuorum;
  }

  private get requiredQuorum(): number {
    return Math.floor((2 * this.nodes.length) / 3) + 1;
  }

  private countApprovals(phase: 'prepare' | 'commit'): number {
    return this.nodes.reduce((count, node) => {
      const messages = phase === 'prepare' ? node.prepareMessages : node.commitMessages;
      return count + (messages.get(this.currentBlock?.hash || '') ? 1 : 0);
    }, 0);
  }

  private getApprovalCounts() {
    return {
      prepare: this.countApprovals('prepare'),
      commit: this.countApprovals('commit'),
      totalNodes: this.nodes.length
    };
  }

  getChain() {
    return this.chain;
  }

  getNodeCount() {
    return this.nodes.length;
  }
}