import { EnsoClient } from "@ensofinance/sdk";

type Route = Awaited<ReturnType<EnsoClient["getRouterData"]>>["route"];

// The buildRoutePath will return string as follows:
//
//"Split via enso
//   Internal Routes:
//     Route 1:
//       Swap via enso
//     Route 2:
//       Swap via enso
//       Deposit via stakestone-stone
// Deposit via uniswap-v2"

/**
 * Build a route path string from Enso route
 * @returns string
 */
export function buildRoutePath(route: Route): string {
  let str = "";

  function buildStep(step: Route[number], indent: string = ""): string {
    const action = capitalizeWord(step.action);
    let stepStr = `${indent}${action} via ${step.protocol}\n`;

    if (step.internalRoutes) {
      stepStr += `${indent}  Internal Routes:\n`;
      step.internalRoutes.forEach((internalRoute, index) => {
        stepStr += `${indent}    Route ${index + 1}:\n`;
        internalRoute.forEach((internalStep) => {
          stepStr += buildStep(internalStep, `${indent}      `);
        });
      });
    }

    return stepStr;
  }

  route.forEach((step) => {
    str += buildStep(step);
  });

  return str.trim(); // Trim to remove the last newline
}

function capitalizeWord(word: string) {
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}
