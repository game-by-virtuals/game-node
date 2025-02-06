import BountyPlugin from "./bountyPlugin";

export default BountyPlugin;

export const API_URL = "https://cd95diw9kg.us-east-1.awsapprunner.com/api";
export type Bounty = {
  id: string;
  title: string;
  description: string;
  value: number;
  bountyScore: number;
  fillingUserId: string | null;
  fillingUser?: {
    id: string;
    twitterHandle: string;
  };
  filled: Date | null;
  createdAt: Date;
  updatedAt: Date;
  creatingUsername: string;
  tweetId: string;
};
