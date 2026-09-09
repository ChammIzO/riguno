import { z } from 'zod';
const categories = z.enum(['CPU','GPU','Motherboard','RAM','Storage','PCCase','PSU','CPUCooler','CaseFan']);
export const portableBuild = z.object({schemaVersion:z.literal(1),name:z.string().trim().min(1).max(80),parts:z.record(categories,z.string().uuid()).refine(x=>Object.keys(x).length>0)});
const savedBuild = portableBuild.extend({id:z.string().uuid(),updated_at:z.string()});
export type PortableBuild = z.infer<typeof portableBuild>;
const key = 'riguno-saved-builds';
export function readLocalBuilds() { const raw=localStorage.getItem(key);return raw?z.array(savedBuild).max(100).parse(JSON.parse(raw)):[]; }
export function saveLocalBuild(value:unknown) { const valueParsed=portableBuild.parse(value);const list=readLocalBuilds();if(list.length>=100)throw Error('Limite de 100 configurations : supprimer une ancienne sauvegarde.');const item={...valueParsed,id:crypto.randomUUID(),updated_at:new Date().toISOString()};localStorage.setItem(key,JSON.stringify([item,...list]));return item; }
export function deleteLocalBuild(id:string){localStorage.setItem(key,JSON.stringify(readLocalBuilds().filter(x=>x.id!==id)));}
export function encodeBuild(value:unknown){const parsed=portableBuild.parse(value);const bytes=new TextEncoder().encode(JSON.stringify(parsed));return btoa(Array.from(bytes,b=>String.fromCharCode(b)).join('')).replaceAll('+','-').replaceAll('/','_').replace(/=+$/,'');}
export function decodeBuild(value:string){if(value.length>5000||!/^[a-zA-Z0-9_-]+$/.test(value))throw Error('Lien de configuration invalide');const bytes=Uint8Array.from(atob(value.replaceAll('-','+').replaceAll('_','/')),c=>c.charCodeAt(0));return portableBuild.parse(JSON.parse(new TextDecoder().decode(bytes)));}
