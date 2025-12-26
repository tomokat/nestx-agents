import { Agent } from '@mastra/core/agent';
import { google } from '@ai-sdk/google';
import { ToolAction } from '@mastra/core/tools';

export const createSystemAnalystAgent = (systemHealthTool: any) => new Agent({
    name: 'System Analyst',
    id: 'system-analyst',
    instructions: `You are a system analyst expert. Your job is to analyze system health metrics, network logs, and process data to identify bottlenecks and issues.
    When asked to analyze the system, use the provided tools and data to gather metrics and provide a concise summary of the system status.
    Specifically, look for correlations between high CPU/memory usage and the top running processes.
    Also check if there is any network latency impact.
    Format your response using HTML tags suitable for embedding in a notification card (e.g., using <strong>, <ul>, <li>).
    Keep it professional but concise.`,
    model: google('gemini-2.5-flash'),
    tools: {
        systemHealth: systemHealthTool,
    },
});
