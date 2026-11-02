// Shared, dependency-free validation for ClickUp scenario envelopes.
// This module does not perform network requests or grant access.
export const SCHEMA_VERSION = 1;
export function validateScenario(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Scenario must be an object');
  if (value.schemaVersion !== SCHEMA_VERSION) throw new Error('Unsupported scenario schema');
  if (typeof value.scenarioId !== 'string' || !value.scenarioId.trim()) throw new Error('Missing scenario ID');
  if (typeof value.name !== 'string' || !value.name.trim() || value.name.length > 160) throw new Error('Invalid scenario name');
  if (!Number.isSafeInteger(value.revision) || value.revision < 1) throw new Error('Invalid revision');
  if (typeof value.updatedAt !== 'string' || !Number.isFinite(Date.parse(value.updatedAt))) throw new Error('Invalid update timestamp');
  const m=value.model;
  if (!m || !Array.isArray(m.nodes) || !Array.isArray(m.edges) || !Number.isSafeInteger(m.months) || m.months < 1 || m.months > 60) throw new Error('Invalid model');
  if (m.nodes.length > 500 || m.edges.length > 1500) throw new Error('Model too large');
  const ids=new Set();
  for(const n of m.nodes) {
    if(!n || typeof n.id!=='string' || !n.id || ids.has(n.id) || typeof n.type!=='string' || typeof n.name!=='string' || !Number.isFinite(Number(n.x)) || !Number.isFinite(Number(n.y))) throw new Error('Invalid node');
    ids.add(n.id);
  }
  for(const e of m.edges) if(!e || !ids.has(e.from) || !ids.has(e.to) || e.from===e.to) throw new Error('Invalid connection');
  const adj=new Map([...ids].map(id=>[id,[]]));
  for(const e of m.edges) adj.get(e.from).push(e.to);
  const visited=new Set(),active=new Set();
  function walk(id){if(active.has(id))throw new Error('Circular dependency');if(visited.has(id))return;active.add(id);for(const to of adj.get(id))walk(to);active.delete(id);visited.add(id)}
  for(const id of ids)walk(id);
  return value;
}
export function serializeScenario(scenario) {
  return '```json\n'+JSON.stringify(validateScenario(scenario),null,2)+'\n```';
}
export function parseScenarioPage(text) {
  if(typeof text!=='string')throw new Error('Missing page content');
  const block=text.match(/```json\s*([\s\S]*?)\s*```/i);
  return validateScenario(JSON.parse(block?block[1]:text.trim()));
}
export function createScenario(name,model,scenarioId) {
  return validateScenario({schemaVersion:SCHEMA_VERSION,scenarioId,name,revision:1,updatedAt:new Date().toISOString(),model:{nodes:model.nodes,edges:model.edges,months:model.months},published:true});
}
