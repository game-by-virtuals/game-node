# @virtuals-protocol/game-twitter-primus-plugin

A plugin to fully verify agent activities, including actions and other behaviors that use HTTPS.

## Overview
This plugin verifies the validity of network requests and responses using the [Primus zk-tls SDK](https://docs.primuslabs.xyz/data-verification/zk-tls-sdk/overview/). It generates and verifies a zkTLS proof based on the zkTLS protocol.

## Usage

Here is full code of PrimusClient.
```typescript

export class PrimusClient {
  private zkTLS: PrimusCoreTLS = new PrimusCoreTLS();
  async init(appId: string, appSecret: string) {
    await this.zkTLS.init(appId, appSecret);
    console.log('init zkTLS success')
  }

  
  generateProof = async (
          endpoint: string,
          method: string,
          headers: Record<string, any>,
          responseParsePath: string,
          body?: string,
  ): Promise<Attestation> => {
    const requestParam = body
            ? {
              url: endpoint,
              method: method,
              header: headers,
              body: body,
            }
            : {
              url: endpoint,
              method: method,
              header: headers,
            };
    // console.log('requestParam:',requestParam)
    const attestationParams = this.zkTLS.generateRequestParams(requestParam, [
      {
        keyName: "content",
        parsePath: responseParsePath,
        parseType: "string",
      },
    ]);
    attestationParams.setAttMode({
      algorithmType: "proxytls",
    });
    return await this.zkTLS.startAttestation(attestationParams);
  };

  verifyProof = async (attestation: Attestation): Promise<boolean> => {
    return this.zkTLS.verifyAttestation(attestation);
  };
}
```

The core functions in `PrimusClient` are the following, which are also used in `GameFunction`.
```typescript
// Generate a zkTLS proof.
generateProof = async (
    // The target endpoint of the network request.
    endpoint: string,
    // The HTTP method of the request, such as 'GET', 'POST', etc.
    method: string,
    // A record containing the headers of the request.
    headers: Record<string, any>,
    //A [JSONPath](https://datatracker.ietf.org/doc/rfc9535/) expression to locate the specific field in the response you want to attest.
    responseParsePath: string,
    // The body of the request. It should be a string.
    body?: string

): Promise<any>

// Verify the proof.
verifyProof = async (attestation: any): Promise<boolean>

```

### Verify the Actions

Below is an example showcasing how to post a price from Binance to Twitter. Developers can easily adapt this process for other functions.
```typescript
//.............
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
}
//.........
```

## Installation

```bash
pnpm add @virtuals-protocol/game-twitter-primus-plugin
```

## Configuration

This is the configuration class, and you must provide all required parameters in it.

```
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
```

***How to get appId and appSecret?***

1. Visit the [Primus Developer Hub](https://dev.primuslabs.xyz/).
2. Create a new `Backend` project
3. Save your 'Application ID(appId)' and 'Secret Key(appSecret)'


Here is a demo to show how to run this plugin
[Example](./example/README.md)
