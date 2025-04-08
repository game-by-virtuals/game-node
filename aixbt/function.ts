import { GameFunction, ExecutableGameFunctionResponse, ExecutableGameFunctionStatus } from "@virtuals-protocol/game";

export const aixbtFunction = new GameFunction({
    name: "get_top_crypto_projects",
    description: "get and return top crypto projects in the market",
    args: [] as const,
    executable: async (args) => {
        
        try {
            const response = await fetch('https://api.aixbt.tech/v1/projects?limit=2', {
                headers: {
                    'x-api-key': process.env.AIXBT_API_KEY || '',
                    'Content-Type': 'application/json'
                }
            });
            if (!response.ok) {
                throw new Error('Failed to fetch top crypto projects');
            }
            const data = await response.json();
            return new ExecutableGameFunctionResponse(
                ExecutableGameFunctionStatus.Done,
                JSON.stringify(data)
            );
        } catch (error) {
            return new ExecutableGameFunctionResponse(
                ExecutableGameFunctionStatus.Failed,
                `Error fetching top crypto projects: ${error}`
            );
        }

    }
});

export const translateAPIResonse = new GameFunction({
    name: "translate_api_response",
    description: "translate api response to signal(buy or dont buy)",
    args: [
        {
            name: "analysis",
            description: "analysis of the project, found in the api response under the key 'analysis'",
            type: "string"
        }
    ] as const,
    executable: async (args) => {
        const request = `based on ${args.analysis}, should I buy or not?`
        return new ExecutableGameFunctionResponse(
            ExecutableGameFunctionStatus.Done,
            JSON.stringify(request)
        );
    }
});

export const getSignal = new GameFunction({
    name: "get_signal",
    description: "get the signal(buy or dont buy)",
    args: [
        {
            name: "signal",
            description: "signal(buy or dont buy)",
            type: "string"
        }
    ] as const,
    executable: async (args) => {
        console.log(args.signal)
        return new ExecutableGameFunctionResponse(
            ExecutableGameFunctionStatus.Done,
            JSON.stringify(args)
        );
    }
});