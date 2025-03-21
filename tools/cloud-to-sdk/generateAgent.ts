// generateAgent.ts
import fs from 'fs';
import path from 'path';
import { PluginJson } from './types';
import { GameAgent, LLMModel } from "@virtuals-protocol/game";

export function generateAgent(json: PluginJson, outputPath: string): void {
    try {
        // Ensure directory exists
        const dir = path.dirname(outputPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        const modelMapping: { [key: string]: string } = {
            'llama_3_1_405b': 'Llama_3_1_405B_Instruct',
            'llama_3_3_70b': 'Llama_3_3_70B_Instruct',
            'deepseek_r1': 'DeepSeek_R1',
            'deepseek_v3': 'DeepSeek_V3',
            'qwen_2_5_72b': 'Qwen_2_5_72B_Instruct'
        };

        const modelName = modelMapping[json.gameEngineModel.toLowerCase()] || 'Llama_3_3_70B_Instruct';

        const content = `
import { GameAgent, LLMModel } from "@virtuals-protocol/game";
import { workers } from "./worker";

export const agent = new GameAgent("YOUR_API_KEY", {
    name: "${json.name || 'name'}",
    goal: \`${json.goal}\`,
    description: \`${json.description}\`,
    workers: workers,
    llmModel: LLMModel.${modelName}
});`;

        fs.writeFileSync(outputPath, content);
        console.log(`✅ Generated agent.ts at ${outputPath}`);
    } catch (error) {
        console.error(`❌ Error generating agent.ts:`, error);
        throw error;
    }
}