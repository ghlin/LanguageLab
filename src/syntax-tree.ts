import { Result } from 'space-lift';

export type Value      = StringValue | NumberValue | BooleanValue;
export type Expression = Value | Variable | LambdaAbstraction | Application | Builtin;

export type ExprM = Result<string, Expression>;

export class StringValue {
  readonly t = 'StringValue';

  constructor(readonly value: string) { }

  static of(value: string) {
    return new StringValue(value);
  }

  toString() { return this.value; }
}

export class NumberValue {
  readonly t = 'NumberValue';

  constructor(readonly value: number) { }

  static of(value: number) {
    return new NumberValue(value);
  }

  toString() { return `${this.value}`; }
}

export class BooleanValue {
  readonly t = 'BooleanValue';

  constructor(readonly value: boolean) { }

  static of(value: boolean) {
    return new BooleanValue(value);
  }

  toString() { return `${ this.value ? "True" : "False" }`; }
}

export class Variable {
  readonly t = 'Variable';

  constructor(readonly id: string) { }

  static of(id: string) {
    return new Variable(id);
  }

  toString(): string {
    return `${this.id}`;
  }
}

export class LambdaAbstraction {
  readonly t = 'LambdaAbstraction';

  constructor( readonly x:    Variable
             , readonly body: Expression) { }

  static of(x: Variable, body: Expression) {
    return new LambdaAbstraction(x, body);
  }

  toString(): string {
    return `λ${this.x}. ${this.body.toString()}`;
  }
}

export class Application {
  readonly t = 'Application';

  constructor( readonly lambda: Expression
             , readonly x:      Expression) { }

  static of(lambda: Expression, x: Expression) {
    return new Application(lambda, x);
  }

  toString(): string {
    const left = (  this.lambda.t === 'Variable'
                 || this.lambda.t === 'Application')
      ? this.lambda.toString()
      : `(${this.lambda.toString()})`;

    const right = (  this.x.t === 'Variable'
                  || this.x.t.endsWith('Value') )
      ? this.x.toString()
      : `(${this.x.toString()})`;

    return `${left} ${right}`;
  }
}

export interface BuiltinProcedure {
  (exprList: Expression[]): ExprM;
}

export interface BuiltinPrint {
  (exprList: Expression[]): string;
}

export class Builtin {
  readonly t = 'Builtin';

  constructor( readonly pattern:   boolean[]
             , readonly procedure: BuiltinProcedure
             , readonly name:      string) { }

  static of( pattern:      string | boolean[]
           , procedure:    BuiltinProcedure
           , name:         string) {
    if (Array.isArray(pattern))
      return new Builtin(pattern, procedure, name);
    else
      return new Builtin(Builtin.mapPattern(pattern), procedure, name);
  }

  toString() {
    return `${this.name}`
  }

  private static mapPattern(pattern: string): boolean[] {
    return pattern.split('').map(ch => {
      return ch === '!' || ch === 'x';
    });
  }
}

export const app     = Application.of;
export const lam     = LambdaAbstraction.of;
export const sym     = Variable.of;
export const str     = StringValue.of;
export const num     = NumberValue.of;
export const bool    = BooleanValue.of;
export const builtin = Builtin.of;

