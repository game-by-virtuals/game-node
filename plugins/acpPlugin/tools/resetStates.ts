import { AcpState } from "../src/interface";

/**
 * Filter state to prevent multiple jobs with the same seller (keep only the most recent).
 */
export function filterUniqueBuyerJobs(state: AcpState): AcpState {
  const filteredState = { ...state };
  if (filteredState.jobs && filteredState.jobs.active) {
    const buyerJobsBySeller = new Map<string, any>();
    for (const job of filteredState.jobs.active.asABuyer) {
      const sellerAddress = job.providerAddress?.toLowerCase() || '';
      if (!sellerAddress) continue;
      const existingJob = buyerJobsBySeller.get(sellerAddress);
      if (!existingJob || job.jobId > existingJob.jobId) {
        buyerJobsBySeller.set(sellerAddress, job);
      }
    }
    filteredState.jobs.active.asABuyer = Array.from(buyerJobsBySeller.values());
  }
  return filteredState;
}

/**
 * Filter out jobs by a list of job IDs.
 */
export function filterOutJobIds(state: AcpState, jobIdsToIgnore: number[]): AcpState {
  const filteredState = { ...state };
  if (filteredState.jobs && filteredState.jobs.active) {
    filteredState.jobs.active = {
      ...filteredState.jobs.active,
      asABuyer: filteredState.jobs.active.asABuyer.filter(
        (job) => !jobIdsToIgnore.includes(job.jobId)
      ),
      asASeller: filteredState.jobs.active.asASeller.filter(
        (job) => !jobIdsToIgnore.includes(job.jobId)
      ),
    };
  }
  return filteredState;
}

/**
 * Combined tool: filter out job IDs and ensure unique buyer jobs per seller.
 * If buyerAddress is provided, automatically removes all active jobs for that buyer.
 */
export function resetStates(
  state: AcpState, 
  jobIdsToIgnore: number[] = [], 
  buyerAddress?: string
): AcpState {
  let filtered = filterOutJobIds(state, jobIdsToIgnore);
  
  // If buyerAddress is provided, automatically remove all active jobs for that buyer
  if (buyerAddress) {
    const buyerAddressLower = buyerAddress.toLowerCase();
    const buyerJobIds = filtered.jobs.active.asABuyer
      .filter(job => job.providerAddress?.toLowerCase() === buyerAddressLower)
      .map(job => job.jobId);
    
    if (buyerJobIds.length > 0) {
      console.log(`Auto-removing ${buyerJobIds.length} active jobs for buyer ${buyerAddress}: ${buyerJobIds.join(', ')}`);
      filtered = filterOutJobIds(filtered, buyerJobIds);
    }
  }
  
  filtered = filterUniqueBuyerJobs(filtered);
  return filtered;
}

/**
 * Factory function to create a ResetStates instance
 */
export function createResetStates(enabled?: boolean): typeof resetStates {
  return resetStates;
}