export type Field = Layer|Param;

import indentWith = require('indent-string');

export class Layer {
  readonly t = 'Layer';

  constructor( readonly name:   string
             , readonly params: Param[]
             , readonly body:   Field[]    = []
             , readonly next:   Layer|null = null)
  { }

  hasBody(): boolean { return this.body.length !== 0 }

  getLayerField(entry: string, defaults: Layer|null = null): Layer|null {
    const glob = this.body
      .filter(l => l.t === 'Layer')
      .filter((l: Layer) => l.name !== entry) as (Layer|null)[];

    return glob.concat(defaults)[0];
  }

  getValueField(entry: string, defaults: Param|null = null): Param|null {
    const glob = this.body
      .filter(l => l.t === 'Named')
      .filter((l: Named) => l.k === entry) as Named[];

    if (glob.length === 0)
      return defaults;
    else
      return glob[0].v;
  }

  static of( name:   string
           , params: Param[]
           , body:   Field[] = []
           , next:   Layer|null = null)
  { return new Layer(name, params, body, next); }

  private ppHead(): string {
    const params = this.params.map(x => x.toString()).join(', ');
    return this.params.length === 0
      ? `${this.name}` : `${this.name}(${params})`;
  }

  private ppEB(): string {
    if (!this.next)
      return `${this.ppHead()}`;

    const tailPP = this.next.toString();
    return `${this.ppHead()} ${tailPP}`;
  }

  private ppBody(): string {
    return this.body.map(x => {
      if (x.t === 'Layer')
        return `- ${indentWith(x.toString(), 2).substr(2)}`;
      else
        return `- ${x.t}: ${x}`;
    }).map(x => '  ' + x).join('\n');
  }

  toString(): string {
    if (this.body.length === 0) {
      return this.ppEB();
    }

    return `${this.ppHead()}\n${this.ppBody()}`;
  }
}

export class StringLit {
  readonly t = 'StringLit';

  constructor(readonly _: string) { }

  static of(_: string) { return new StringLit(_); }

  toString() { return `"${this._}"`; }
}

export class NumberLit {
  readonly t = 'NumberLit';

  constructor(readonly _: number) { }

  static of(_: number) { return new NumberLit(_); }

  toString() { return `${this._}`; }
}

export class BooleanLit {
  readonly t = 'BooleanLit';

  constructor(readonly _: boolean) { }

  static of(_: boolean) { return new BooleanLit(_); }

  toString() { return `${this._}`; }
}

export class CxxInterpolation {
  readonly t = 'CxxInterpolation';

  constructor(readonly _: string) { }

  static of(_: string) { return new CxxInterpolation(_); }

  toString() { return `Cxx {${this._}}`; }
}

export class CoreInterpolation {
  readonly t = 'CoreInterpolation';

  constructor(readonly _: string) { }

  static of(_: string) { return new CoreInterpolation(_); }

  toString() { return `Core {${this._}}`; }
}

export type  Atom = BooleanLit
                  | StringLit
                  | NumberLit
                  | CxxInterpolation
                  | CoreInterpolation;

export class Named {
  readonly t = 'Named';

  constructor( readonly k: string
             , readonly v: Atom) { }

  static of(k: string, v: Atom) { return new Named(k, v); }

  toString(): string {
    return `< ${this.k} : ${this.v} >`;
  }
}

export type Param = Atom|Named;

export const layer    = Layer.of;
export const strlit   = StringLit.of;
export const numlit   = NumberLit.of;
export const truthlit = BooleanLit.of;
export const cxxintp  = CxxInterpolation.of;
export const coreintp = CoreInterpolation.of;
export const named    = Named.of;

export function lit(v: string|number|boolean): StringLit|NumberLit|BooleanLit {
  if (typeof v === 'string')
    return strlit(v);

  if (typeof v === 'number')
    return numlit(v);

  if (typeof v === 'boolean')
    return truthlit(v);

  throw new Error(`string|number|boolean expected, got ${typeof v}: ${v}`);
}

