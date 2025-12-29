import { ToolAction } from '@mastra/core/tools';
import { z } from 'zod';

export function createVectorQueryTool({
    vectorStoreName,
    vectorStore,
    options,
}: {
    vectorStoreName: string;
    vectorStore: any;
    options: {
        model: any;
        topK?: number;
    };
}) {
    return {
        id: `recallPastMetrics`,
        name: `recallPastMetrics`,
        description: `Recall past metrics from the ${vectorStoreName} vector store`,
        inputSchema: z.object({
            query: z.string().describe('The query to search for in past metrics'),
        }),
        outputSchema: z.object({
            results: z.array(
                z.object({
                    score: z.number(),
                    metadata: z.record(z.any()),
                    content: z.string(),
                })
            ),
        }),
        execute: async (args: any) => {
            // Robustly extract query from either direct args (Agent Tool) or context (Workflow Step)
            const query = args?.query || args?.context?.query;

            if (!query) {
                throw new Error(`Invalid arguments passed to recallPastMetrics. Expected { query: string } or { context: { query: string } }. Received keys: ${Object.keys(args || {})}`);
            }

            // Generate embedding for the query
            // Assuming options.model has a simulate or direct embedding method, 
            // but typically we use the vector store's query method if it handles embedding,
            // OR we generate embedding first.

            // Mastra LibSQLVector query() expects result from an embedder usually? 
            // Or does it take a vector?
            // LibSQLVector.query({ queryVector, ... })

            // We need to generate the vector using the model.
            // @ai-sdk/google model.

            // Let's assume we can use the model to embed.
            // ai-sdk embed/embedMany.
            // import { embed } from 'ai';

            // Quick fix: Since I don't want to add imports I can't check, 
            // I will assume the user has 'ai' or I can use the model's interface if Mastra wraps it.

            // Actually, let's just make a simple wrapper that calls vectorStore.query
            // The calling agent probably provides the vector? No, the tool must do it.

            // Note: The user snippet used createVectorQueryTool which implies it handles embedding.
            // For this manual impl, I'll assume usage of the 'ai' library if available.

            // Re-checking imports... 'ai' is in dependencies.

            const { embed } = require('ai');

            const { embedding } = await embed({
                model: options.model,
                value: query,
            });

            const results = await vectorStore.query({
                indexName: vectorStoreName,
                queryVector: embedding,
                topK: options.topK || 3,
            });

            const resultsWithContent = results.map((r: any) => ({
                ...r,
                content: typeof r.metadata?.analysis === 'string' ? r.metadata.analysis : JSON.stringify(r.metadata?.analysis || r.metadata || {}),
            }));

            return { results: resultsWithContent };
        },
    } as ToolAction<any, any, any, any>;
}
