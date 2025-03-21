// index.ts
import fs from 'fs';
import path from 'path';
import { PluginJson } from './types';
import { generateAgent } from './generateAgent';
import { generateWorker } from './generateWorker';
import { generateFunctions } from './generateFunctions';

export function generateFiles(jsonPath: string, outputDir: string): void {
    try {
        // Validate JSON file exists
        if (!fs.existsSync(jsonPath)) {
            throw new Error(`JSON file not found at ${jsonPath}`);
        }

        // Read and parse JSON
        const jsonContent = fs.readFileSync(jsonPath, 'utf8');
        let json: PluginJson;
        try {
            json = JSON.parse(jsonContent);
        } catch (error) {
            throw new Error(`Invalid JSON file: ${error}`);
        }

        // Validate required fields
        if (!json.goal || !json.description) {
            const missing = [];
            if (!json.goal) missing.push('goal');
            if (!json.description) missing.push('description');
            throw new Error(`Missing required fields in JSON: ${missing.join(', ')}`);
        }

        // Set default name if not provided
        const pluginJson = {
            ...json,
            name: json.name || 'name'  // Default to 'PENGU' if name is missing
        };

        // Generate files
        generateAgent(pluginJson, path.join(outputDir, 'agent.ts'));
        generateFunctions(pluginJson, path.join(outputDir, 'functions.ts'));
        generateWorker(pluginJson, path.join(outputDir, 'worker.ts'));

        console.log('✅ All files generated successfully!');
    } catch (error) {
        console.error('❌ Error generating files:', error);
        throw error;
    }
}

// Usage example:
// generateFiles('path/to/plugin.json', 'output/directory');

if (require.main === module) {
    const args = process.argv.slice(2);
    if (args.length !== 1) {
        console.error('Usage: ts-node tools/index.ts <input.json>');
        process.exit(1);
    }

    const [inputJson] = args;
    const fullPath = path.join(__dirname, inputJson);
    const outputDir = path.join(__dirname, 'output');
    
    console.log('Looking for JSON file at:', fullPath);
    
    try {
        // Create output directory if it doesn't exist
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        // First check if we can read the file
        const content = fs.readFileSync(fullPath, 'utf8');
        
        // Then check the parsed JSON
        const json = JSON.parse(content);
        
        generateFiles(fullPath, outputDir);
    } catch (error: unknown) {
        console.error('Detailed error:', error);
        process.exit(1);
    }
}