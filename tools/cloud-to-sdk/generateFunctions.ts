// generateFunctions.ts
import fs from 'fs';
import path from 'path';
import { PluginJson } from './types';

export function generateFunctions(json: PluginJson, outputPath: string): void {
    try {
        const dir = path.dirname(outputPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        const functionsByWorker = json.customFunctions.reduce((acc, fn) => {
            // Normalize workerId: convert "Twitter Main Location" to "twitter_main_location"
            let workerId = fn.workerId || 'twitter_main_location';
            if (workerId === 'Twitter Main Location') {
                workerId = 'twitter_main_location';
            }
            acc[workerId] = acc[workerId] || [];
            acc[workerId].push(fn);
            return acc;
        }, {} as Record<string, typeof json.customFunctions>);

        
        const content = `import { GameFunction, ExecutableGameFunctionResponse, ExecutableGameFunctionStatus } from "@virtuals-protocol/game";
${Object.entries(functionsByWorker).map(([workerId, fns]) => 
    fns.map(fn => `
export const ${fn.fn_name}Function = new GameFunction({
    name: "${fn.fn_name}",
    description: \`${fn.fn_description}\`,
    args: ${JSON.stringify(fn.args, null, 4)} as const,
    executable: async (args, logger) => {
        try {
            // TODO: Implement function
            return new ExecutableGameFunctionResponse(
                ExecutableGameFunctionStatus.Done,
                "Operation completed successfully"
            );
        } catch (e) {
            return new ExecutableGameFunctionResponse(
                ExecutableGameFunctionStatus.Failed,
                e instanceof Error ? e.message : "Operation failed"
            );
        }
    }${fn.hint ? `,\n    hint: "${fn.hint}"` : ''}
});`).join('\n')).join('\n')}

export const functions = {
    ${Object.entries(functionsByWorker).map(([workerId]) => 
        `${workerId}: [${functionsByWorker[workerId].map(fn => `${fn.fn_name}Function`).join(', ')}]`
    ).join(',\n    ')}
};`;

        fs.writeFileSync(outputPath, content);
        console.log(`✅ Generated functions.ts at ${outputPath}`);
    } catch (error) {
        console.error(`❌ Error generating functions.ts:`, error);
        throw error;
    }
}