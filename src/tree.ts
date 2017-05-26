export class Literal {
  readonly t = 'Literal';

  constructor(readonly value: string) { }

  static of(x: string) {
    return new Literal(x);
  }

  toString() {
    if (this.value.length === 0)
      return '""';
    const ch = this.value.charAt(0);

    if (ch >= '0' && ch <= '9')
      return this.value;
    else
      return `"${this.value}"`;
  }
}

export class Layer {
  readonly t = 'Layer';

  constructor( readonly id:   string
             , readonly body: Literal | Layer[]) { }

  static of(id: string, body: Literal | Layer[]) {
    return new Layer(id, body);
  }

  toString(): string {
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

type Expr = Literal | Variable | Constructor | Application | LambdaAbstraction;

class Variable {
  readonly t = 'Variable';

  constructor(readonly id: string) { }

  static of(id: string) {
    return new Variable(id);
  }

  toString(): string {
    return `${this.id}`;
  }
}

class Constructor {
  readonly t = 'Constructor';

  constructor( readonly c:      string
             , readonly parts:  Pattern[]) { }

  static of(c: string, parts: Pattern[]) {
    return new Constructor(c, parts);
  }

  toString(): string {
    return `Constructor { ${this.c}: ${this.parts.map(x => x.toString()).join('; ')} }`;
  }
}

type ConstantPattern = Literal;
type VariablePattern = Variable;
type ConstructorPattern = Constructor;

type Pattern = ConstantPattern | VariablePattern | ConstructorPattern;

export class Equation {
  readonly t = 'Equation';

  constructor( readonly left:  Pattern
             , readonly right: Expr) { }

  static of(left: Pattern, right: Expr) {
    return new Equation(left, right);
  }

  toString(): string {
    return `Define ${this.left} to be ${this.right}`;
  }
}

export class LambdaAbstraction {
  readonly t = 'LambdaAbstraction';

  constructor( readonly x:    Variable
             , readonly body: Expr) { }

  static of(x: Variable, body: Expr) {
    return new LambdaAbstraction(x, body);
  }

  toString(): string {
    return `λ${this.x}. ${this.body.toString()}`;
  }
}

export class Application {
  readonly t = 'Application';

  constructor( readonly lambda: Expr
             , readonly x:      Expr) { }

  static of(lambda: Expr, x: Expr) {
    return new Application(lambda, x);
  }

  toString(): string {
    const left = (  this.lambda instanceof Variable
                 || this.lambda instanceof Application)
      ? this.lambda.toString()
      : `(${this.lambda.toString()})`;

    const right = (  this.x instanceof Variable
                  || this.x instanceof Literal)
      ? this.x.toString()
      : `(${this.x.toString()})`;

    return `${left} ${right}`;
  }
}

////////////////////////////


// Y = \f. (\x. f (x x)) (\x. f (x x))
const Y =
  LambdaAbstraction.of( Variable.of('f')
                      , Application.of( LambdaAbstraction.of( Variable.of('x')
                                                            , Application.of( Variable.of("f")
                                                                            , Application.of( Variable.of("x")
                                                                                            , Variable.of("x"))))
                                      , LambdaAbstraction.of( Variable.of('x')
                                                            , Application.of( Variable.of("f")
                                                                            , Application.of( Variable.of("x")
                                                                                            , Variable.of("x"))))));

console.log(`Y = ${Y.toString()}`);

// F = Y \f. \n. if (=0 n) 1 (f (-1 n))
const F =
  Application.of( Variable.of("Y")
                , LambdaAbstraction.of( Variable.of("f")
                                      , LambdaAbstraction.of( Variable.of("n")
                                                            , Application.of( Application.of( Application.of( Variable.of("if")
                                                                                                            , Application.of( Variable.of("=0?")
                                                                                                                            , Variable.of("n")))
                                                                                            , Literal.of("1"))
                                                                            , Application.of( Variable.of("f")
                                                                                            , Application.of( Variable.of("-1")
                                                                                                            , Variable.of("n")))))));

console.log(`F = ${F.toString()}`);

////////////////////////////

