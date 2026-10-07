// Both entry points share the same registry when loaded in Node.js.
import api from './index.cjs';
export const wair = api.wair;
