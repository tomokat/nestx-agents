
import { LibSQLStore } from '@mastra/libsql';

async function main() {
    console.log('--- Debugging LibSQLStore ---');

    try {
        const store = new LibSQLStore({
            url: 'file:mastra.db',
            id: 'debug_store'
        });

        // Initialize (important!)
        await store.init();

        console.log('Store Keys:', Object.keys(store));

        // Check for client or db or execute
        const client = (store as any).client || (store as any).db;
        console.log('Has client/db property?', !!client);

        if (client) {
            console.log('Client Keys:', Object.keys(client));
        }

        // Try raw query
        if (client && client.execute) {
            console.log('Attempting execute via client...');
            const result = await client.execute('SELECT count(*) as count FROM system_memory');
            console.log('Count Result:', result);

            const rows = await client.execute('SELECT metadata FROM system_memory ORDER BY id DESC LIMIT 2');
            console.log('Rows Result:', JSON.stringify(rows, null, 2));
        } else {
            console.log('❌ No execute method found via client/db prop');
        }

    } catch (err) {
        console.error('Error:', err);
    }
}

main();
