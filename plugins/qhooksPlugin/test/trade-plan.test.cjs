const {test}=require("node:test");const assert=require("node:assert/strict");
const {getQHooksWorker}=require("../dist/index.js");const{validTrade,tamperedTrades}=require("./trade-fixture.cjs");
const request={chain:"4663",token:"0x"+"1".repeat(40),trader:"0x"+"2".repeat(40),side:"buy",amountIn:"9007199254740993001"};
for(const transport of ["mcp","rest"]){
 const workerFor=data=>{let calls=0;const worker=getQHooksWorker({enabled:true,transport,fetchImpl:async(_url,init)=>{calls++;const body=init?.body?JSON.parse(String(init.body)):{};return Response.json(transport==="mcp"?{jsonrpc:"2.0",id:body.id,result:{structuredContent:data,content:[{type:"text",text:JSON.stringify(data)}]}}:data);}});return{worker,calls:()=>calls};};
 const invoke=(worker,input)=>worker.functions.find(f=>f.name==="qhooks_prepare_trade").execute({input:{value:JSON.stringify(input)}},()=>{throw Error("No external logging");});
 test(`validates native/ERC20 trade plans over ${transport}`,async()=>{for(const side of["buy","sell"])for(const chain of["4663","8453","99901"]){const input={...request,chain,side},plan=validTrade(input),f=workerFor(plan),result=await invoke(f.worker,input);assert.equal(result.status,"done");assert.deepEqual(JSON.parse(result.feedback),plan);assert.equal(f.calls(),1);}});
 test(`rejects altered trade plans over ${transport}`,async()=>{for(const{name,plan}of tamperedTrades(request)){const f=workerFor(plan),result=await invoke(f.worker,request);assert.equal(result.status,"failed",name);assert.equal(JSON.parse(result.feedback).error.code,"unsafe_trade_plan",name);assert.equal(f.calls(),1);}});
}
