import { rupaul_agent } from "./agent";

(async () => {
    // Add custom logger
    rupaul_agent.setLogger((agent, msg) => {
        console.log(`💄 [${agent.name}] 👑`);
        console.log(msg);
        console.log("✨ Now sashay away! ✨\n");
    });

    await rupaul_agent.init();
    await rupaul_agent.run(60, { verbose: true });

})();


