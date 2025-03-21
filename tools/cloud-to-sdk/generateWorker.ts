// generateWorker.ts
import fs from 'fs';
import path from 'path';
import { PluginJson } from './types';

export function generateWorker(json: PluginJson, outputPath: string): void {
    try {
        const dir = path.dirname(outputPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        if (!json.workers?.length) {
            throw new Error('No worker configuration found in JSON');
        }

        const workersContent = json.workers.map(worker => `
    new GameWorker({
        id: "${worker.id}",
        name: "${worker.name}",
        description: \`${worker.description}\`,
        functions: functions["${worker.workerId}"] || []
    })`).join(',\n');

        const content = `
import { GameWorker } from "@virtuals-protocol/game";
import { functions } from "./functions";

export const workers = [${workersContent}
];`;

        fs.writeFileSync(outputPath, content);
        console.log(`✅ Generated worker.ts at ${outputPath}`);
    } catch (error) {
        console.error(`❌ Error generating worker.ts:`, error);
        throw error;
    }
}