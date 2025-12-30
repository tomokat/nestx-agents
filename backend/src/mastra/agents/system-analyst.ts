import { Agent } from '@mastra/core/agent';
import { google } from '@ai-sdk/google';
import { ToolAction } from '@mastra/core/tools';
import { createVectorQueryTool } from '../tools/vector-query';
import { Memory } from '../memory';

export const createSystemAnalystAgent = (systemHealthTool: any, vectorStore: any) => {
    const embeddingModel = google.embedding('text-embedding-004');

    return new Agent({
        name: 'systemWatchdog',
        id: 'systemWatchdog',
        instructions: `You are a system analyst expert. Your job is to analyze system health metrics, network logs, and process data to identify bottlenecks and issues.
    When asked to analyze the system, use the provided tools and data to gather metrics and provide a concise summary of the system status.
    Specifically, look for correlations between high CPU/memory usage and the top running processes.
    Also check if there is any network latency impact.
    Before giving a final analysis, use the recallPastMetrics tool to see if the current system state matches any past trends or issues.
    When searching memory, always look for the resource "system-monitor" to find historical system health trends.
    Your response will be rendered directly in a dashboard sidebar, so it must be a valid HTML fragment.
    Do NOT wrap the output in markdown code blocks (like html code fence). Just return the raw HTML string.
    Use proper HTML5 tags for structuring:
        - Use < ul > and<li> for lists of issues or metrics.
    - Use<strong> for emphasis.
    - Use < span class= "text-error" > for critical issues.
    - Use < span class= "text-success" > for good status.
    Your history is visible in the sidebar; use the recallPastMetrics tool to explain how the current state compares to those specific past events.
    Keep it professional but concise.`,
        model: google('gemini-2.5-flash'),
        tools: {
            systemHealth: systemHealthTool,
            recallPastMetrics: createVectorQueryTool({
                vectorStoreName: 'system_memory',
                vectorStore,
                options: {
                    model: embeddingModel,
                    topK: 3,
                },
            }),
        },
        memory: new Memory({
            vector: vectorStore,
            embedder: embeddingModel,
            options: {
                scope: 'resource',
                semanticRecall: {
                    topK: 3,
                    indexConfig: { indexName: 'system_memory' }
                }
            }
        })
    });
};
