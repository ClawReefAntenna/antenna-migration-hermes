#!/usr/bin/env node
// Native Hermes policy conversion only. No relay retirement, runtime install,
// inbox conversion, credential rotation, activation or service restart.
import fs from 'node:fs';
import path from 'node:path';
import {loadHost} from '../plugin/host-config.mjs';
import {migrate} from './schema.mjs';
import {Inbox} from '../plugin/inbox.mjs';
import {validateConfig} from '../plugin/policy.mjs';
import {resolveHermesScanner} from '../hermes/smart.mjs';
try{
 const [file,...args]=process.argv.slice(2);
 if(!file||args.length>1||args[0]?.startsWith('-')&&args[0]!=='--apply')throw Error('Usage: node migration/cli.mjs CONFIG_YAML [NEW_POLICY_JSON | --apply]; stop all profile writers before applying');
 const storage=loadHost(file);
 if(storage.runtime!=='hermes')throw Error('Use the intended Hermes config.yaml; OpenClaw has a separate migration kit');
 const {host,original}=storage,before=host.plugins?.entries?.antenna?.config;
 if(!before)throw Error('No existing Antenna policy; use the normal new-install path');
 const next=migrate(before);
 // Fail closed on unsupported inbox formats; never rewrite message state.
 new Inbox(next.inboxFile,{readOnly:true}).read();
 const report={from:before.schemaVersion,to:next.schemaVersion,mcs:next.mcs,peers:Object.fromEntries(Object.entries(next.peers).map(([k,v])=>[k,v.mcs??'default'])),inbox:'preserved',activation:'unchanged',hostChanged:false,policyWritten:false};
 if(args[0]==='--apply'){
  if((host.plugins.enabled??[]).includes('antenna'))throw Error('Disable Antenna and stop all profile writers before applying; no activation changes are made by this kit');
  // Preserve the previous core command's Smart readiness check.
  validateConfig(next,{requireReady:true,host,resolveModel:resolveHermesScanner});
  if(fs.readFileSync(file,'utf8')!==original)throw Error('configuration changed; preview again');
  // Keep private recovery material before an atomic compare-and-swap host write.
  const recovery=fs.mkdtempSync(path.join(path.dirname(path.resolve(file)),'.antenna-migration-'));
  fs.chmodSync(recovery,0o700);
  fs.writeFileSync(path.join(recovery,'config.before.yaml'),original,{flag:'wx',mode:0o600});
  fs.writeFileSync(path.join(recovery,'RECOVERY.txt'),'Keep Antenna disabled and profile writers stopped. config.before.yaml is a private preimage, not an automatic downgrade. Recover unrelated settings manually if needed; never replace current inbox, replay or receipt state with an old snapshot.\n',{flag:'wx',mode:0o600});
  const copy=structuredClone(host);copy.plugins.entries.antenna.config=next;
  try{storage.save(copy);}catch(e){throw Error('Apply blocked; host write not confirmed. Preserve recovery directory '+recovery+' and inspect before retrying');}
  Object.assign(report,{hostChanged:true,restartRequired:true,recovery});
 }else if(args[0]){
  fs.writeFileSync(args[0],JSON.stringify(next,null,2)+'\n',{flag:'wx',mode:0o600});report.policyWritten=true;
 }
 console.log(JSON.stringify(report));
}catch(e){console.error(JSON.stringify({status:'blocked',reason:e instanceof SyntaxError?'invalid JSON input':e.message}));process.exitCode=1;}
