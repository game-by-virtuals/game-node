import { money_maker_agent } from './agent';

async function main() {
  try {
    // Initialize the agent
    await money_maker_agent.init();

    // Run the agent
    while (true) {
      await money_maker_agent.step({ verbose: true });
    }
  } catch (error) {
    console.error('Error running money maker:', error);
  }
}

main();
