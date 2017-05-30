import { Value
       , Expression
       , ExprM
       , app, lam, sym, str, num, bool, builtin
       , Application
       , LambdaAbstraction
       , Variable
       , NumberValue
       , Builtin } from './syntax-tree';
import { Result, Ok, Err } from 'space-lift';
import * as debug from 'debug';

const ifProc = ([ testE, thenE, elseE ]: Expression[]): ExprM => {
  if (testE.t !== 'BooleanValue')
    return Err(`if testE thenE elseE: testE should be of type 'BooleanValue', `
      +        `got ${testE.t}: ${testE}`);

  if (testE.value)
    return Ok(thenE);
  else
    return Ok(elseE);
}

export const if_ = builtin('!--', ifProc, 'if');

const eqProc = ([ lhs, rhs ]: Expression[]): ExprM => {
  if (lhs.t !== rhs.t) {
    return Err(`eq: type mismatch, lhs = ${lhs.t}, rhs = ${rhs.t}`
      + '\n' + `lhs: ${lhs}`
      + '\n' + `rhs: ${rhs}`);
  }

  if (lhs.t.endsWith('Value'))
    return Ok(bool((lhs as any).value === (rhs as any).value));
  else
    return Err(`eq: don't know how to compare ${lhs.t}`);
}

export const eq = builtin('!!', eqProc, '=');

const addProc = (ns: Expression[]): ExprM => {
  const allNumbers = ns.map(n => n.t === 'NumberValue').reduce((x, y) => x && y, true);

  if (!allNumbers)
    return Err(`add: requires all expressions of type 'NumberValue'\n`
    +          `got: ${ns.map(n => n.t.toString() + ': ' + n.toString()).join('\n')}`);

  const sum = ns.map(x => x as NumberValue).map(x => x.value).reduce((x, y) => x + y, 0);

  return Ok(num(sum));
}

export const add = builtin('!!', addProc, '+');

const subProc = (ns: Expression[]): ExprM => {
  const allNumbers = ns.map(n => n.t === 'NumberValue').reduce((x, y) => x && y, true);

  if (!allNumbers)
    return Err(`sub: requires all expressions of type 'NumberValue'\n`
    +          `got: ${ns.map(n => n.t.toString() + ': ' + n.toString()).join('\n')}`);

  const l = ns[0] as NumberValue;
  const r = ns[1] as NumberValue;

  return Ok(num(l.value - r.value));
}

export const sub = builtin('!!', subProc, '-');

const yProc = ([g]: Expression[]): ExprM => {
  return Ok(app(g, app(yRef(), g)));
}

export const Y = builtin('-', yProc, 'Y');
const yRef = () => Y;

export default function probe(x: string) {
  if (x === '==' || x === 'eq')
    return eq;

  if (x === '+' || x === 'add')
    return add;

  if (x === '-' || x === 'sub')
    return sub;

  if (x === 'if')
    return if_;

  if (x === 'Y')
    return Y;

  return sym(x);
}

