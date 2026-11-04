export const money=n=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(Number.isFinite(n)?n:0);
export const pct=n=>new Intl.NumberFormat('en-US',{maximumFractionDigits:1}).format(n)+'%';
export const defaults={months:12,websiteReps:5,hires:1,repChurn:3,dealsPerRep:2,buildPrice:2100,buildTake:85,websiteMonthly:250,toolCost:50,recurringTake:60,clientChurn:3,coachPartners:2,newPartners:1,partnerChurn:2,clientsPerPartner:20,clientPrice:200,platformTake:20,companyClients:1,newCompanies:1,repsPerCompany:15,attributedRevenue:10000,performanceFee:5,companyChurn:2,recruitingFee:0,repSplit:60,referralSplit:12,managementSplit:3,fixedCosts:3000,marketingRate:10};
export const groups=[
{title:'Website sales',description:'Upfront cash and recurring Corex website services',fields:[['websiteReps','Starting sales reps','count'],['hires','Reps recruited / month','count'],['repChurn','Rep churn / month','percent'],['dealsPerRep','Deals / active rep / month','count'],['buildPrice','Average build fee','money'],['buildTake','ORTHDX share of build fee','percent'],['websiteMonthly','Monthly website package','money'],['toolCost','Direct monthly tool cost / client','money'],['recurringTake','ORTHDX share of net recurring','percent'],['clientChurn','Website client churn / month','percent']]},
{title:'Coaching partners',description:'Partner sets pricing and coaches; ORTHDX supplies infrastructure',fields:[['coachPartners','Starting coaching partners','count'],['newPartners','New partners / month','count'],['partnerChurn','Partner churn / month','percent'],['clientsPerPartner','Paying clients per partner','count'],['clientPrice','Monthly client price','money'],['platformTake','ORTHDX revenue share','percent']]},
{title:'CRM performance overlay',description:'Client keeps existing CRM; coach sells and delivers service',fields:[['companyClients','Starting client companies','count'],['newCompanies','New companies / month','count'],['companyChurn','Company churn / month','percent'],['repsPerCompany','Active reps per company','count'],['attributedRevenue','Attributed revenue / rep / month','money'],['performanceFee','ORTHDX contracted share of attributed revenue','percent'],['recruitingFee','Optional recruiting fee / company / month','money']]},
{title:'Operations & allocation',description:'Illustrative internal payouts and operating expense assumptions',fields:[['repSplit','Website rep share of ORTHDX receipts','percent'],['referralSplit','Website referral override','percent'],['managementSplit','Website management share','percent'],['fixedCosts','Fixed monthly expenses','money'],['marketingRate','Marketing reinvestment / month','percent'],['months','Forecast horizon (months)','count']]}
];
export const clamp=(v,min,max)=>Math.min(max,Math.max(min,v));
export function parse(q={}){return Object.fromEntries(Object.entries(defaults).map(([k,d])=>{const n=Number(q[k]);return [k,q[k]===undefined||q[k]===''||!Number.isFinite(n)?d:clamp(n,0,k==='months'?36:10000000)]}))}
export function forecast(a){let reps=a.websiteReps,sites=0,partners=a.coachPartners,companies=a.companyClients;const rows=[];const n=clamp(Math.round(a.months),1,36);for(let i=0;i<n;i++){if(i){reps=reps*(1-clamp(a.repChurn,0,100)/100)+a.hires;partners=partners*(1-clamp(a.partnerChurn,0,100)/100)+a.newPartners;companies=companies*(1-clamp(a.companyChurn,0,100)/100)+a.newCompanies;sites*=1-clamp(a.clientChurn,0,100)/100}
const deals=reps*a.dealsPerRep;sites+=deals;
const buildGross=deals*a.buildPrice;const buildReceipts=buildGross*clamp(a.buildTake,0,100)/100;
const websiteNetBase=sites*Math.max(0,a.websiteMonthly-a.toolCost);const websiteRecurring=websiteNetBase*clamp(a.recurringTake,0,100)/100;
const websiteReceipts=buildReceipts+websiteRecurring;
const repsPaid=websiteReceipts*clamp(a.repSplit,0,100)/100,referralsPaid=websiteReceipts*clamp(a.referralSplit,0,100)/100,managementPaid=websiteReceipts*clamp(a.managementSplit,0,100)/100;
const coachingReceipts=partners*a.clientsPerPartner*a.clientPrice*clamp(a.platformTake,0,100)/100;
const performanceReceipts=companies*a.repsPerCompany*a.attributedRevenue*clamp(a.performanceFee,0,100)/100;
const recruitingReceipts=companies*a.recruitingFee;
const gross=websiteReceipts+coachingReceipts+performanceReceipts+recruitingReceipts;
const marketing=gross*clamp(a.marketingRate,0,100)/100;
const retained=gross-repsPaid-referralsPaid-managementPaid;
const profit=retained-a.fixedCosts-marketing;
rows.push({month:i+1,reps,deals,sites,partners,companies,buildReceipts,websiteRecurring,websiteReceipts,coachingReceipts,performanceReceipts,recruitingReceipts,gross,repsPaid,referralsPaid,managementPaid,marketing,retained,profit})}return rows}
