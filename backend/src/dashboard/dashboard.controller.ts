import { Controller, Get, Post, Render, Body, Query, Sse, Inject } from '@nestjs/common';
import { Mastra } from '@mastra/core';
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
}
