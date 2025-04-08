import { GameWorker } from "@virtuals-protocol/game";
import { aixbtFunction } from "./function";
import { translateAPIResonse } from "./function";
import { getSignal } from "./function";
const aixbtWorker = new GameWorker({
    id: "aixbt_worker",
    name: "aixbt worker", 
    description: "Aixbt worker that will get the top crypto projects and return the signal(buy or dont buy)",
    functions: [aixbtFunction, translateAPIResonse, getSignal]
});

export default aixbtWorker;