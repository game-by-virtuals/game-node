import { AcpState } from "../src/interface";

/**
 * Delete completed jobs from the given state, keeping only the N most recent ones
 */
export function deleteCompletedJobs(state: AcpState, keepMostRecent: number = 10): AcpState {
  const filteredState = { ...state };
  
  if (filteredState.jobs && filteredState.jobs.completed && filteredState.jobs.completed.length > keepMostRecent) {
    const sortedCompleted = [...filteredState.jobs.completed].sort((a, b) => {
      // Sort by jobId
      return b.jobId - a.jobId;
    });
    const deletedCount = filteredState.jobs.completed.length - keepMostRecent;
    filteredState.jobs.completed = sortedCompleted.slice(0, keepMostRecent);
    console.log(`DeleteCompleteJobs: Deleted ${deletedCount} completed jobs, keeping ${keepMostRecent} most recent`);
  }

  return filteredState;
}

/**
 * Delete cancelled jobs from the given state, keeping only the N most recent ones
 */
export function deleteCancelledJobs(state: AcpState, keepMostRecent: number = 5): AcpState {
  const filteredState = { ...state };
  
  if (filteredState.jobs && filteredState.jobs.cancelled && filteredState.jobs.cancelled.length > keepMostRecent) {
    const sortedCancelled = [...filteredState.jobs.cancelled].sort((a, b) => {
      // Sort by jobId
      return b.jobId - a.jobId;
    });
    const deletedCount = filteredState.jobs.cancelled.length - keepMostRecent;
    filteredState.jobs.cancelled = sortedCancelled.slice(0, keepMostRecent);
    console.log(`DeleteCompleteJobs: Deleted ${deletedCount} cancelled jobs, keeping ${keepMostRecent} most recent`);
  }

  return filteredState;
}

/**
 * Delete both completed and cancelled jobs from the given state
 */
export function deleteOldJobs(state: AcpState, keepCompleted: number = 10, keepCancelled: number = 5): AcpState {
  let filteredState = deleteCompletedJobs(state, keepCompleted);
  filteredState = deleteCancelledJobs(filteredState, keepCancelled);
  return filteredState;
} 