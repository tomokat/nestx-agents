import { Agent } from '@mastra/core';
import { google } from '@ai-sdk/google';
import { systemHealthTool } from '../tools/system-health';

export const systemAnalystAgent = new Agent({
    name: 'System Analyst',
    instructions: 'You are a system analyst responsible for monitoring system health. ' +
        'When asked to analyze the system, use the systemHealthTool to gather metrics ' +
        'and provide a concise summary of the system status, highlighting any anomalies or performance issues. ' +
        'Format your response using HTML tags suitable for embedding in a notification card (e.g., using <strong>, <ul>, <li>). ' +
        'Keep it professional but concise.',
    model: google('gemini-1.5-flash'),
    tools: {
        systemHealth: systemHealthTool,
    },
});
