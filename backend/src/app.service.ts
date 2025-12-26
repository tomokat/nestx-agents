import { Injectable } from '@nestjs/common';
import * as os from 'os';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello World!';
  }

  async getSystemHealth() {
    return this.getRealSystemHealth();
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
        cpu: {
          usagePercentage: '10%' // Mock value as os.cpus() doesn't give load directly
        },
        memory: {
          total: os.totalmem().toString(),
          free: os.freemem().toString(),
          usagePercentage: (((os.totalmem() - os.freemem()) / os.totalmem()) * 100).toFixed(2) + '%'
        },
        loadAverage: os.loadavg(),
        uptime: os.uptime(),
        cpus: os.cpus().length,
      }
    };
  }
}
