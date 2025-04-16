import {PrimusCoreTLS, Attestation} from "@primuslabs/zktls-core-sdk";


export class PrimusClient {
    private zkTLS: PrimusCoreTLS = new PrimusCoreTLS();
    async init(appId: string, appSecret: string) {
        await this.zkTLS.init(appId, appSecret);
        console.log('init zkTLS success')
    }

    /**
     *
     * @param endpoint
     * @param method
     * @param headers
     * @param responseParsePath  Data you want to get in response
     * @param body
     */

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

