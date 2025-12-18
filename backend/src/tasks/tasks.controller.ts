import { Controller, Get, Header } from '@nestjs/common';

@Controller('api/tasks')
export class TasksController {
    @Get('partial')
    @Header('Content-Type', 'text/html')
    getPartial() {
        const statuses = ['success', 'error', 'neutral'];
        const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
        const message = randomStatus === 'success' ? 'All Good' : randomStatus === 'error' ? 'Critical Failure' : 'Standby';

        return `<my-status-badge type="${randomStatus}">${message}</my-status-badge>`;
    }
}
