import { wair } from 'wair-flight';
const number: Promise<number> = wair('number', () => 42);
const text: Promise<string> = wair('text', async () => 'ok');
const thenable: Promise<number> = wair('thenable', () => (null as unknown as PromiseLike<number>));
const forgotten: boolean = wair.forget('number');
const size: number = wair.size();
const cleared: void = wair.clear();
// @ts-expect-error Keys must be strings.
wair(42, () => true);
// @ts-expect-error A factory is required.
wair('missing');
// @ts-expect-error Factory result determines the promise type.
const wrong: Promise<string> = wair('wrong', () => 42);
void [number, text, thenable, forgotten, size, cleared, wrong];
