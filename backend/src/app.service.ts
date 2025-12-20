import { Injectable } from '@nestjs/common';
import * as os from 'os';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello World!';
  }

  getRealSystemHealth() {
    return {
      status: 'operational',
      timestamp: new Date().toISOString(),
      system: {
        platform: os.platform(),
        release: os.release(),
        arch: os.arch(),
        hostname: os.hostname(),
      },
      resources: {
        memory: {
          total: os.totalmem(),
          free: os.freemem(),
          usagePercentage: (((os.totalmem() - os.freemem()) / os.totalmem()) * 100).toFixed(2) + '%'
        },
        loadAverage: os.loadavg(),
        uptime: os.uptime(),
        cpus: os.cpus().length,
      }
    };
  }
}
