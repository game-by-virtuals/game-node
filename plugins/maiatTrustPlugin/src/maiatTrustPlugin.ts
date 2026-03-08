import {
  GameWorker,
  GameFunction,
  ExecutableGameFunctionResponse,
  ExecutableGameFunctionStatus,
} from "@virtuals-protocol/game";

// ─────────────────────────────────────────────
//  Config
// ─────────────────────────────────────────────

const DEFAULT_API_URL = "https://maiat-protocol.vercel.app";
const DEFAULT_MIN_SCORE = 3.0; // 0–10 scale
const DEFAULT_CHAIN = "base";

interface IMaiatTrustPluginOptions {
  id?: string;
  name?: string;
  description?: string;
  apiUrl?: string;
  apiKey?: string;
  minScore?: number;
  chain?: string;
}

interface TrustResponse {
  address: string;
  score: number;
  risk: "low" | "medium" | "high" | "unknown";
  type: string;
  flags: string[];
  safe: boolean;
  source: string;
}

// ─────────────────────────────────────────────
//  API client
// ─────────────────────────────────────────────

async function fetchTrustScore(
  identifier: string,
  apiUrl: string,
  chain: string,
  apiKey?: string
): Promise<TrustResponse> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "User-Agent": "game-maiat-plugin/0.1.0",
  };
  if (apiKey) headers["Authorization"] = `Bearer ${apiKey}`;

  // Try address-based lookup first, fall back to name search
  const isAddress = /^0x[0-9a-fA-F]{40}$/.test(identifier);
  const url = isAddress
    ? `${apiUrl}/api/v1/score/${identifier}?chain=${chain}`
    : `${apiUrl}/api/v1/trust-score`;

  const res = await fetch(url, {
    method: isAddress ? "GET" : "POST",
    headers,
    body: isAddress ? undefined : JSON.stringify({ projectName: identifier }),
  });

  if (!res.ok) {
    throw new Error(`Maiat API error: ${res.status} ${res.statusText}`);
  }

  const data = await res.json() as Record<string, any>;

  // Normalise both API response shapes
  if (isAddress && data["score"] !== undefined) {
    return {
      address: identifier,
      score: data["score"] as number,
      risk: data["riskLevel"] ?? scoreToRisk(data["score"] as number),
      type: data["type"] ?? "unknown",
      flags: data["flags"] ?? [],
      safe: (data["score"] as number) >= DEFAULT_MIN_SCORE,
      source: data["source"] ?? "maiat",
    };
  }

  // POST /api/v1/trust-score response shape
  const score = (data["trustScore"] as Record<string, any>)?.["overall"] ?? 0;
  return {
    address: identifier,
    score: score / 10, // convert 0–100 to 0–10
    risk: scoreToRisk(score / 10),
    type: (data["project"] as Record<string, any>)?.["category"] ?? "unknown",
    flags: [],
    safe: score / 10 >= DEFAULT_MIN_SCORE,
    source: "maiat",
  };
}

function scoreToRisk(score: number): "low" | "medium" | "high" | "unknown" {
  if (score >= 7) return "low";
  if (score >= 4) return "medium";
  if (score >= 0) return "high";
  return "unknown";
}

// ─────────────────────────────────────────────
//  Plugin class
// ─────────────────────────────────────────────

class MaiatTrustPlugin {
  private id: string;
  private name: string;
  private description: string;
  private apiUrl: string;
  private apiKey?: string;
  private minScore: number;
  private chain: string;

  constructor(options: IMaiatTrustPluginOptions = {}) {
    this.id = options.id ?? "maiat_trust_worker";
    this.name = options.name ?? "Maiat Trust Score Worker";
    this.description =
      options.description ??
      "Queries Maiat Protocol for trust scores of on-chain addresses, tokens, " +
        "DeFi protocols, and AI agents. Use before executing any swap, transfer, " +
        "or interaction to assess counterparty risk.";
    this.apiUrl = options.apiUrl ?? DEFAULT_API_URL;
    this.apiKey = options.apiKey;
    this.minScore = options.minScore ?? DEFAULT_MIN_SCORE;
    this.chain = options.chain ?? DEFAULT_CHAIN;
  }

  public getWorker(data?: {
    functions?: GameFunction<any>[];
    getEnvironment?: () => Promise<Record<string, any>>;
  }): GameWorker {
    return new GameWorker({
      id: this.id,
      name: this.name,
      description: this.description,
      functions: data?.functions ?? [
        this.checkTrustScore,
        this.gateSwap,
        this.batchCheckTrust,
      ],
      getEnvironment: data?.getEnvironment,
    });
  }

  // ── Function 1: check_trust_score ─────────────
  get checkTrustScore() {
    return new GameFunction({
      name: "check_trust_score",
      description:
        "Query the Maiat trust score for an on-chain address, token, DeFi protocol, " +
        "or AI agent. Returns a score (0–10), risk level, and any warning flags. " +
        "Use this before interacting with an unknown address or protocol.",
      args: [
        {
          name: "identifier",
          description:
            "Ethereum/Base address (0x...) OR project/agent name (e.g. 'Uniswap', 'AIXBT').",
          type: "string",
        },
        {
          name: "chain",
          description: "Blockchain to query. Defaults to 'base'.",
          type: "string",
          optional: true,
        },
      ] as const,
      executable: async (args: any, logger: any) => {
        try {
          if (!args.identifier) {
            return new ExecutableGameFunctionResponse(
              ExecutableGameFunctionStatus.Failed,
              "identifier is required (address or project name)"
            );
          }

          const chain = args.chain ?? this.chain;
          logger(`[Maiat] Checking trust score for: ${args.identifier} on ${chain}`);

          const result = await fetchTrustScore(
            args.identifier,
            this.apiUrl,
            chain,
            this.apiKey
          );

          const summary =
            `Trust score for ${args.identifier}: ${result.score.toFixed(1)}/10 ` +
            `| Risk: ${result.risk.toUpperCase()} ` +
            `| Safe: ${result.safe ? "YES" : "NO"} ` +
            (result.flags.length ? `| Flags: ${result.flags.join(", ")}` : "");

          logger(`[Maiat] ${summary}`);

          return new ExecutableGameFunctionResponse(
            ExecutableGameFunctionStatus.Done,
            JSON.stringify({ ...result, summary })
          );
        } catch (e: any) {
          logger(`[Maiat] Error: ${e.message}`);
          return new ExecutableGameFunctionResponse(
            ExecutableGameFunctionStatus.Failed,
            `Failed to query trust score: ${e.message}`
          );
        }
      },
    });
  }

  // ── Function 2: gate_swap ─────────────────────
  get gateSwap() {
    return new GameFunction({
      name: "gate_swap",
      description:
        "Check whether a swap is safe to execute based on Maiat trust scores for " +
        "both the input and output tokens. Returns APPROVED or REJECTED with reasons. " +
        "Always call this before executing a token swap.",
      args: [
        {
          name: "token_in",
          description: "Address or name of the token being sold (input token).",
          type: "string",
        },
        {
          name: "token_out",
          description: "Address or name of the token being bought (output token).",
          type: "string",
        },
        {
          name: "min_score",
          description: `Minimum trust score required (0–10). Defaults to ${DEFAULT_MIN_SCORE}.`,
          type: "number",
          optional: true,
        },
      ] as const,
      executable: async (args: any, logger: any) => {
        try {
          if (!args.token_in || !args.token_out) {
            return new ExecutableGameFunctionResponse(
              ExecutableGameFunctionStatus.Failed,
              "Both token_in and token_out are required"
            );
          }

          const minScore = args.min_score ?? this.minScore;
          logger(`[Maiat] Gating swap: ${args.token_in} → ${args.token_out} (min score: ${minScore})`);

          const [scoreIn, scoreOut] = await Promise.all([
            fetchTrustScore(args.token_in, this.apiUrl, this.chain, this.apiKey),
            fetchTrustScore(args.token_out, this.apiUrl, this.chain, this.apiKey),
          ]);

          const rejected: string[] = [];
          if (scoreIn.score < minScore) {
            rejected.push(
              `${args.token_in} score ${scoreIn.score.toFixed(1)} < ${minScore} (risk: ${scoreIn.risk})`
            );
          }
          if (scoreOut.score < minScore) {
            rejected.push(
              `${args.token_out} score ${scoreOut.score.toFixed(1)} < ${minScore} (risk: ${scoreOut.risk})`
            );
          }

          if (rejected.length > 0) {
            const reason = `REJECTED: ${rejected.join("; ")}`;
            logger(`[Maiat] ${reason}`);
            return new ExecutableGameFunctionResponse(
              ExecutableGameFunctionStatus.Failed,
              reason
            );
          }

          const approval =
            `APPROVED: ${args.token_in} (${scoreIn.score.toFixed(1)}/10) → ` +
            `${args.token_out} (${scoreOut.score.toFixed(1)}/10) — both pass threshold`;
          logger(`[Maiat] ${approval}`);

          return new ExecutableGameFunctionResponse(
            ExecutableGameFunctionStatus.Done,
            JSON.stringify({
              approved: true,
              token_in: scoreIn,
              token_out: scoreOut,
              message: approval,
            })
          );
        } catch (e: any) {
          logger(`[Maiat] Error: ${e.message}`);
          return new ExecutableGameFunctionResponse(
            ExecutableGameFunctionStatus.Failed,
            `Failed to gate swap: ${e.message}`
          );
        }
      },
    });
  }

  // ── Function 3: batch_check_trust ─────────────
  get batchCheckTrust() {
    return new GameFunction({
      name: "batch_check_trust",
      description:
        "Check trust scores for multiple addresses or project names at once. " +
        "Returns a ranked list with risk levels. Useful for comparing options before trading.",
      args: [
        {
          name: "identifiers",
          description: "Comma-separated list of addresses or project names.",
          type: "string",
        },
      ] as const,
      executable: async (args: any, logger: any) => {
        try {
          if (!args.identifiers) {
            return new ExecutableGameFunctionResponse(
              ExecutableGameFunctionStatus.Failed,
              "identifiers is required (comma-separated list)"
            );
          }

          const ids = args.identifiers
            .split(",")
            .map((s: string) => s.trim())
            .filter(Boolean)
            .slice(0, 10); // max 10

          logger(`[Maiat] Batch checking ${ids.length} identifiers`);

          const results = await Promise.allSettled(
            ids.map((id: string) =>
              fetchTrustScore(id, this.apiUrl, this.chain, this.apiKey)
            )
          );

          const scores = results.map((r, i) =>
            r.status === "fulfilled"
              ? r.value
              : { address: ids[i], score: 0, risk: "unknown", safe: false, error: (r as any).reason?.message }
          );

          // Sort by score descending
          scores.sort((a: any, b: any) => b.score - a.score);

          logger(`[Maiat] Batch complete. Top: ${scores[0]?.address} (${scores[0]?.score?.toFixed(1)}/10)`);

          return new ExecutableGameFunctionResponse(
            ExecutableGameFunctionStatus.Done,
            JSON.stringify({ count: scores.length, results: scores })
          );
        } catch (e: any) {
          return new ExecutableGameFunctionResponse(
            ExecutableGameFunctionStatus.Failed,
            `Batch check failed: ${e.message}`
          );
        }
      },
    });
  }
}

export { MaiatTrustPlugin, IMaiatTrustPluginOptions, TrustResponse };
export default MaiatTrustPlugin;
