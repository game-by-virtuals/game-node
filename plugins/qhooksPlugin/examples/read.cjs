const { getQHooksWorker } = require("../dist/index.js");
(async () => {
  const worker = getQHooksWorker({ enabled: process.env.QHOOKS_GAME_ENABLED === "1" });
  const read = worker.functions.find(f => f.name === "qhooks_list_launches");
  const result = await read.execute(
    { input: { value: JSON.stringify({ chain: "4663", limit: 1 }) } },
    () => {},
  );
  console.log(result.status, result.feedback);
})().catch(() => {
  console.error("QHooks example unavailable");
  process.exitCode = 1;
});
