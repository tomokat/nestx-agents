import { MockMemory } from '@mastra/core/memory';

export class Memory extends MockMemory {
    constructor(config: { vector?: any; embedder?: any; options?: any } = {}) {
        super();
        if (config.vector) {
            this.vector = config.vector;
        }
        if (config.embedder) {
            this.embedder = config.embedder;
        }
        // We can handle config.options if needed, but MockMemory defaults are usually fine for now.
        // Ideally we would set storage here if we had access to the main store.
    }
}
