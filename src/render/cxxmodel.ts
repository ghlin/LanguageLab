import { CollectConfig } from './collect';
import { CxxType, CxxName, CxxValue, CxxDecl, decl
       , NameFn, InitFn } from './cxxdecl';

const nullInit = (q: string, t: CxxType) => [ ];
const qualifiedName = (n: CxxName) => (q: string, t: CxxType) => `${q}${n}`;

export function slot( name: CxxName
                    , type: CxxType
                    , init: CxxValue|null = null): CxxDecl {
  return decl( `${type} ${name};`
             , init ? ((s: string) => [ `${s}${name} = ${init};` ]) : nullInit
             , qualifiedName(name)
             , qualifiedName(type)
             );
}

const nonEmpty = <T>(x: T[]) => x.length !== 0;
const project  = <T, K extends keyof T>(s: T[], k: K) => {
  return s.map(x => x[k]);
}

const liftInit = (slots: CxxDecl[], c: CollectConfig): InitFn => {
  return (q: string, t: string) => {
    return project(slots, 'initialization')
    .map(initFn => initFn(q, t))
    .filter(nonEmpty)
    .reduce((acc, u) => acc.concat(u));
  };
}

const liftDecl = (slots: CxxDecl[], c: CollectConfig): string[] => {
  return project(slots, 'declaration')
    .filter(nonEmpty)
    .reduce((acc, u) => acc.concat(u))
    .map(s => c.indent(s));
}


export function struct(stName: CxxType, name: CxxName, slots: CxxDecl[], c: CollectConfig): CxxDecl {
  const liftedInitFn = liftInit(slots, c);
  const liftedDecls  = [ `struct ${stName} {` ]
    .concat(liftDecl(slots, c))
    .concat('};')
    .concat(`${stName} ${name};`);

  return decl( liftedDecls
             , liftedInitFn
             , qualifiedName(name)
             , qualifiedName(stName)
             );
}

export function union(stName: CxxName, name: CxxName, slots: CxxDecl[], c: CollectConfig): CxxDecl {
  const liftedDecls  = [ `union ${stName} {` ]
    .concat(liftDecl(slots, c))
    .concat('};')
    .concat(`${stName} ${name};`);

  return decl( liftedDecls
             , () => []
             , qualifiedName(name)
             , qualifiedName(stName)
             );
}

