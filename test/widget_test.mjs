// 沅禾客服 widget 前端互動 dry-run。改 BaseLayout 的 widget 後 MUST 跑:
//   node test/widget_test.mjs
// 從 BaseLayout.astro 抽真正的 <script> 出來測(非複本),用假 DOM 驅動互動。
import fs from 'fs';
const src=fs.readFileSync(new URL('../src/layouts/BaseLayout.astro',import.meta.url),'utf8');
const code=src.slice(src.indexOf('<script is:inline>')+18, src.indexOf('</script>'));
function mkEl(){return {hidden:false,onclick:null,onsubmit:null,className:'',innerHTML:'',
  value:'',scrollTop:0,scrollHeight:0,children:[],appendChild(c){this.children.push(c);},
  addEventListener(ev,fn){if(ev==='click')this.onclick=fn;if(ev==='submit')this.onsubmit=fn;}};}
let els={};
function freshEls(){['yhc-root','yhc-fab','yhc-panel','yhc-msgs','yhc-form','yhc-input','yhc-close']
  .forEach(id=>els[id]=mkEl()); els['yhc-panel'].hidden=true;}  // 忠實 HTML <div hidden>
freshEls();
globalThis.document={getElementById:id=>els[id],createElement:()=>mkEl()};
globalThis.localStorage={_d:{},getItem(k){return this._d[k]||null;},setItem(k,v){this._d[k]=v;}};
let fetchMode='ok';
globalThis.fetch=(url)=> fetchMode==='throw' ? Promise.reject(new Error('net'))
  : url.endsWith('/health') ? Promise.resolve({ok:fetchMode==='ok'})
  : Promise.resolve({json:()=>Promise.resolve({kind:'answer',reply:'測試回覆'})});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
let pass=0,fail=0; const chk=(n,c)=>{console.log((c?'✅':'❌')+' '+n);c?pass++:fail++;};
(async()=>{
  eval(code);
  const F=els['yhc-fab'],P=els['yhc-panel'],M=els['yhc-msgs'],C=els['yhc-close'],FM=els['yhc-form'],I=els['yhc-input'];
  chk('初始 panel 隱藏',P.hidden===true);
  F.onclick();await sleep(20);
  chk('展開後 panel 顯示',P.hidden===false); chk('展開後 fab 隱藏',F.hidden===true);
  const g=M.children.length; chk('有問候泡泡',g>=1);
  C.onclick(); chk('最小化後 panel 隱藏',P.hidden===true); chk('最小化後 fab 顯示',F.hidden===false);
  F.onclick();await sleep(20);
  chk('重開後 panel 再顯示',P.hidden===false); chk('重開沒重複問候(對話保留)',M.children.length===g);
  I.value='磁磚空心嚴重嗎'; await FM.onsubmit({preventDefault(){}}); await sleep(20);
  chk('送出新增泡泡',M.children.length>g);
  freshEls(); fetchMode='throw'; eval(code); els['yhc-fab'].onclick(); await sleep(30);
  chk('後端掛→離線降級卡',els['yhc-msgs'].children.some(c=>(c.innerHTML||'').includes('離線')));
  console.log('\n結果: '+pass+' pass / '+fail+' fail'); process.exit(fail?1:0);
})();
