import { readFileSync } from 'node:fs';
const registry = JSON.parse(readFileSync(new URL('../../packages/contracts/environments.json', import.meta.url)));
console.log(JSON.stringify({project:registry.project,surface:'control-command-center',state:'demonstration',environments:registry.environments},null,2));
