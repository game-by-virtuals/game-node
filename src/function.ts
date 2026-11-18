export enum ExecutableGameFunctionStatus {
  Done = "done",
  Failed = "failed",
}

export type ExecutableGameFunctionStatusType = "done" | "failed";

export class ExecutableGameFunctionResponse {
  public status: ExecutableGameFunctionStatus;
  public feedback: string;

  constructor(
    status: ExecutableGameFunctionStatus,
    feedback: string
  ) {
    this.status = status;
    this.feedback = feedback;
  }

  toJson() {
    return {
      action_id: "",
      status: this.status,
      feedback_message: this.feedback,
    };
  }
}

// ─── DACS-Standard Guardrail (§9.5.7 & §14.4) ─────────────────────────────
export interface DacsMandateMeta {
  dacsMandate?: string;
  dacsSessionId?: string;
  dacsMaxAmount?: number | string;
}

export function assertDacsSpendMandate(
  args: Record<string, any> & DacsMandateMeta
): void {
  if (!args || (!args.dacsMandate && !args.dacsSessionId)) {
    return;
  }

  if (args.dacsMaxAmount !== undefined) {
    const ceiling = Number(args.dacsMaxAmount);
    const rawAmount = args.amount ?? args.value ?? args.spendAmount ?? 0;
    const requested = Number(rawAmount);

    if (!Number.isNaN(ceiling) && !Number.isNaN(requested) && requested > ceiling) {
      throw new Error(
        `[DACS-Standard §9.5.7] GameFunction execution aborted: requested spend (${requested}) exceeds authorized mandate ceiling (${ceiling}).`
      );
    }
  }
}

interface IGameFunction<T extends GameFunctionArg[]> {
  name: string;
  description: string;
  args: T;
  executable: (
    args: GameFunctionArgs<T>,
    logger: (msg: string) => void
  ) => Promise<ExecutableGameFunctionResponse>;
  hint?: string;
}

export interface GameFunctionArg {
  name: string;
  description: string;
  type?: string;
  optional?: boolean;
}

export type GameFunctionParams = {
  name: string;
  description: string;
  args: GameFunctionArg[];
  hint?: string;
  executable: (
    args: Record<string, string>,
    logger: (msg: string) => void
  ) => Promise<ExecutableGameFunctionResponse>;
  executable2?: (
    args: Record<string, { value: string }>,
    logger: (msg: string) => void
  ) => Promise<ExecutableGameFunctionResponse>;
};

type GameFunctionArgs<T extends GameFunctionArg[]> = {
  [K in T[number]["name"]]: string;
};

class GameFunction<T extends GameFunctionArg[]> implements IGameFunction<T> {
  public name: string;
  public description: string;
  public args: T;
  public executable: (
    args: GameFunctionArgs<T>,
    logger: (msg: string) => void
  ) => Promise<ExecutableGameFunctionResponse>;
  public hint: string;

  constructor(params: GameFunctionParams) {
    this.name = params.name;
    this.description = params.description;
    this.args = params.args as T;
    this.executable = params.executable;
    this.hint = params.hint || "";
  }

  toJson() {
    return {
      fn_name: this.name,
      fn_description: this.description,
      args: this.args,
      hint: this.hint,
    };
  }

  async execute(
    args: {
      [K in T[number]["name"]]: { value: string };
    } & DacsMandateMeta,
    logger: (msg: string) => void
  ) {
    const arguments_ = Object.keys(args).reduce(
      (acc, key) => {
        if (
          key === "dacsMandate" ||
          key === "dacsSessionId" ||
          key === "dacsMaxAmount"
        ) {
          return acc;
        }
        acc[key as keyof GameFunctionArgs<T>] = args[key].value;
        return acc;
      },
      {} as GameFunctionArgs<T>
    );

    // DACS-Standard (§9.5.7) Pre-Flight Mandate Enforcement
    assertDacsSpendMandate({
      ...arguments_,
      dacsMandate: args.dacsMandate,
      dacsSessionId: args.dacsSessionId,
      dacsMaxAmount: args.dacsMaxAmount,
    });

    return await this.executable(arguments_, logger);
  }
}

export default GameFunction;
