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
    ${fn.hint ? `hint: \`${fn.hint}\`,` : ''}
    executable: ${generateExecutableFunction(fn)}
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

const generateExecutableFunction = (fn: any) => {
    if (fn.config?.url) {
        const hasResponseFormat = /{{response\.\d+\.\w+}}/.test(fn.config.success_feedback);
        const convertedFeedback = hasResponseFormat 
            ? fn.config.success_feedback.replace(
                /{{response\.(\d+)\.(\w+)}}/g, 
                (_: string, index: string, prop: string) => `\${data[${index}].${prop}}`
            )
            : fn.config.success_feedback;

        const method = fn.config.method?.toUpperCase() || 'GET';
        const fetchOptions = {
            method,
            headers: fn.config.headers || {},
            ...(method !== 'GET' && fn.config.payload ? { body: JSON.stringify(fn.config.payload) } : {})
        };

        return `async (args, logger) => {
        try {
            const response = await fetch(
                \`${fn.config.url}\`,
                ${JSON.stringify(fetchOptions)}
            );
            const data = await response.json();
            
            if (data.cod !== 200) {
                throw new Error(data.message || 'Failed to fetch data');
            }
            return new ExecutableGameFunctionResponse(
                ExecutableGameFunctionStatus.Done,
                \`${convertedFeedback}\`
            );
        } catch (e) {
            return new ExecutableGameFunctionResponse(
                ExecutableGameFunctionStatus.Failed,
                e instanceof Error ? e.message : "Operation failed"
            );
        }
    }`;
    }
    
    return `async (args, logger) => {
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
    }`;
};