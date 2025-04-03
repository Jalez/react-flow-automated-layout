/*
  @license
	Rollup.js v4.36.0
	Mon, 17 Mar 2025 08:35:11 GMT - commit ab7bfa8fe9c25e41cc62058fa2dcde6b321fd51d

	https://github.com/rollup/rollup

	Released under the MIT License.
*/
export { version as VERSION, defineConfig, rollup, watch } from './shared/node-entry.js';
import './shared/parseAst.js';
import '../native.js';
import 'node:path';
import 'path';
import 'node:process';
import 'node:perf_hooks';
import 'node:fs/promises';
