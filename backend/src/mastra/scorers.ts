
export const systemReportScorer = {
    id: 'systemReportScorer',
    description: 'Scores the system report based on the presence of "Google Chrome" and "99%"',
    run: async (entry: any) => {
        const report = entry.output as string;

        if (!report) {
            return { score: 0, info: { reason: 'No report output' } };
        }

        const hasChrome = report.includes('Google Chrome');
        const has99Percent = report.includes('99%');

        if (hasChrome && has99Percent) {
            return { score: 1.0, info: { reason: 'Report contains both "Google Chrome" and "99%"' } };
        } else if (hasChrome || has99Percent) {
            return { score: 0.5, info: { reason: 'Report contains either "Google Chrome" or "99%"' } };
        } else {
            return { score: 0, info: { reason: 'Report contains neither "Google Chrome" nor "99%"' } };
        }
    },
    __registerMastra: (mastra: any) => {
        // No-op for now, satisfing the runtime check
        console.log('Scorer registered with Mastra');
    }
};
