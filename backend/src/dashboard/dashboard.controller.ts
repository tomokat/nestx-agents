import { Controller, Get, Post, Render, Body, Query, Sse, Inject } from '@nestjs/common';
import { Mastra } from '@mastra/core';
import { LibSQLStore } from '@mastra/libsql';
import { map, from } from 'rxjs';

// Simple in-memory state for demonstration
let taskState = {
    isRunning: false,
    progress: 0,
    currentBatch: 0,
    totalBatches: 10
};

@Controller('dashboard')
export class DashboardController {
    constructor(@Inject('MASTRA') private readonly mastra: Mastra) { }

    @Sse('system-watchdog/stream')
    async streamSystemWatchdog() {
        const workflow = this.mastra.getWorkflow('systemWatchdog') as any;
        if (!workflow) {
            throw new Error('Workflow systemWatchdog not found');
        }

        // Using createRun to ensure we have a valid run context
        const run = await workflow.createRun({
            threadId: 'system-monitor-thread',
            resourceId: 'system-monitor'
        });

        // Use standard run stream
        const stream = await run.stream();

        return map((event) => ({ data: event }))(from(stream));
    }

    @Post('tasks/start')
    @Render('task-status')
    startTask() {
        if (!taskState.isRunning) {
            taskState.isRunning = true;
            taskState.progress = 0;
            taskState.currentBatch = 0;

            // Simulate background task
            const interval = setInterval(() => {
                taskState.currentBatch++;
                taskState.progress = Math.round((taskState.currentBatch / taskState.totalBatches) * 100);

                if (taskState.currentBatch >= taskState.totalBatches) {
                    clearInterval(interval);
                    taskState.isRunning = false;
                }
            }, 1000);
        }
        return { ...taskState, layout: false };
    }

    @Get('tasks/status')
    @Render('task-status')
    getTaskStatus() {
        return { ...taskState, layout: false };
    }

    @Get('missions/search')
    @Render('missions-rows')
    searchMissions(@Query('q') query: string) {
        const allMissions = [
            { name: 'Alpha Protocol', status: 'Active', agent: 'Agent 007' },
            { name: 'Beta Directive', status: 'Pending', agent: 'Agent 99' },
            { name: 'Gamma Ray', status: 'Completed', agent: 'Agent J' },
            { name: 'Delta Force', status: 'Active', agent: 'Agent 47' },
            { name: 'Omega Plan', status: 'Failed', agent: 'Agent Smith' },
        ];

        const q = (query || '').toLowerCase();
        const filtered = allMissions.filter(m =>
            m.name.toLowerCase().includes(q) ||
            m.agent.toLowerCase().includes(q)
        );

        return { missions: filtered, layout: false };
    }

    @Get()
    @Render('index')
    root() {
        return { title: 'Hypermedia Island' };
    }

    @Get('metrics')
    @Render('metrics')
    getMetrics() {
        return {
            cpuUsage: Math.floor(Math.random() * 100),
            memoryUsage: Math.floor(Math.random() * 1024),
            uptime: Math.floor(process.uptime()),
            layout: false // Important: Do not render the full layout
        };
    }

    @Get('history')
    @Render('history')
    async getHistory() {
        let store = (this.mastra as any).storage;
        let rows = [];

        try {
            // Attempt to query the vector table directly via the storage client
            // We need to access the underlying LibSQL client
            // @ts-ignore - bypassing protected/private access if needed or just untyped prop
            let client = store?.client || store?.db;

            // FALLBACK: If injection failed to give us a working client, create a local connection
            if (!client) {
                console.warn('⚠️ Main storage client missing. attempting fallback connection...');
                try {
                    const fallbackStore = new LibSQLStore({
                        url: 'file:mastra.db',
                        id: 'fallback_history_store'
                    });
                    await fallbackStore.init();
                    // @ts-ignore
                    client = fallbackStore.client || fallbackStore.db;
                    console.log('✅ Fallback connection established');
                } catch (fbErr) {
                    console.error('❌ Fallback connection failed:', fbErr);
                }
            }

            if (client) {
                const result = await client.execute('SELECT metadata FROM system_memory ORDER BY id DESC LIMIT 10');

                rows = result.rows.map((row: any) => {
                    try {
                        // row might be an array [jsonString] or an object { metadata: jsonString }
                        // LibSQL client typically returns arrays for values
                        let rawMeta = row;
                        if (Array.isArray(row)) {
                            rawMeta = row[0];
                        } else if (row && typeof row === 'object' && 'metadata' in row) {
                            rawMeta = row.metadata;
                        }

                        const meta = typeof rawMeta === 'string' ? JSON.parse(rawMeta) : rawMeta;

                        // Sanity check on parsed object
                        if (!meta || typeof meta !== 'object') {
                            return {
                                timestamp: 'Invalid Data',
                                analysis_short: 'Error',
                                analysis_html: 'Metadata is not an object'
                            };
                        }

                        return {
                            timestamp: meta.timestamp ? new Date(meta.timestamp).toLocaleString() : 'Just now',
                            analysis_short: 'Analysis Log',
                            analysis_html: meta.content || meta.analysis || '<em>No content available</em>' // Use content or analysis
                        };
                    } catch (e) {
                        console.error('Error parsing row metadata', e);
                        return {
                            timestamp: 'Parse Error',
                            analysis_short: 'Error',
                            analysis_html: 'Invalid metadata format'
                        };
                    }
                });
            } else {
                console.error('❌ CRITICAL: Could not obtain any storage client (Main or Fallback).');
            }
        } catch (error) {
            console.error('❌ Failed to fetch history:', error);
        }

        return { history: rows, layout: false };
    }
}
