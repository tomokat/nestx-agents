import { Agent } from '@mastra/core';
import { google } from '@ai-sdk/google';
import { ToolAction } from '@mastra/core';

export const createSystemAnalystAgent = (systemHealthTool: any) => new Agent({
    name: 'System Analyst',
    instructions: 'You are a system analyst responsible for monitoring system health. ' +
        'When asked to analyze the system, use the provided tools and data to gather metrics ' +
        'and provide a concise summary of the system status. ' +
        'Specifically, look for correlations between high CPU/memory usage and the top running processes. ' +
        'Also check if there is any network latency impact. ' +
        'Format your response using HTML tags suitable for embedding in a notification card (e.g., using <strong>, <ul>, <li>). ' +
        'Keep it professional but concise.',
    model: google('gemini-2.5-flash'),
    tools: {
        systemHealth: systemHealthTool,
    },
});
