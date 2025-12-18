import { Controller, Get, Render } from '@nestjs/common';

@Controller('dashboard')
export class DashboardController {
    @Get()
    @Render('index')
    root() {
        return { title: 'Hypermedia Island' };
    }
}
