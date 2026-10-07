import { beforeEach, test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { wair } from 'wair-flight';

const deferred = () => {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
};

beforeEach(() => wair.clear());

test('same key returns the identical promise and runs only the first factory', async () => {
  const gate = deferred();
  let calls = 0;
  const first = wair('k', () => { calls++; return gate.promise; });
  const second = wair('k', () => { throw Error('must not run'); });
  assert.equal(first, second);
  assert.equal(wair.size(), 1);
  gate.resolve(42);
  assert.deepEqual(await Promise.all([first, second]), [42, 42]);
  assert.equal(calls, 1);
  assert.equal(wair.size(), 0);
});

test('different keys are independent', async () => {
  assert.deepEqual(await Promise.all([wair('a', () => 1), wair('b', () => 2)]), [1, 2]);
});

test('fulfilled values are not cached', async () => {
  let calls = 0;
  assert.equal(await wair('k', () => ++calls), 1);
  assert.equal(await wair('k', () => ++calls), 2);
});

test('rejection is shared, cleaned up, and retryable', async () => {
  const gate = deferred();
  const error = Error('boom');
  const first = wair('k', () => gate.promise);
  const second = wair('k', () => 1);
  const results = Promise.allSettled([first, second]);
  gate.reject(error);
  assert.deepEqual(await results, [
    { status: 'rejected', reason: error }, { status: 'rejected', reason: error }
  ]);
  assert.equal(wair.size(), 0);
  assert.equal(await wair('k', () => 'recovered'), 'recovered');
});

test('synchronous throws become rejected promises', async () => {
  let result;
  assert.doesNotThrow(() => { result = wair('k', () => { throw Error('sync'); }); });
  await assert.rejects(result, /sync/);
  assert.equal(wair.size(), 0);
});

for (const mode of ['forget', 'clear']) {
  for (const rejects of [false, true]) {
    test(`${mode}: old ${rejects ? 'rejection' : 'fulfillment'} cannot delete a replacement`, async () => {
      const oldGate = deferred();
      const newGate = deferred();
      const old = wair('k', () => oldGate.promise);
      const observed = Promise.allSettled([old]);
      if (mode === 'forget') assert.equal(wair.forget('k'), true);
      else assert.equal(wair.clear(), undefined);
      assert.equal(wair.size(), 0);
      const replacement = wair('k', () => newGate.promise);
      assert.notEqual(old, replacement);
      if (rejects) oldGate.reject(Error('old'));
      else oldGate.resolve('old');
      await observed;
      assert.equal(wair.size(), 1);
      assert.equal(wair('k', () => 'wrong'), replacement);
      newGate.resolve('new');
      assert.equal(await replacement, 'new');
      assert.equal(wair.size(), 0);
    });
  }
}

test('forget reports missing keys', () => assert.equal(wair.forget('absent'), false));

test('factory starts in a microtask after the key is registered', async () => {
  let started = false;
  const result = wair('k', () => {
    started = true;
    assert.equal(wair('k', () => 'wrong'), result);
    return 42;
  });
  assert.equal(started, false);
  assert.equal(await result, 42);
});

test('thenables are assimilated', async () => {
  assert.equal(await wair('k', () => ({ then(resolve) { resolve(42); } })), 42);
});

test('clear detaches multiple operations without cancelling them', async () => {
  const a = deferred(), b = deferred();
  const results = Promise.all([wair('a', () => a.promise), wair('b', () => b.promise)]);
  assert.equal(wair.size(), 2);
  wair.clear();
  assert.equal(wair.size(), 0);
  a.resolve(1); b.resolve(2);
  assert.deepEqual(await results, [1, 2]);
});

test('CommonJS and ESM share one function and registry', async () => {
  const { wair: common } = createRequire(import.meta.url)('wair-flight');
  assert.equal(common, wair);
  const result = common('k', () => 42);
  assert.equal(wair('k', () => 99), result);
  assert.equal(await result, 42);
});
