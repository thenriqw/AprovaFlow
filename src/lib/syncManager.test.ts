import { syncManager } from './syncManager';
import assert from 'assert';

// We mock the queue directly or inject an artificial backoff
// To avoid long waits, we can monkey-patch setTimeout just for the SyncManager
const originalSetTimeout = global.setTimeout;
let mockTime = 0;

async function runTests() {
  console.log('Running determinisitic SyncManager tests...');

  // Reset syncManager for testing
  (syncManager as any).queue.clear();
  (syncManager as any).isProcessing = false;
  syncManager.status = 'idle';
  syncManager.pendingCount = 0;
  syncManager.errorMessage = null;
  (syncManager as any).online = true;

  // 1. Substitution of task during execution
  console.log('Test 1: Substitution of task during execution');
  let firstExecuted = false;
  let secondExecuted = false;
  let firstResolve: any;

  syncManager.enqueue('doc1', () => new Promise<void>((resolve) => {
    firstExecuted = true;
    firstResolve = resolve;
  }));

  assert.strictEqual(syncManager.status, 'saving', 'Should be saving immediately');
  assert.strictEqual(firstExecuted, true, 'First task should start executing');

  // Substitute while running
  syncManager.enqueue('doc1', async () => {
    secondExecuted = true;
  });

  // Finish first
  firstResolve();
  
  // Wait a small tick
  await new Promise(r => originalSetTimeout(r, 50));
  
  assert.strictEqual(secondExecuted, true, 'Second task should execute after first resolves');
  assert.strictEqual((syncManager as any).queue.size, 0, 'Queue should be empty');


  // 2. Update followed by deletion
  console.log('Test 2: Update followed by deletion');
  (syncManager as any).queue.clear();
  (syncManager as any).isProcessing = false;
  
  let executedOrder: string[] = [];
  let updateResolve: any;
  
  // The update starts
  syncManager.enqueue('doc2', () => new Promise<void>((resolve) => {
    executedOrder.push('update');
    updateResolve = resolve;
  }));

  // Immediately enqueue deletion on the exact same key
  syncManager.enqueue('doc2', async () => {
    executedOrder.push('delete');
  });

  assert.strictEqual(syncManager.status, 'saving');
  assert.deepStrictEqual(executedOrder, ['update'], 'Only update should have started');

  // Let the update resolve
  updateResolve();
  
  await new Promise(r => originalSetTimeout(r, 50));

  assert.deepStrictEqual(executedOrder, ['update', 'delete'], 'Delete should execute after update');
  assert.strictEqual((syncManager as any).queue.size, 0, 'Queue should be empty');


  // 3. Offline queue and resume: Update followed by deletion while offline
  console.log('Test 3: Offline queue and resume');
  (syncManager as any).queue.clear();
  (syncManager as any).isProcessing = false;
  (syncManager as any).online = false; // force offline
  syncManager.status = 'idle';

  let executedOffline = [] as string[];
  
  syncManager.enqueue('doc3', async () => {
    executedOffline.push('update');
  });

  syncManager.enqueue('doc3', async () => {
    executedOffline.push('delete');
  });

  assert.strictEqual(syncManager.status, 'offline', 'Status should be offline');
  assert.deepStrictEqual(executedOffline, [], 'Nothing should execute while offline');
  assert.strictEqual((syncManager as any).queue.size, 1, 'Only one task (the latest) should be in the queue for that key');

  (syncManager as any).online = true;
  await syncManager.processQueue();
  
  await new Promise(r => originalSetTimeout(r, 50));

  assert.deepStrictEqual(executedOffline, ['delete'], 'Only the delete should execute once back online');


  // 4. Delete created while update is still ongoing
  // (We essentially tested this in Test 2, but let's do it explicitly with no delays)
  console.log('Test 4: Delete created while update is in progress');
  (syncManager as any).queue.clear();
  (syncManager as any).isProcessing = false;
  (syncManager as any).online = true;

  let updateStarted = false;
  let updateFinished = false;
  let deleteStarted = false;
  let resUpdate: any;

  syncManager.enqueue('doc4', () => new Promise<void>(resolve => {
    updateStarted = true;
    resUpdate = resolve;
  }).then(() => {
    updateFinished = true;
  }));

  assert.strictEqual(updateStarted, true);
  assert.strictEqual(deleteStarted, false);

  syncManager.enqueue('doc4', async () => {
    deleteStarted = true;
  });

  assert.strictEqual((syncManager as any).queue.size, 1);
  assert.strictEqual(deleteStarted, false);

  resUpdate();
  await new Promise(r => originalSetTimeout(r, 50));
  assert.strictEqual(updateFinished, true);
  assert.strictEqual(deleteStarted, true);


  // 5. Retry and forceRetry
  console.log('Test 5: Retry and forceRetry');
  (syncManager as any).queue.clear();
  (syncManager as any).isProcessing = false;
  (syncManager as any).online = true;
  
  let tries = 0;
  
  // We'll stub setTimeout on global just during this task to bypass backoff waits
  const oldSetTimeout = global.setTimeout;
  global.setTimeout = ((cb: any, ms: number) => {
    return oldSetTimeout(cb, 0); // execute immediately
  }) as any;

  syncManager.enqueue('doc5', async () => {
    tries++;
    throw new Error('Fake error');
  });

  // Wait for the tries to exhaust. The manager retries 3 times, so 4 tries total.
  await new Promise(r => oldSetTimeout(r, 100));

  // Restore setTimeout
  global.setTimeout = oldSetTimeout;

  assert.strictEqual(tries, 4, 'Should have tried 4 times (1 initial + 3 retries)');
  assert.strictEqual(syncManager.status, 'error', 'Status should be error');
  assert.strictEqual((syncManager as any).queue.size, 1, 'Task should still be in the queue');

  let forceTries = 0;
  // Overwrite the execute logic so it succeeds now
  const task = (syncManager as any).queue.get('doc5');
  task.execute = async () => {
    forceTries++;
  };

  syncManager.forceRetry();
  
  await new Promise(r => originalSetTimeout(r, 50));

  assert.strictEqual(forceTries, 1, 'Should execute successfully after forceRetry');
  assert.strictEqual((syncManager as any).queue.size, 0, 'Queue should be empty now');
  assert.strictEqual(task.retries, 0, 'Retries should have been reset to 0');
  
  // Wait a bit to see if status flips back to saved/idle
  await new Promise(r => originalSetTimeout(r, 3100)); 
  // It flips to idle after 3000ms if queue is empty
  
  assert.strictEqual(syncManager.status, 'idle', 'Status should eventually be idle');

  console.log('All tests passed!');
}

runTests().catch(e => {
  console.error(e);
  process.exit(1);
});
