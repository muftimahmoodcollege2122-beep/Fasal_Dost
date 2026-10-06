import re,sys,json
src=open('./prisma/schema.prisma').read()
models={}
enums=set(re.findall(r'^enum\s+(\w+)',src,re.M))
for m in re.finditer(r'^model\s+(\w+)\s*\{(.*?)^\}',src,re.M|re.S):
    name,body=m.group(1),m.group(2)
    table=re.search(r'@@map\("(\w+)"\)',body)
    fields=[]
    for line in body.split('\n'):
        line=line.split('//')[0].strip()
        if not line or line.startswith('@@'): continue
        mm=re.match(r'(\w+)\s+(\w+)(\[\])?(\?)?\s*(.*)',line)
        if not mm: continue
        fields.append(dict(name=mm[1],type=mm[2],list=bool(mm[3]),opt=bool(mm[4]),attrs=mm[5]))
    models[name]=dict(table=table[1] if table else name,fields=fields)
scalars={'String','Int','Float','Decimal','Boolean','DateTime','Json','BigInt','Bytes'}
problems=[];rels=[];out=['erDiagram']
for n,m in models.items():
    fk={}
    for f in m['fields']:
        r=re.search(r'@relation\(fields:\s*\[(\w+)\],\s*references:\s*\[(\w+)\]',f['attrs'])
        if r: fk[r[1]]=(f['type'],r[2],f)
    if not any('@id' in f['attrs'] for f in m['fields']): problems.append(f'{n}: no PK')
    for f in m['fields']:
        if f['type'] in models or f['list'] and f['type'] in models: continue
    for fname,(tgt,ref,rf) in fk.items():
        ff=next(x for x in m['fields'] if x['name']==fname)
        one='@unique' in ff['attrs']
        left='|o' if ff['opt'] else '||'
        right='o|' if one else 'o{'
        rels.append(f'    {models[tgt]["table"]} {left}--{right} {m["table"]} : "{fname}"')
    out.append(f'    {m["table"]} {{')
    for f in m['fields']:
        if f['type'] in models: continue
        t=f['type'] if f['type'] in scalars else 'String'
        keys=[]
        if '@id' in f['attrs']: keys.append('PK')
        if f['name'] in fk: keys.append('FK')
        if '@unique' in f['attrs'] and 'PK' not in keys: keys.append('UK')
        t=t+('_arr' if f['list'] else '')
        out.append(f'        {t} {f["name"]} {",".join(keys)}'.rstrip())
    out.append('    }')
out+=rels
open('./docs/erd.mmd','w').write('\n'.join(out)+'\n')
print(len(models),'models',len(rels),'FKs','PROBLEMS:',problems)
