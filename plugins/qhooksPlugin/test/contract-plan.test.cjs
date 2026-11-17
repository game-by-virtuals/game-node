const{test}=require("node:test"),assert=require("node:assert/strict");
const{getQHooksWorker}=require("../dist/index.js");const{contractCases,contractFetch,contractAttacks}=require("./contract-fixture.cjs");
for(const transport of ["mcp","rest"]){
const invoke=c=>{const worker=getQHooksWorker({enabled:true,transport,fetchImpl:contractFetch(c,transport)});return worker.functions.find(f=>f.name==="qhooks_"+c.tool).execute({input:{value:JSON.stringify(c.input)}},()=>{throw Error("No logging");});};
test(`accepts pinned exact contract approvals and actions over ${transport}`,async()=>{for(const c of contractCases()){const out=await invoke(c);assert.equal(out.status,"done",c.tool+out.feedback);}});
test(`rejects attacker/unlimited/native/wrong-chain contract plans over ${transport}`,async()=>{for(const c of contractCases())for(const bad of contractAttacks(c)){const out=await invoke(bad);assert.equal(out.status,"failed",bad.tool+bad.name);assert.equal(JSON.parse(out.feedback).error.code,"unsafe_contract_plan",bad.tool+bad.name);}});
}
