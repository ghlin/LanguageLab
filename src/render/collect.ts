import indentString = require('indent-string');
import { CxxDecl } from './cxxdecl';

export interface CollectConfig {
  indentWidth: number;

  indent(content: string): string;
}

export function simpleCollectConfig(indentWidth: number = 2): CollectConfig {
  class SimpleCollectConfig implements CollectConfig {
    constructor(readonly indentWidth: number) { }
    indent(content: string): string {
      return indentString(content, this.indentWidth);
    }
  }

  return new SimpleCollectConfig(indentWidth);
}

export class Scope {
  constructor( readonly scope:      string
             , readonly source:     CxxDecl[]
             , readonly introduces: string[]
             , readonly before:     string[]
             , readonly after:      string[]) { }

  static of( scope:      string
           , source:     CxxDecl[]|CxxDecl
           , introduces: string[]|string = []
           , before:     string[]|string = []
           , after:      string[]|string = []) {
    const normalize = <T>(src: T[]|T): T[] => {
      if (Array.isArray(src)) return src;
      else                    return [ src ];
    }

    return new Scope( scope
                    , normalize(source)
                    , normalize(introduces)
                    , normalize(before)
                    , normalize(after)
                    );
  }

  static combine(o: string[][]) {
    const s = o.reduce((acc, a) => acc.concat(a)).sort();

    const [ last, u ] = s.reduce(([last, uniq], a) => {
      if (last === a)
        return [last, uniq] as [string, string[]];
      else
        return [a, uniq.concat(a)] as [string, string[]];
    }, [null, []] as [string|null, string[]]);

    return u;
  }

  static seq(scopes: Scope[]): Scope {
    if (scopes.length === 0)
      throw new Error(`seq: scopes length should > 0`);

    const s0 = scopes[0];
    if (scopes.some(s => s.scope !== s0.scope))
      throw new Error(`seq: scope mismatch!`);

    const introduces = Scope.combine(scopes.map(s => s.introduces));
    const before     = Scope.combine(scopes.map(s => s.before));
    const after      = Scope.combine(scopes.map(s => s.after));

    const source     = scopes.map(s => s.source)
      .reduce((acc, u) => acc.concat(u), []);

    return Scope.of( s0.scope
                   , source
                   , introduces
                   , before
                   , after
                   );
  }
}

export interface Collect {
  collect(s: CollectState, c: CollectConfig): Scope[];
}

export class CollectState {
  private nextId: number = 0;

  public acquireName(): string {
    return `kvar_${this.nextId++}`;
  }

  constructor() { }
}

