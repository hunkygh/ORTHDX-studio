"use client";
import {useState,useEffect,useMemo,useRef} from 'react';
const blank={nodes:[],edges:[],months:12};
const types=['Product','Sales rep','Revenue pool','Allocation','Expense','Profit'];
const sampleGraph={months:12,nodes:[
{id:'p-web',type:'Product',name:'Websites',x:35,y:35,price:1500,units:5,growth:4},
{id:'p-ai',type:'Product',name:'AI automations',x:35,y:205,price:3000,units:3,growth:6},
{id:'p-crm',type:'Product',name:'CRM systems',x:35,y:375,price:2500,units:2,growth:5},
{id:'rep-1',type:'Sales rep',name:'Rep A — websites',x:335,y:35,quota:7500,attainment:100},
{id:'rep-2',type:'Sales rep',name:'Rep B — AI',x:335,y:205,quota:9000,attainment:100},
{id:'rep-3',type:'Sales rep',name:'Rep C — CRM',x:335,y:375,quota:5000,attainment:100},
{id:'pool',type:'Revenue pool',name:'Gross revenue',x:635,y:205},
{id:'rep-pay',type:'Allocation',name:'Sales commissions',x:940,y:25,percent:60},
{id:'matt',type:'Allocation',name:'Matt override',x:940,y:165,percent:12},
{id:'mgmt',type:'Allocation',name:'Management fund',x:940,y:305,percent:3},
{id:'retained',type:'Allocation',name:'ORTHDX retained',x:940,y:445,percent:25},
{id:'cost',type:'Expense',name:'Operating expenses',x:1230,y:335,percent:0,fixed:1000},
{id:'profit',type:'Profit',name:'Net profit',x:1230,y:505}
],edges:[
{from:'p-web',to:'rep-1'},{from:'p-ai',to:'rep-2'},{from:'p-crm',to:'rep-3'},
{from:'rep-1',to:'pool'},{from:'rep-2',to:'pool'},{from:'rep-3',to:'pool'},
{from:'pool',to:'rep-pay'},{from:'pool',to:'matt'},{from:'pool',to:'mgmt'},{from:'pool',to:'retained'},
{from:'retained',to:'profit'},{from:'cost',to:'profit'}
]};

const money=n=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(Number.isFinite(n)?n:0);
const id=()=>Math.random().toString(36).slice(2,10);
const box={width:210,height:116};
function calc(nodes,edges,month){
 const vals={},errors={};const byId=Object.fromEntries(nodes.map(n=>[n.id,n]));const visiting=new Set();
 function value(k){
  if(k in vals)return vals[k];if(visiting.has(k)){errors[k]='Circular connection';return 0;}
  const n=byId[k];if(!n)return 0;visiting.add(k);
  const incoming=edges.filter(e=>e.to===k).reduce((sum,e)=>sum+value(e.from),0);
  let out=0;
  if(n.type==='Product')out=(+n.price||0)*(+n.units||0)*Math.pow(1+(+n.growth||0)/100,month-1);
  else if(n.type==='Sales rep')out=incoming?Math.min(incoming,(+n.quota||0)*(+n.attainment||100)/100):(+n.quota||0)*(+n.attainment||100)/100;
  else if(n.type==='Allocation')out=incoming*(+n.percent||0)/100;
  else if(n.type==='Expense')out=incoming?incoming*(+n.percent||0)/100+(+n.fixed||0):(+n.fixed||0);
  else if(n.type==='Profit'){const sources=edges.filter(e=>e.to===k);out=sources.reduce((s,e)=>s+(byId[e.from]?.type==='Expense'?-1:1)*value(e.from),0)}
  else out=incoming;
  visiting.delete(k);vals[k]=out;return out;
 }
 nodes.forEach(n=>value(n.id));return {vals,errors};
}
export default function Canvas(){
 const [graph,setGraph]=useState(blank),[selected,setSelected]=useState(null),[connect,setConnect]=useState(null),[month,setMonth]=useState(1),[ready,setReady]=useState(false),[drag,setDrag]=useState(null),[zoom,setZoom]=useState(1),[notice,setNotice]=useState('');const stage=useRef(null);
 useEffect(()=>{try{const saved=JSON.parse(localStorage.getItem('orthdx-canvas-v1'));if(saved&&Array.isArray(saved.nodes)&&Array.isArray(saved.edges))setGraph(saved)}catch{}setReady(true)},[]);
 useEffect(()=>{if(ready)localStorage.setItem('orthdx-canvas-v1',JSON.stringify(graph))},[graph,ready]);
 const results=useMemo(()=>calc(graph.nodes,graph.edges,month),[graph,month]);
 const chosen=graph.nodes.find(n=>n.id===selected);
 const update=(key,val)=>setGraph(g=>({...g,nodes:g.nodes.map(n=>n.id===selected?{...n,[key]:val}:n)}));
 const add=(type)=>{const nid=id();setGraph(g=>({...g,nodes:[...g.nodes,{id:nid,type,name:type+' '+(g.nodes.filter(n=>n.type===type).length+1),x:100+(g.nodes.length%4)*250,y:100+Math.floor(g.nodes.length/4)*170,price:0,units:0,growth:0,quota:0,attainment:100,percent:0,fixed:0}]}));setSelected(nid)};
 const link=(target)=>{if(!connect){setNotice('Tap the arrow on a source node first.');return}if(connect===target){setNotice('Choose a different destination node.');return}if(graph.edges.some(e=>e.from===connect&&e.to===target)){setNotice('These nodes are already connected.');setConnect(null);return}const candidate={from:connect,to:target};const check=(from,to,seen=new Set())=>{if(from===to)return true;if(seen.has(from))return false;seen.add(from);return [...graph.edges,candidate].filter(e=>e.from===from).some(e=>check(e.to,to,new Set(seen)))};if(check(target,connect)){setNotice('Connection would create a circular dependency.');return}setGraph(g=>({...g,edges:[...g.edges,candidate]}));setNotice('Connection created.');setConnect(null)};
 const onMove=e=>{if(!drag||!stage.current)return;const rect=stage.current.getBoundingClientRect();const x=Math.max(0,(e.clientX-rect.left+stage.current.scrollLeft)/zoom-drag.dx),y=Math.max(0,(e.clientY-rect.top+stage.current.scrollTop)/zoom-drag.dy);setGraph(g=>({...g,nodes:g.nodes.map(n=>n.id===drag.id?{...n,x,y}:n)}))};
 const field=(key,label)=> <label style={{display:'grid',gap:5,fontSize:12,marginBottom:14}}>{label}<input type="number" value={chosen?.[key]??0} onChange={e=>update(key,e.target.value)} style={input}/></label>;
 const card={background:'#f5f5ef',border:'1px solid #a8aa9e',borderRadius:12,padding:18};
 const button={padding:'10px 13px',background:'#e4f7c9',border:'1px solid #8b9b76',borderRadius:7,cursor:'pointer',fontWeight:600};
 return <main style={{minHeight:'100vh',background:'#e8e9df',color:'#20241d',fontFamily:'Arial, sans-serif',padding:'24px clamp(12px,3vw,45px)'}}>
 <header style={{display:'flex',justifyContent:'space-between',flexWrap:'wrap',gap:12,borderBottom:'1px solid #a3a69a',paddingBottom:18}}><strong>ORTHDX <span style={{fontWeight:400}}>/ FINANCIAL CANVAS</span></strong><nav style={{display:'flex',gap:20}}><a href="/flow" style={{color:'inherit'}}>Flow atlas</a><a href="/" style={{color:'inherit'}}>Forecasts</a></nav></header>
 <h1 style={{fontSize:'clamp(38px,6vw,76px)',letterSpacing:'-.06em',margin:'30px 0 8px'}}>Map the money<span style={{color:'#7fa84d'}}>.</span></h1><p style={{marginTop:0,maxWidth:720}}>Create products, reps, and financial destinations. Drag nodes, connect their ports, then move through time. All values are hypothetical and stored in this browser.</p>
 <div style={{display:'flex',flexWrap:'wrap',gap:8,margin:'25px 0'}}><button style={{...button,background:'#26382a',color:'#fff'}} onClick={()=>{if(graph.nodes.length&&!window.confirm('Replace the current canvas with the ORTHDX sample?'))return;setGraph(structuredClone(sampleGraph));setSelected(null);setConnect(null);setMonth(1);setNotice('Sample loaded: 3 products, 3 reps, revenue pool, allocations, costs and profit. Illustrative assumptions only.')}}>Load ORTHDX sample</button>{types.map(t=><button key={t} style={button} onClick={()=>add(t)}>+ {t}</button>)}</div>
 <div style={{display:'grid',gridTemplateColumns:'minmax(0,1fr) minmax(240px,290px)',gap:14,alignItems:'start'}}>
 <section style={{...card,padding:12,overflow:'hidden'}}><div style={{display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:10,padding:'8px 9px 16px',fontSize:12}}><b>01 / NETWORK</b><span>{connect?'Connecting from '+(graph.nodes.find(n=>n.id===connect)?.name||'node')+' — tap + on destination':'Drag nodes · arrow = source · + = destination'}</span><div style={{display:'flex',gap:6,alignItems:'center'}}><button type="button" onClick={()=>setZoom(z=>Math.max(.4,Math.round((z-.2)*10)/10))} aria-label="Zoom out" style={button}>−</button><span style={{minWidth:48,textAlign:'center'}}>{Math.round(zoom*100)}%</span><button type="button" onClick={()=>setZoom(z=>Math.min(2,Math.round((z+.2)*10)/10))} aria-label="Zoom in" style={button}>+</button><button type="button" onClick={()=>setZoom(1)} style={button}>Reset</button></div></div>{notice&&<p role="status" style={{fontSize:12,padding:'0 10px',color:'#45632e'}}>{notice}</p>}
 <div ref={stage} onPointerMove={onMove} onPointerUp={()=>setDrag(null)} onPointerCancel={()=>setDrag(null)} onWheel={e=>{if(e.ctrlKey||e.metaKey){e.preventDefault();setZoom(z=>Math.max(.4,Math.min(2,Math.round((z+(e.deltaY<0?.1:-.1))*10)/10)))}}} onKeyDown={e=>{if(e.key==='Escape'){setConnect(null);setNotice('Connection canceled.')}}} tabIndex={0} style={{overflow:'auto',height:550,backgroundColor:'#fdfdf7',backgroundImage:'radial-gradient(#d2d5c8 1px,transparent 1px)',backgroundSize:'22px 22px',borderRadius:8,touchAction:'pan-x pan-y'}}>
 <div style={{width:Math.max(1200,...graph.nodes.map(n=>n.x+box.width+70))*zoom,height:Math.max(540,...graph.nodes.map(n=>n.y+box.height+70))*zoom}}><div style={{position:'relative',transform:`scale(${zoom})`,transformOrigin:'top left',width:Math.max(1200,...graph.nodes.map(n=>n.x+box.width+70)),height:Math.max(540,...graph.nodes.map(n=>n.y+box.height+70))}}>
 <svg style={{position:'absolute',inset:0,width:'100%',height:'100%',pointerEvents:'none'}}>{graph.edges.map((e,i)=>{const a=graph.nodes.find(n=>n.id===e.from),b=graph.nodes.find(n=>n.id===e.to);if(!a||!b)return null;const x=a.x+box.width,y=a.y+55,xx=b.x,yy=b.y+55;return <path key={i} d={`M ${x} ${y} C ${x+90} ${y}, ${xx-90} ${yy}, ${xx} ${yy}`} fill="none" stroke="#7b9957" strokeWidth={Math.max(2,Math.min(13,Math.sqrt(Math.abs(results.vals[e.from]||0))/90))} opacity=".8"/>})}</svg>
 {graph.nodes.map(n=><div key={n.id} style={{position:'absolute',left:n.x,top:n.y,width:box.width,height:box.height,border:selected===n.id?'2px solid #668d39':'1px solid #777e6c',borderRadius:10,background:'#f4f5eb',boxShadow:'0 4px 0 #d8dbc9',boxSizing:'border-box'}}>
 <div onPointerDown={e=>{if(e.button!==0)return;setSelected(n.id);e.currentTarget.setPointerCapture(e.pointerId);const rect=stage.current.getBoundingClientRect();setDrag({id:n.id,dx:(e.clientX-rect.left+stage.current.scrollLeft)/zoom-n.x,dy:(e.clientY-rect.top+stage.current.scrollTop)/zoom-n.y})}} style={{cursor:'grab',padding:'12px 14px 7px',touchAction:'none'}}><div style={{fontSize:10,letterSpacing:1,color:'#6d7564'}}>{n.type.toUpperCase()}</div><strong style={{fontSize:15,display:'block',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{n.name}</strong><div style={{fontSize:18,marginTop:5,fontWeight:700}}>{money(results.vals[n.id])}</div></div>
 <button title="Connect into this node" onClick={()=>{setSelected(n.id);link(n.id)}} style={{position:'absolute',left:-11,top:45,border:'1px solid #667b4b',borderRadius:20,background:'#d9fba8',width:21,height:21,cursor:'pointer'}}>+</button>
 <button title="Start connection from this node" onClick={()=>{setConnect(n.id);setSelected(n.id);setNotice('Now tap + on the destination node.')}} style={{position:'absolute',right:-11,top:45,border:'1px solid #667b4b',borderRadius:20,background:connect===n.id?'#a3d75d':'#d9fba8',width:21,height:21,cursor:'pointer'}}>→</button></div>)}
 {!graph.nodes.length&&<div style={{padding:45,color:'#6b7165'}}>Blank canvas. Add a product or sales rep to begin.</div>}</div></div></div></section>
 <aside style={{display:'grid',gap:14}}><div style={card}><b style={{fontSize:12}}>02 / TIME</b><p style={{fontSize:25,margin:'12px 0'}}>Month {month} <span style={{fontSize:12,color:'#666'}}>of {graph.months}</span></p><input aria-label="Projection month" type="range" min="1" max={graph.months} value={month} onChange={e=>setMonth(+e.target.value)} style={{width:'100%',accentColor:'#729b43'}}/><label style={{display:'grid',gap:5,fontSize:12,marginTop:14}}>Forecast horizon<input type="number" min="1" max="60" value={graph.months} onChange={e=>{const v=Math.min(60,Math.max(1,+e.target.value||1));setGraph(g=>({...g,months:v}));setMonth(m=>Math.min(m,v))}} style={input}/></label></div>
 <div style={card}><b style={{fontSize:12}}>03 / NODE INSPECTOR</b>{chosen?<><label style={{display:'grid',gap:5,fontSize:12,margin:'16px 0'}}>Name<input style={input} value={chosen.name} onChange={e=>update('name',e.target.value)}/></label><p style={{fontSize:12,color:'#66715e'}}>{chosen.type} · {money(results.vals[chosen.id])}</p>{chosen.type==='Product'&&<>{field('price','Price per sale ($)')}{field('units','Monthly sales units')}{field('growth','Monthly growth (%)')}</>}{chosen.type==='Sales rep'&&<>{field('quota','Monthly revenue quota ($)')}{field('attainment','Quota attainment (%)')}</>}{chosen.type==='Allocation'&&field('percent','Share of incoming revenue (%)')}{chosen.type==='Expense'&&<>{field('fixed','Fixed monthly expense ($)')}{field('percent','Variable cost (%)')}</>}{chosen.type==='Profit'&&<p style={{fontSize:12}}>Incoming expense nodes are deducted; other incoming nodes are added.</p>}{chosen.type==='Revenue pool'&&<p style={{fontSize:12}}>Sums all incoming sources.</p>}<button style={{...button,background:'#f8e2d8'}} onClick={()=>{setGraph(g=>({...g,nodes:g.nodes.filter(n=>n.id!==selected),edges:g.edges.filter(e=>e.from!==selected&&e.to!==selected)}));setSelected(null)}}>Delete node</button></>:<p style={{fontSize:13,color:'#646b60'}}>Select a node to edit its assumptions and inspect its projected output.</p>}</div>
 <div style={card}><b style={{fontSize:12}}>04 / CONNECTIONS</b>{graph.edges.length?graph.edges.map((e,i)=><div key={i} style={{display:'flex',gap:8,justifyContent:'space-between',fontSize:12,marginTop:12}}><span>{graph.nodes.find(n=>n.id===e.from)?.name} → {graph.nodes.find(n=>n.id===e.to)?.name}</span><button onClick={()=>setGraph(g=>({...g,edges:g.edges.filter((_,j)=>j!==i)}))} aria-label="Remove connection">×</button></div>):<p style={{fontSize:13,color:'#646b60'}}>No connections yet.</p>}</div>
 </aside></div><p style={{fontSize:12,marginTop:20}}>Note: Connections represent dependencies. Sales rep quotas cap incoming product revenue; allocation nodes apply their own percentages. For precise rep-by-product attribution and conservation-checked splits, the calculation model will need an expanded routing layer.</p></main>
}
const input={padding:'10px 12px',border:'1px solid #b1b5a8',borderRadius:6,background:'#fff',color:'#1c211a',fontSize:15,width:'100%',boxSizing:'border-box'};
