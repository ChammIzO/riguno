import test from 'node:test';
import assert from 'node:assert/strict';
import {checks,power,retailerLinks} from '../configurator/lib/catalog.ts';
const part=(category,spec,listings=[])=>({id:'00000000-0000-4000-8000-000000000001',name:'fixture',brand:'test',category,spec,source:'https://example.org',listings});
test('rejects incompatible socket and memory generation',()=>{const b={CPU:part('CPU',{socket:'AM5'}),Motherboard:part('Motherboard',{socket:'LGA 1700',memory:{ram_type:'DDR4'}}),RAM:part('RAM',{ram_type:'DDR5'})};assert.equal(checks(b).filter(x=>x.level==='error').length,2);});
test('detects GPU physical obstruction',()=>{const r=checks({GPU:part('GPU',{length:350}),PCCase:part('PCCase',{max_video_card_length:300})});assert(r.some(x=>x.level==='error'&&x.detail.includes('-50 mm')));});
test('missing dimensions never imply physical compatibility',()=>{assert(checks({GPU:part('GPU',{}),PCCase:part('PCCase',{})}).some(x=>x.title==='Dégagement carte graphique'&&x.level==='unknown'));});
test('power estimate needs both CPU and GPU and includes overhead',()=>{assert.equal(power({CPU:part('CPU',{specifications:{tdp:100}})}),null);assert.equal(power({CPU:part('CPU',{specifications:{tdp:100}}),GPU:part('GPU',{tdp:200})}),375);});
test('retailer IDs never cross marketplaces or manufacture ASINs',()=>{const p=part('CPU',{},[{source:'amazon',channel:'fr',source_product_id:'B0CYHBTPTF'}]);assert.equal(retailerLinks(p,'de').length,0);assert.equal(retailerLinks(p,'fr')[0].url,'https://www.amazon.fr/dp/B0CYHBTPTF');});
