import { AcpState } from "../src/interface";
import AcpPlugin from "@virtuals-protocol/game-acp-plugin";
import AcpClient, {
  AcpContractClient,
  baseAcpConfig
} from "@virtuals-protocol/acp-node";
import {
  WHITELISTED_WALLET_PRIVATE_KEY,
  BUYER_ENTITY_ID,
  BUYER_AGENT_WALLET_ADDRESS,
  GAME_API_KEY
} from "./env";

/**
 * Delete old items from a list keeping only the most recent ones.
 */
function deleteOldItems<T extends { jobId: number }>(
  items: T[],
  keep: number,
  label: string
): T[] {
  if (items.length <= keep) return items;

  const sorted = [...items].sort((a, b) => b.jobId - a.jobId);
  const deletedCount = items.length - keep;
  console.log(`Deleted ${deletedCount} ${label}, keeping ${keep} most recent`);
  return sorted.slice(0, keep);
}

/**
 * Filter out jobs by jobId from active job arrays.
 */
export function filterOutJobIds(state: AcpState, jobIdsToIgnore: number[]): AcpState {
  if (!jobIdsToIgnore.length) return state;

  const filteredState = { ...state, jobs: { ...state.jobs } };

  if (filteredState.jobs.active) {
    const { asABuyer = [], asASeller = [] } = filteredState.jobs.active;

    filteredState.jobs.active = {
      asABuyer: asABuyer.filter(job => !jobIdsToIgnore.includes(job.jobId)),
      asASeller: asASeller.filter(job => !jobIdsToIgnore.includes(job.jobId))
    };
  }

  return filteredState;
}

/**
 * Filter out jobs from given agent addresses in the active job arrays.
 */
export function filterOutJobsByAgentAddress(state: AcpState, addressesToIgnore: string[]): AcpState {
  if (!addressesToIgnore.length) return state;

  const activeJobs = state.jobs?.active;
  if (!activeJobs) return state;

  const allJobs = [...(activeJobs.asABuyer ?? []), ...(activeJobs.asASeller ?? [])];
  const jobIdsToIgnore = allJobs
    .filter(job => addressesToIgnore.includes(job.providerAddress ?? ""))
    .map(job => job.jobId);

  if (jobIdsToIgnore.length) {
    console.log(
      `Removing ${jobIdsToIgnore.length} active jobs from ignored agents: ${jobIdsToIgnore.join(", ")}`
    );
  }

  return filterOutJobIds(state, jobIdsToIgnore);
}

/**
 * Generic cleanup helpers
 */
export function deleteCompletedJobs(state: AcpState, keep: number = 5): AcpState {
  const s = structuredClone(state);
  s.jobs.completed = deleteOldItems(s.jobs.completed ?? [], keep, "completed jobs");
  return s;
}

export function deleteCancelledJobs(state: AcpState, keep: number = 5): AcpState {
  const s = structuredClone(state);
  s.jobs.cancelled = deleteOldItems(s.jobs.cancelled ?? [], keep, "cancelled jobs");
  return s;
}

export function deleteOldJobs(state: AcpState, keepCompleted = 5, keepCancelled = 5): AcpState {
  return deleteCancelledJobs(deleteCompletedJobs(state, keepCompleted), keepCancelled);
}

export function deleteAcquiredInventory(state: AcpState, keep = 5): AcpState {
  const s = structuredClone(state);
  s.inventory.acquired = deleteOldItems(s.inventory.acquired ?? [], keep, "acquired inventory");
  return s;
}

export function deleteProducedInventory(state: AcpState, keep = 5): AcpState {
  const s = structuredClone(state);
  s.inventory.produced = deleteOldItems(s.inventory.produced ?? [], keep, "produced inventory");
  return s;
}

export function deleteOldInventory(state: AcpState, keepAcquired = 5, keepProduced = 5): AcpState {
  return deleteProducedInventory(deleteAcquiredInventory(state, keepAcquired), keepProduced);
}

/**
 * Master cleanup function
 */
export function reduceAgentState(
  state: AcpState,
  options: {
    keepCompletedJobs?: number;
    keepCancelledJobs?: number;
    keepAcquiredInventory?: number;
    keepProducedInventory?: number;
    jobIdsToIgnore?: number[];
    agentAddressesToIgnore?: string[];
  } = {}
): AcpState {
  const {
    keepCompletedJobs = 5,
    keepCancelledJobs = 5,
    keepAcquiredInventory = 5,
    keepProducedInventory = 5,
    jobIdsToIgnore = [],
    agentAddressesToIgnore = []
  } = options;

  let newState = structuredClone(state);

  if (jobIdsToIgnore.length > 0) {
    newState = filterOutJobIds(newState, jobIdsToIgnore);
  }

  if (agentAddressesToIgnore.length > 0) {
    newState = filterOutJobsByAgentAddress(newState, agentAddressesToIgnore);
  }

  newState = deleteOldJobs(newState, keepCompletedJobs, keepCancelledJobs);
  newState = deleteOldInventory(newState, keepAcquiredInventory, keepProducedInventory);

  return newState;
}

/**
 * Test Case
 */

async function runTest() {
  const acpPlugin = new AcpPlugin({
    apiKey: GAME_API_KEY,
    acpClient: new AcpClient({
      acpContractClient: await AcpContractClient.build(
        WHITELISTED_WALLET_PRIVATE_KEY,
        BUYER_ENTITY_ID,
        BUYER_AGENT_WALLET_ADDRESS,
        baseAcpConfig
      ),
    }),
  });

  const state = await acpPlugin.getAcpState();
  console.log("\nOriginal Agent State:");
  console.dir(state, { depth: null, colors: true });

  const cleaned = reduceAgentState(state, {
    keepCompletedJobs: 1,
    keepCancelledJobs: 1,
    keepAcquiredInventory: 1,
    keepProducedInventory: 1,
    jobIdsToIgnore: [6294, 6293, 6269],
    agentAddressesToIgnore: ["0x408AE36F884Ef37aAFBA7C55aE1c9BB9c2753995"],
  });

  console.log("\n🧹 Reduced Agent State:");
  console.dir(cleaned, { depth: null, colors: true });
}

runTest()