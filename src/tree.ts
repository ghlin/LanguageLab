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

export class Pattern {
  readonly t = 'Pattern';

  constructor( readonly id: string
             , readonly body: Expr | Pattern[]) { }

  static of(id: string, body: Expr | Pattern[]) {
    return new Pattern(id, body);
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

