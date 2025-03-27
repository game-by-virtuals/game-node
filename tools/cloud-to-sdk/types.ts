// types.ts
export interface PluginJson {
    name: string;
    goal: string;
    description: string;
    gameEngineModel: string;
    workers: Worker[];
    customFunctions: CustomFunction[];
  }
  
  interface Worker {
    id: string;
    name: string;
    description: string;
    workerId: string;
    environment?: Record<string, any>;
    isDefault?: boolean;
    deleted?: boolean;
    environmentString?: string;
  }
  
  interface CustomFunction {
    id: string;
    fn_name: string;
    fn_description: string;
    args: FunctionArg[];
    hint?: string;
    config: {
        workerId: string;
        [key: string]: any;  // For other config properties
    };
    workerId?: string;
  }
  
  interface FunctionArg {
    id: string;
    name: string;
    description: string;
    type: string;
  }