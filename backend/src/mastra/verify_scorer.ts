
import { mastra } from './index';

async function verify() {
    console.log('Verifying Scorer Registration...');

    // @ts-ignore
    const scorer = mastra.getScorer ? mastra.getScorer('systemReportScorer') : mastra.scorers?.systemReportScorer;

    if (!scorer) {
        console.error('❌ Scorer not found via getScorer or scorers property');
        // Check if scorers is an array or object
        // @ts-ignore
        console.log('Mastra scorers config:', mastra.scorers);
        process.exit(1);
    }

    console.log('✅ Scorer found:', scorer.id);

    console.log('Running Scorer Test 1 (Success Case)...');
    const result1 = await scorer.run({
        output: 'System Report: Google Chrome usage is 99%.'
    });
    console.log('Result 1:', result1);

    if (result1.score === 1.0) {
        console.log('✅ Test 1 Passed');
    } else {
        console.error('❌ Test 1 Failed');
    }

    console.log('Running Scorer Test 2 (Partial Case)...');
    const result2 = await scorer.run({
        output: 'System Report: Google Chrome usage is high.'
    });
    console.log('Result 2:', result2);

    if (result2.score === 0.5) {
        console.log('✅ Test 2 Passed');
    } else {
        console.error('❌ Test 2 Failed');
    }

    console.log('Running Scorer Test 3 (Failure Case)...');
    const result3 = await scorer.run({
        output: 'System Report: All good.'
    });
    console.log('Result 3:', result3);

    if (result3.score === 0) {
        console.log('✅ Test 3 Passed');
    } else {
        console.error('❌ Test 3 Failed');
    }
}

verify().catch(err => {
    console.error('Verification Error:', err);
    process.exit(1);
});
