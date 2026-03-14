import {
    GameWorker,
    GameFunction,
    ExecutableGameFunctionResponse,
    ExecutableGameFunctionStatus,
} from "@virtuals-protocol/game";
import {PrimusClient} from "./util/primusClient";
import {TwitterScraper} from "./util/twitterScraper";

interface ITwitterPrimusPluginOptions {
    // Parameter for worker
    id: string;
    name: string;
    description: string;

    // Parameter for PrimusClient
    appId: string;
    appSecret: string;

    // Parameter for twitter client
    username: string;
    password: string;
    email: string;
    twitter2faSecret: string;
}

class TwitterPrimusPlugin {
    private id!: string ;
    private name!: string;
    private description!: string;

    private twitterScraper!: TwitterScraper;
    private primusClient!: PrimusClient;


    constructor() {
    }

    public async init(options: ITwitterPrimusPluginOptions) {
        // Init primus client
        this.id = options.id || "twitter_primus_worker";
        this.name = options.name || "twitter_primus_worker";
        this.description = options.description || "A worker that all behaviors are verifiable with primus zktls";
        this.primusClient = new PrimusClient();
        if (!options.appId || !options.appSecret) {
            return new Error("appId and appSecret are required");
        }
        await this.primusClient.init(options.appId, options.appSecret)
        this.twitterScraper = new TwitterScraper(this.primusClient);
        await this.twitterScraper.login(options.username, options.password, options.email, options.twitter2faSecret);
    }

    public getWorker(data?: {
        functions?: GameFunction<any>[];
        getEnvironment?: () => Promise<Record<string, any>>;
    }): GameWorker {
        if(!this.primusClient||!this.twitterScraper){
            throw new Error("Primus client is not initialized");
        }
        return new GameWorker({
            id: this.id,
            name: this.name,
            description: this.description,
            functions: data?.functions || [
                this.postTweetFunction
            ],
            getEnvironment: data?.getEnvironment || this.getMetrics.bind(this),
        });
    }

    public async getMetrics() {
        return {
            status: "success"
        };
    }


    get postTweetFunction() {
        return new GameFunction({
            name: "post_tweet",
            description: "Post a tweet with BTC price",
            args: [] as const,
            executable: async (args, logger) => {
                try {
                    //
                    logger("Getting btc price with zktls...");
                    // Get price of BTC with primus client
                    const btcPriceStr = await this.getLatestBTCPriceFromBinance(logger)
                    const priceInfo = JSON.parse(btcPriceStr.feedback)
                    // Post tweet with primus client
                    logger(`Posting tweet with price: ${priceInfo.price}`);
                    const rsp = await this.twitterScraper.sendTweet(priceInfo.price,logger);
                    return new ExecutableGameFunctionResponse(
                        ExecutableGameFunctionStatus.Done,
                        JSON.stringify({
                            rsp: "Tweet posted",
                            attestation: rsp.attestation
                        })
                    );
                } catch (e) {
                    console.log(e)
                    return new ExecutableGameFunctionResponse(
                        ExecutableGameFunctionStatus.Failed,
                        "Failed to post tweet"
                    );
                }
            },
        });
    }


    private async getLatestBTCPriceFromBinance(logger: any) {
        //get btc price
        const url = `https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT`;
        const method = 'GET';
        const headers = {
            'Accept	': '*/*',
        };
        const attestation = await this.primusClient.generateProof(url, method, headers,"$.price");
        const valid = await this.primusClient.verifyProof(attestation);
        if (!valid) {
            throw new Error("Invalid price attestation");
        }
        logger(`price attestation:${JSON.stringify(attestation)}`);
        try {
            const responseData = JSON.parse((attestation as any).data);
            const price = responseData.content;
            return new ExecutableGameFunctionResponse(
                ExecutableGameFunctionStatus.Done,
                JSON.stringify({
                    price: price,
                    attestation: attestation
                })
            );
        } catch (error) {
            console.log(error)
            throw new Error('Failed to parse price data');
        }
    }
}

export default TwitterPrimusPlugin;
