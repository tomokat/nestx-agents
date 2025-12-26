
const { Mastra } = require('@mastra/core');
const { Agent } = require('@mastra/core/agent');
const { google } = require('@ai-sdk/google');
// Skip DefaultExporter import as we just need to inspect the agent structure

const agent = new Agent({
    name: 'test',
    model: google('gemini-1.5-flash'),
    instructions: 'test'
});

const mastra = new Mastra({
    agents: { test: agent },
    observability: {
        default: { enabled: true }
    }
});

const retrievedAgent = mastra.getAgent('test');
console.log('Agent keys:', Object.keys(retrievedAgent));
console.log('Prototype keys:', Object.getOwnPropertyNames(Object.getPrototypeOf(retrievedAgent)));
