import { config } from 'dotenv';
import { resolve } from 'node:path';

// Load environment variables
config({ path: resolve(__dirname, '../.env') });

import {
  GameWorker,
  GameFunction,
  ExecutableGameFunctionResponse,
  ExecutableGameFunctionStatus,
} from '@virtuals-protocol/game';
import type { GigbotGig } from './types';

class GigbotPlugin {
  private id: string;
  private name: string;
  private description: string;
  private baseUrl = 'https://www.gigbot.xyz/api';
  private gigbotBaseUrl = 'https://gig-bot.bot.gigbot.xyz/api';
  private gigbotCheckIfCompletedEndpoint = `${this.gigbotBaseUrl}/tasks/check-completed`;
  private fetchGigsEndpoint = `${this.baseUrl}/gigs?status=active&platforms=x`;
  private gigCache: { data: GigbotGig[]; timestamp: number } | null = null;
  private cacheExpirationMs = 3 * 60 * 60 * 1000; // 3 hours in milliseconds

  constructor() {
    this.id = 'gigbot_worker';
    this.name = 'Gigbot Worker';
    this.description =
      'A worker that interacts with the Gigbot API to complete gigs.\
	  Check my environment for fetching twitter profile details like username/etc when needed.';
  }

  public getWorker(data?: {
    functions?: GameFunction<any>[];
    getEnvironment?: () => Promise<Record<string, any>>;
  }): GameWorker {
    return new GameWorker({
      id: this.id,
      name: this.name,
      description: this.description,
      functions: data?.functions || [
        this.getGigbotGigsFunction,
        this.checkIfAlreadyCompletedGigFunction,
        this.getGigByIdFunction,
      ],
      getEnvironment: data?.getEnvironment,
    });
  }

  private isCacheValid(): boolean {
    if (!this.gigCache) return false;

    const now = Date.now();
    return now - this.gigCache.timestamp < this.cacheExpirationMs;
  }

  get getGigbotGigsFunction() {
    return new GameFunction({
      name: 'get_gigbot_gigs',
      description: 'Get current active gigs from gigbot',
      args: [] as const,
      executable: async (args, logger) => {
        try {
          // Check if cache is valid
          if (this.isCacheValid()) {
            logger?.('Using cached gigs data');
            return new ExecutableGameFunctionResponse(
              ExecutableGameFunctionStatus.Done,
              JSON.stringify(
                this.gigCache?.data.map((gig) => ({
                  ...gig,
                  tweet_id: gig.external_url?.split('/').pop(),
                })),
              ),
            );
          }

          // Cache is invalid or doesn't exist, fetch new data
          logger?.('Fetching fresh gigs data');
          const response = await fetch(`${this.fetchGigsEndpoint}`);
          if (!response.ok) {
            throw new Error('Failed to fetch gigs');
          }
          const data = (await response.json()) as { data: GigbotGig[] };

          const gigsWithTweetId = data.data.map((gig) => ({
            ...gig,
            tweet_id: gig.external_url?.split('/').pop(),
          }));
          // Update cache
          this.gigCache = {
            data: gigsWithTweetId,
            timestamp: Date.now(),
          };

          return new ExecutableGameFunctionResponse(
            ExecutableGameFunctionStatus.Done,
            JSON.stringify(gigsWithTweetId),
          );
        } catch (e) {
          return new ExecutableGameFunctionResponse(
            ExecutableGameFunctionStatus.Failed,
            'Failed to fetch gigs',
          );
        }
      },
    });
  }

  get checkIfAlreadyCompletedGigFunction() {
    return new GameFunction({
      name: 'check_if_already_completed_gig',
      description:
        'Check if a gig has already been completed. Always use this function before completing a gig. The gig id is the id of the gig we are planning to complete. The username is the username of the twitter account we are using to complete the gig.\
				',
      args: [
        {
          name: 'id',
          description: 'The ID of the gig we are planning to complete',
          type: 'number',
        },
        {
          name: 'username',
          description: 'the username of my twitter account',
          type: 'string',
        },
      ] as const,
      executable: async (args, logger) => {
        logger?.(`Checking if gig ${args.id} has already been completed`);
        try {
          const response = await fetch(
            `${this.gigbotCheckIfCompletedEndpoint}`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
              },
              body: JSON.stringify({
                gigId: args.id,
                platformUserId: args.username,
              }),
            },
          );

          if (!response.ok) {
            logger?.(
              `Error response: ${response.status} ${response.statusText}`,
            );
            // Try to get the error message from the response body
            try {
              const errorData = await response.json();
              logger?.(`Error details: ${JSON.stringify(errorData)}`);
            } catch (e) {
              // Ignore if we can't parse the error response
            }
            throw new Error(
              `Failed to check if gig has already been completed: ${response.status}`,
            );
          }

          const data = (await response.json()) as {
            isCompleted: boolean;
            success: boolean;
          };

          if (!data.success) {
            return new ExecutableGameFunctionResponse(
              ExecutableGameFunctionStatus.Failed,
              'Failed to check if gig has already been completed: API reported failure',
            );
          }

          return new ExecutableGameFunctionResponse(
            ExecutableGameFunctionStatus.Done,
            JSON.stringify(data),
          );
        } catch (e) {
          logger?.(`Error checking gig completion: ${e}`);
          return new ExecutableGameFunctionResponse(
            ExecutableGameFunctionStatus.Failed,
            `Failed to check if gig has already been completed: ${e}`,
          );
        }
      },
    });
  }

  private async getGigById(
    id: number,
    logger?: (message: string) => void,
  ): Promise<GigbotGig | null> {
    // Check if cache is valid first
    if (this.isCacheValid() && this.gigCache?.data) {
      logger?.(`Looking for gig ID ${id} in cache`);
      const foundGig = this.gigCache.data.find((gig) => gig.id === id);
      if (foundGig) return foundGig;
    }

    // If cache invalid or gig not found in cache, fetch fresh data
    logger?.(`Fetching fresh data to find gig ID ${id}`);
    const response = await fetch(`${this.fetchGigsEndpoint}`);
    if (!response.ok) {
      throw new Error('Failed to fetch gigs');
    }

    const data = (await response.json()) as { data: GigbotGig[] };

    const gigsWithTweetId = data.data.map((gig) => ({
      ...gig,
      tweet_id: gig.external_url?.split('/').pop(),
    }));

    // Update cache
    this.gigCache = {
      data: gigsWithTweetId,
      timestamp: Date.now(),
    };

    // Find the gig in the fresh data
    return gigsWithTweetId.find((gig) => gig.id === id) || null;
  }

  get getGigByIdFunction() {
    return new GameFunction({
      name: 'get_gig_by_id',
      description: 'Get a specific gig by its ID',
      args: [
        {
          name: 'id',
          description: 'The ID of the gig to find',
          type: 'number',
        },
      ] as const,
      executable: async (args, logger) => {
        if (!args.id) {
          return new ExecutableGameFunctionResponse(
            ExecutableGameFunctionStatus.Failed,
            'Gig ID is required',
          );
        }
        try {
          const gig = await this.getGigById(Number(args.id), logger);

          if (!gig) {
            return new ExecutableGameFunctionResponse(
              ExecutableGameFunctionStatus.Failed,
              `Gig with ID ${args.id} not found`,
            );
          }

          // Process the gig to add tweet_id
          const processedGig = {
            ...gig,
            tweet_id: gig.external_url?.split('/').pop(),
          };

          return new ExecutableGameFunctionResponse(
            ExecutableGameFunctionStatus.Done,
            JSON.stringify(processedGig),
          );
        } catch (e) {
          return new ExecutableGameFunctionResponse(
            ExecutableGameFunctionStatus.Failed,
            `Failed to get gig with ID ${args.id}: ${e}`,
          );
        }
      },
    });
  }
}

export default GigbotPlugin;
