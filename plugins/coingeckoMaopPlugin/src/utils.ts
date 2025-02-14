import {
  ExecutableGameFunctionResponse,
  ExecutableGameFunctionStatus,
} from "@virtuals-protocol/game";

export async function maopVisitor(
  apiKey: string,
  baseApiUrl: string,
  toolName: string,
  args: any,
  logger: any
) {
  // Prepare headers for the request
  const headers = {
    "content-type": "application/json",
    accept: "application/json",
    "x-game-plugin": "0.1",
    Authorization: apiKey,
  };

  // Prepare request URL
  const url = new URL(`${baseApiUrl}/api/v3/game-plugin/run-tool`);

  logger(`Querying coin data with ID: ${args.id}`);

  // Make the API request
  const response = await fetch(url.href, {
    method: "post",
    headers,
    body: JSON.stringify({ toolName, args }),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const jsonResponse = await response.json();
  // return jsonResponse;
  const message = `Successfully queried data. Response: ${JSON.stringify(
    jsonResponse
  )}`;
  logger(message);

  return new ExecutableGameFunctionResponse(
    ExecutableGameFunctionStatus.Done,
    message
  );
}

export function exceptionHandler(e: any, logger: any) {
  const errorMessage = `An error occurred while querying coin data: ${
    e.message || "Unknown error"
  }`;
  logger(errorMessage);

  return new ExecutableGameFunctionResponse(
    ExecutableGameFunctionStatus.Failed,
    errorMessage
  );
}
