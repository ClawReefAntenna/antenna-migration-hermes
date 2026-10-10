import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {loadHost} from '../plugin/host-config.mjs';
const app=process.env.APP_PACKAGE??new URL('..',import.meta.url).pathname,tmp=fs.mkdtempSync('/tmp/hm-'),cfg=path.join(tmp,'config.yaml');
const c={schemaVersion:1,policyRevision:'combined-smart-v1',receiver:'fixture',bearer:'z'.repeat(32),mcs:'dumb',inbox:'on',peers:{peer:{publicKey:'fixture-public-key',destinations:['main'],approvalByDestination:{main:true},mcs:'off'}},destinations:{main:'agent:main:existing'},inboxFile:path.join(tmp,'inbox.json'),replayFile:path.join(tmp,'replay.json')};
const host={model:{default:'unchanged'},desktop:{auto_continue:{enabled:true}},plugins:{enabled:['other'],entries:{antenna:{config:c,settings:{listen_port:18792,headless:{enabled:true}},llm:{allow_model_override:true}}}}};
const write=h=>fs.writeFileSync(cfg,JSON.stringify(h),{mode:0o600});write(host);
const run=(...args)=>spawnSync(process.execPath,[path.join(app,'migration/cli.mjs'),cfg,...args],{encoding:'utf8'});
let checks=0;const pass=(r,code=0)=>{assert.equal(r.status,code,r.stderr||r.stdout);checks++;return JSON.parse(code?r.stderr:r.stdout);};
try{
 const before=fs.readFileSync(cfg);const preview=pass(run());assert.equal(preview.hostChanged,false);assert.equal(preview.to,2);assert(!JSON.stringify(preview).includes(c.bearer));assert.deepEqual(fs.readFileSync(cfg),before);
 const output=path.join(tmp,'policy.json');pass(run(output));assert.equal(fs.statSync(output).mode&0o777,0o600);const exported=JSON.parse(fs.readFileSync(output));assert.deepEqual(exported.peers,c.peers);assert.deepEqual(exported.destinations,c.destinations);pass(run(output),1);
 const busy=structuredClone(host);busy.plugins.enabled.push('antenna');write(busy);pass(run('--apply'),1);assert.equal(loadHost(cfg).host.plugins.entries.antenna.config.schemaVersion,1);
 const smart=structuredClone(host);smart.plugins.entries.antenna.config.mcs='smart';smart.plugins.entries.antenna.config.peers.peer.mcs='smart';write(smart);const p=pass(run());assert.equal(p.mcs,'both');assert.equal(p.peers.peer,'both');pass(run('--apply'),1);
 write(host);fs.writeFileSync(c.inboxFile,'[{"status":"pending","body":"do not convert"}]',{mode:0o600});const legacy=fs.readFileSync(c.inboxFile);pass(run('--apply'),1);assert.deepEqual(fs.readFileSync(c.inboxFile),legacy);fs.unlinkSync(c.inboxFile);
 const invalid=structuredClone(host);invalid.plugins.entries.antenna.config.schemaVersion=99;write(invalid);pass(run(),1);
 write(host);pass(run('--wrong'),1);const r=pass(run('--apply'));assert(r.hostChanged);assert.equal(fs.statSync(r.recovery).mode&0o777,0o700);assert.deepEqual(fs.readFileSync(path.join(r.recovery,'config.before.yaml')),before);assert.equal(fs.statSync(path.join(r.recovery,'config.before.yaml')).mode&0o777,0o600);
 const after=loadHost(cfg).host;assert.equal(after.plugins.entries.antenna.config.schemaVersion,2);assert.deepEqual(after.model,host.model);assert.deepEqual(after.desktop,host.desktop);assert.deepEqual(after.plugins.enabled,['other']);assert.deepEqual(after.plugins.entries.antenna.settings,host.plugins.entries.antenna.settings);assert.deepEqual(after.plugins.entries.antenna.config.peers,c.peers);assert.equal(fs.existsSync(c.inboxFile),false);assert.equal(fs.existsSync(c.replayFile),false);checks++;
 fs.chmodSync(cfg,0o644);pass(run(),1);fs.chmodSync(cfg,0o600);const real=path.join(tmp,'real.yaml');fs.renameSync(cfg,real);fs.symlinkSync(real,cfg);pass(run(),1);
 console.log(JSON.stringify({passed:checks,hostSemanticsPreserved:true,noMessageStateWrites:true,privateRecovery:true}));
}finally{fs.rmSync(tmp,{recursive:true,force:true});}
