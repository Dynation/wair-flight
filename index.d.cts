/** Share one pending promise per key. The first factory wins. */
export declare function wair<T>(key: string, fn: () => T | PromiseLike<T>): Promise<Awaited<T>>;
export declare namespace wair {
  /** Detach a key without cancelling its operation. */
  function forget(key: string): boolean;
  /** Number of tracked keys, excluding forgotten operations. */
  function size(): number;
  /** Detach all keys without cancelling any operations. */
  function clear(): void;
}
