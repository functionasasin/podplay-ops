import { readFileSync } from 'fs';
import { resolve } from 'path';
import { initSync } from './wasm/pkg/taxklaro_engine.js';

// Load WASM synchronously for Node.js (Vitest) environment
const wasmPath = resolve(__dirname, './wasm/pkg/taxklaro_engine_bg.wasm');
const wasmBuffer = readFileSync(wasmPath);
initSync({ module: wasmBuffer });
