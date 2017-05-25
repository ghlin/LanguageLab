export class Expr {
  readonly t = 'Expr';

  constructor(readonly value: string) { }

  static of(x: string) {
    return new Expr(x);
  }

  toString() {
    return `#[${this.value}]`;
  }
}

export class Layer {
  readonly t = 'Layer';

  constructor( readonly id: string
             , readonly body: Expr | Layer[]) { }

  static of(id: string, body: Expr | Layer[]) {
    return new Layer(id, body);
  }

  toString() : string {
    const tail = Array.isArray(this.body)
      ? this.body.map(x => x.toString()).join('; ')
      : this.body.toString();

    const bare = !Array.isArray(this.body) || this.body.length == 1;

    if (bare)
      return `${this.id} ${tail}`;
    else
      return `${this.id} { ${tail} }`;
  }
}

