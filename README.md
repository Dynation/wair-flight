# wair-flight

**One does, everyone awaits.**

Tiny promise deduplication / singleflight. Concurrent callers with the same
key receive the same promise. Zero runtime dependencies. ESM, CommonJS, and
TypeScript declarations included. No build step.

> Not yet published to npm. The intended package name is `wair-flight`;
> the exported function is `wair`. The existing npm package `wair` is unrelated.

## Usage

After publication, install with `npm install wair-flight`.

```ts
import { wair } from 'wair-flight';

const loadUser = (tenantId: string, userId: string) =>
  wair(`user:${JSON.stringify([tenantId, userId])}`, async () => {
    const response = await fetch(`/api/users/${encodeURIComponent(userId)}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  });

const [a, b] = await Promise.all([
  loadUser('tenant-1', 'user-42'),
  loadUser('tenant-1', 'user-42'),
]); // One fetch. Both callers receive the same result object.
```

For CommonJS: `const { wair } = require('wair-flight')`.

## API

### `wair(key, fn)`

Returns a shared promise for a string key. The first factory wins; factories
from subsequent callers are ignored while the key is tracked. Factories may
return values, promises, or thenables. Throws become promise rejections.
The factory starts in the next microtask, after its key is registered.
Settlement removes the entry; results and errors are not cached.

### `wair.forget(key): boolean`

Removes a tracked key and reports whether it existed. The old operation keeps
running, and existing callers still receive its result. A new call can start
a replacement. The old operation's cleanup cannot remove the replacement.

### `wair.size(): number`

Returns the number of tracked keys, **not** all running operations. Forgotten
operations may still be running.

### `wair.clear(): void`

Detaches every tracked key without cancelling any operation.

## Boundaries

- One in-memory registry per loaded package instance. Separate processes,
  workers, serverless instances, or duplicated installations do not coordinate.
- This deduplicates overlapping work; it is not a result cache or distributed lock.
- A key must identify the same result type and operation for every caller.
  TypeScript cannot enforce that association across arbitrary string keys.
- Include every relevant input and authorization boundary in your key.
  Do not share personalized results across users or tenants by accident.
- Reentrant calls see the registered promise. A factory must not return or
  await its own flight, directly or indirectly: that creates a dependency cycle.
- There is no timeout or cancellation policy. A never-settling operation
  stays tracked until `forget` or `clear` detaches it.
- Results are shared by reference. Treat shared objects accordingly.
- Node.js entry points are tested; browser usage requires a compatible bundler.

## Development

Use Node.js 22 or newer for development.

```sh
npm ci
npm test
npm run typecheck
npm pack --dry-run
```

Tests use Node's built-in runner and controlled promises without timing sleeps.
TypeScript is a development-only dependency.

## Release

1. Verify that `wair-flight` is still available in the npm registry.
2. Run `npm ci`, `npm test`, `npm run typecheck`, and `npm pack --dry-run`.
3. Authenticate locally with `npm login`, then run `npm publish --access public`.
4. Update the unpublished notice above after confirming the registry release.

License: MIT.
