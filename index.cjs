'use strict';

const inflight = new Map();

function wair(key, fn) {
  const existing = inflight.get(key);
  if (existing) return existing;

  const promise = Promise.resolve().then(fn).finally(() => {
    if (inflight.get(key) === promise) inflight.delete(key);
  });
  inflight.set(key, promise);
  return promise;
}

wair.forget = (key) => inflight.delete(key);
wair.size = () => inflight.size;
wair.clear = () => { inflight.clear(); };

exports.wair = wair;
