"""Generate Mermaid ERD (docs/erd.mmd) from prisma/schema.prisma. Run from repo root: python3 docs/generate_erd.py"""
import re
src = open('prisma/schema.prisma').read()
SCALARS = {'String', 'Int', 'Float', 'Decimal', 'Boolean', 'DateTime', 'Json', 'BigInt', 'Bytes'}
ENUMS = set(re.findall(r'^enum\s+(\w+)', src, re.M))
models = {}
for m in re.finditer(r'^model\s+(\w+)\s*\{(.*?)^\}', src, re.M | re.S):
    n, b = m.group(1), m.group(2)
    t = re.search(r'@@map\("(\w+)"\)', b)
    fs = []
    for l in b.split('\n'):
        l = l.split('//')[0].strip()
        if not l or l.startswith('@@'):
            continue
        x = re.match(r'(\w+)\s+(\w+)(\[\])?(\?)?\s*(.*)', l)
        if x:
            fs.append(dict(name=x[1], type=x[2], list=bool(x[3]), opt=bool(x[4]), attrs=x[5]))
    models[n] = dict(table=t[1] if t else n, fields=fs)
tbl = {n: m['table'] for n, m in models.items()}
fkmap, rels = {}, []
for n, m in models.items():
    for f in m['fields']:
        r = re.search(r'@relation\(fields:\s*\[(\w+)\],\s*references:\s*\[(\w+)\]', f['attrs'])
        if r:
            ff = next(x for x in m['fields'] if x['name'] == r[1])
            fkmap.setdefault(n, set()).add(r[1])
            rels.append(dict(parent=f['type'], child=n, fk=r[1], ref=r[2], opt=ff['opt'], one='@unique' in ff['attrs']))

def entity(n, full=True):
    m = models[n]
    o = [f'    {m["table"]} {{']
    if full:
        for f in m['fields']:
            if f['type'] in models:
                continue
            t = f['type'] + ('[]' if f['list'] else '')
            k = []
            if '@id' in f['attrs']: k.append('PK')
            if f['name'] in fkmap.get(n, ()): k.append('FK')
            if '@unique' in f['attrs'] and 'PK' not in k: k.append('UK')
            line = f'        {t} {f["name"]}' + (f' {",".join(k)}' if k else '')
            if f['opt']: line += ' "nullable"'
            o.append(line)
    o.append('    }')
    return o

def relation(r):
    lab = r['fk'] if r['ref'] == 'id' else f"{r['fk']} to {r['ref']}"
    return f'    {tbl[r["parent"]]} {"|o" if r["opt"] else "||"}--{"o|" if r["one"] else "o{"} {tbl[r["child"]]} : "{lab}"'

def diagram(names=None):
    names = set(models) if names is None else set(names)
    stubs, rs = set(), []
    for r in rels:
        if r['parent'] in names or r['child'] in names:
            rs.append(r)
            stubs |= {r['parent'], r['child']} - names
    o = ['erDiagram']
    for n in models:
        if n in names: o += entity(n)
    for n in models:
        if n in stubs: o += entity(n, False)
    return '\n'.join(o + [relation(r) for r in rs])

if __name__ == '__main__':
    open('docs/erd.mmd', 'w').write(diagram() + '\n')
    print(len(models), 'models', len(rels), 'foreign keys')
