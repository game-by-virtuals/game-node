import { GameWorker } from "@virtuals-protocol/game";
import initializeFunctions from "./function";

async function aixbtWorker() {
  const { aixbtFunction, translateAPIResonse, getSignal } = await initializeFunctions();
  
  return new GameWorker({
    id: "aixbt_worker",
    name: "aixbt worker", 
    description: "Aixbt worker that will get the top crypto projects and return the signal(buy or dont buy)",
    functions: [aixbtFunction]
  });
}

export default aixbtWorker;