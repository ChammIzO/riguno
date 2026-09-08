"""Original MIT-licensed technical envelope meshes. Units: metres. Not manufacturer CAD."""
import json,struct,base64,pathlib
root=pathlib.Path(__file__).resolve().parents[1]/'configurator/public/models';root.mkdir(parents=True,exist_ok=True)
models={'cpu':[.04,.004,.04],'gpu':[.11,.05,.28],'ram':[.006,.133,.035],'motherboard':[.244,.003,.305],'psu':[.15,.086,.15],'case':[.22,.44,.44],'storage':[.022,.003,.08],'cpu-cooler':[.12,.157,.10],'fan':[.12,.12,.025]}
for name,size in models.items():
 vertices=[[(1 if i&(1<<axis) else -1)*size[axis]/2 for axis in range(3)] for i in range(8)]
 indices=[0,2,3,0,3,1,4,5,7,4,7,6,0,1,5,0,5,4,2,6,7,2,7,3,0,4,6,0,6,2,1,3,7,1,7,5]
 positions=b''.join(struct.pack('<fff',*v) for v in vertices);data=positions+struct.pack('<'+'H'*len(indices),*indices)
 doc={'asset':{'version':'2.0','generator':'Riguno envelope exporter','copyright':'Riguno contributors, MIT'},'scene':0,'scenes':[{'nodes':[0]}],'nodes':[{'mesh':0,'name':name+'-generic-envelope'}],'meshes':[{'primitives':[{'attributes':{'POSITION':0},'indices':1,'material':0}]}],'materials':[{'doubleSided':True,'pbrMetallicRoughness':{'baseColorFactor':[.3,.65,.61,1],'metallicFactor':.2,'roughnessFactor':.7}}],'buffers':[{'uri':'data:application/octet-stream;base64,'+base64.b64encode(data).decode(),'byteLength':len(data)}],'bufferViews':[{'buffer':0,'byteOffset':0,'byteLength':len(positions),'target':34962},{'buffer':0,'byteOffset':len(positions),'byteLength':len(data)-len(positions),'target':34963}],'accessors':[{'bufferView':0,'componentType':5126,'count':8,'type':'VEC3','min':[-s/2 for s in size],'max':[s/2 for s in size]},{'bufferView':1,'componentType':5123,'count':len(indices),'type':'SCALAR'}],'extras':{'accuracy':'generic envelope only','units':'metres','manufacturer_model':False}}
 (root/(name+'.gltf')).write_text(json.dumps(doc,indent=2))
(root/'manifest.json').write_text(json.dumps({k:{'file':k+'.gltf','dimensions_m':v,'license':'MIT','accuracy':'generic-envelope'} for k,v in models.items()},indent=2))
print('Exported',len(models),'local glTF meshes')
