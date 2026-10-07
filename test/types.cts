import { wair } from 'wair-flight';
const result: Promise<number> = wair('cjs', () => 42);
const forgotten: boolean = wair.forget('cjs');
void [result, forgotten];
