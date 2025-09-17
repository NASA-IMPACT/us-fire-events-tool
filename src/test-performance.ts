import { fetchFirePerimeters, fetchLayerPaginated } from './utils/fireUtils';

/**
 * Instructions:
 * 
 * To run the test, run `npx vite-node src/test-performance.ts`
 * To run with errors, run `npx vite-node src/test-performance.ts --errors`
 */

interface TestResult {
  fireId: string;
  env: string;
  duration: number;
  success: boolean;
  dataSize: number;
  error?: any;
}

// Test fire IDs
const TEST_FIRE_IDS = [
  '4775',
  '3750',
  '46304'
];

const ENV_ENDPOINTS: Record<string, string>[] = [
  {'prod': 'https://openveda.cloud/api/features'},
  {'staging': 'https://staging.openveda.cloud/api/features'},
  {'dev': 'https://dev.openveda.cloud/api/features'},
]

// returns an array of test results for each environment for each fireId
async function testEndpointPerformance(envEndpoint: Record<string, string>): Promise<any> {
  const env: string = Object.entries(envEndpoint)[0][0];
  const endpoint: string = Object.entries(envEndpoint)[0][1];
  const result = {};
  const testResults: TestResult[] = [];

  for (const fireId of TEST_FIRE_IDS) {
    const start = performance.now();
    try {
      // const result = await fetchFirePerimeters(fireId, endpoint);
      const result = await fetchLayerPaginated(`${endpoint}/collections`, 'public.eis_fire_lf_perimeter_nrt', fireId, 'geojson');
      const end = performance.now();
      testResults.push({
        fireId,
        env: endpoint,
        duration: end - start,
        success: result !== null,
        dataSize: result ? JSON.stringify(result).length : 0
      });
    } catch (error) {
      const end = performance.now();
      testResults.push({
        fireId,
        env: endpoint,
        duration: end - start,
        success: false,
        dataSize: 0,
        error: error instanceof Error ? error : 'Unknown error'
      });
    }
  }
  result[env] = testResults;
  return result;
}


async function runPerformanceTest() {
  const args = process.argv.slice(2);
  let logErrors: boolean = false;
  if (args.includes('--errors')) {
    logErrors = true;
  }

  console.log('Starting performance test...');
  console.log('----------------------------------------');

  // Parallel tests
  console.log('\nRunning parallel tests...');
  const parallelStart = performance.now();
    const parallelResults = await Promise.all(
      ENV_ENDPOINTS.map(envEndpoint => testEndpointPerformance(envEndpoint))
  );
  // console.dir(parallelResults, { depth: null })
  const parallelEnd = performance.now();
  
  // Calculate stats for each environment
  const testIdsCount = TEST_FIRE_IDS.length;

  // Calculate success counts for each environment
  // prod
  const prodSuccessCount = parallelResults[0]['prod'].filter(r => r.success).length;
  const prodSuccessRate = (prodSuccessCount / testIdsCount * 100);
  const prodSuccessAvgDuration = parallelResults[0]['prod'].filter(r => r.success).reduce((acc, r) => acc + r.duration, 0) / parallelResults[0]['prod'].filter(r => r.success).length;
  const prodErrorsSort = parallelResults[0]['prod'].filter(r => !r.success);
  
  // staging
  const stagingSuccessCount = parallelResults[1]['staging'].filter(r => r.success).length;
  const stagingSuccessRate = (stagingSuccessCount / testIdsCount) * 100;
  const stagingSuccessAvgDuration = parallelResults[1]['staging'].filter(r => r.success).reduce((acc, r) => acc + r.duration, 0) / parallelResults[1]['staging'].filter(r => r.success).length;
  const stagingErrorsSort = parallelResults[1]['staging'].filter(r => !r.success);

  // dev
  const devSuccessCount = parallelResults[2]['dev'].filter(r => r.success).length;
  const devSuccessRate = (devSuccessCount / testIdsCount) * 100;
  const devSuccessAvgDuration = parallelResults[2]['dev'].filter(r => r.success).reduce((acc, r) => acc + r.duration, 0) / parallelResults[2]['dev'].filter(r => r.success).length;
  const devErrorsSort = parallelResults[2]['dev'].filter(r => !r.success);

  const totalParallelDuration = parallelEnd - parallelStart;

  console.log('\nTEST SUMMARY');
  console.log('------------------PRODUCTION----------------------');
  console.log(`${prodSuccessCount} Ids successful out of ${testIdsCount} Ids tested`)
  console.log(`Success rate: ${prodSuccessRate.toFixed(2)}%`);
  console.log(`Average success duration: ${prodSuccessAvgDuration.toFixed(2)}ms`);
  if (logErrors) {
    console.log(`Ids errored in Prod: `)
    console.dir(prodErrorsSort, { depth: null })
  }
  console.log('------------------STAGING----------------------');
  console.log(`${stagingSuccessCount} Ids successful out of ${testIdsCount} Ids tested`)
  console.log(`Success rate: ${stagingSuccessRate.toFixed(2)}%`);
  console.log(`Average success duration: ${stagingSuccessAvgDuration.toFixed(2)}ms`);
  if (logErrors) {
    console.log(`Ids errored in Staging: `)
    console.dir(stagingErrorsSort, { depth: null })
  }
  console.log('------------------DEV----------------------');
  console.log(`${devSuccessCount} Ids successful out of ${testIdsCount} Ids tested`)
  console.log(`Success rate: ${devSuccessRate.toFixed(2)}%`);
  console.log(`Average success duration: ${devSuccessAvgDuration.toFixed(2)}ms`);
  if (logErrors) {
    console.log(`Ids errored in Dev: `)
    console.dir(devErrorsSort, { depth: null })
  }
  console.log('----------------------------------------');
  console.log(`Total parallel execution time: ${totalParallelDuration.toFixed(2)}ms`);
}

runPerformanceTest().catch(console.error);
