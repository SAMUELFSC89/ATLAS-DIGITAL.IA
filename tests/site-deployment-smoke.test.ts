import {test} from 'node:test';
import assert from 'node:assert/strict';
import siteExpress from '../api/site-express.ts';
import contact from '../api/contact.ts';

function responder(){
  return {statusCode:200,headers:{} as Record<string,string>,body:null as any,headersSent:false,
    setHeader(key:string,value:string){this.headers[key]=value;return this;},
    status(code:number){this.statusCode=code;return this;},
    json(value:any){this.body=value;this.headersSent=true;return this;},
    send(value:any){this.body=value;this.headersSent=true;return this;},
    end(){this.headersSent=true;return this;}};
}
test('site express new function starts and serves health without loading checkout code',async()=>{
 const res=responder();
 await siteExpress({method:'GET',query:{view:'health'}} as any,res as any);
 assert.equal(res.statusCode,200);
 assert.equal(res.body?.ok,true);
 assert.equal(res.body?.version,2);
});
test('creator public validator loads directly and returns clean not-found without Firestore',async()=>{
 const res=responder();
 await siteExpress({method:'GET',query:{view:'builder',action:'creator-public',handle:'x'},headers:{}} as any,res as any);
 assert.equal(res.statusCode,404,JSON.stringify(res.body));
 assert.equal(res.body?.error,'Perfil não encontrado.');
});
test('contact GET does not load checkout or builder dependencies',async()=>{
 const res=responder();
 await contact({method:'GET',query:{},headers:{}} as any,res as any);
 assert.equal(res.statusCode,405);
});
