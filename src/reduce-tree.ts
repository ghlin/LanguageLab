import { Value
       , Expression
       , ExprM
       , app, lam, sym, str, num, bool, builtin
       , Application
       , LambdaAbstraction
       , Variable
       , Builtin } from './syntax-tree';

import { Result, Ok, Err } from 'space-lift';
import * as debug from 'debug';
import 'colors';

const log = debug('LL:reduce-tree');

const color = (x: string, c: string): string => (x as any)[c];
const red   = (x: string) => color(x, 'red');
const blue  = (x: string) => color(x, 'blue');


function subst(m: Expression, v: Variable, e: Expression): Expression {
  if (m.t === 'Variable')
    return m.id === v.id ? e : m;

  if (m.t === 'Application')
    return app(subst(m.lambda, v, e), subst(m.x, v, e));

  if (m.t === 'LambdaAbstraction')
    return m.x.id === v.id ? m : lam(m.x, subst(m.body, v, e));

  return m;
}

type NextRedux = LambdaAbstraction | Builtin;

function nextRedux( r: Application
                  , e: Application[] = []
                  ): Result<string, [ Application, NextRedux, Expression[] ]> {
  const l = r.lambda;

  if (l.t === 'Application')
    return nextRedux(l, [ r ].concat(e));

  if (l.t === 'Builtin' || l.t === 'LambdaAbstraction')
    return Ok([r, l, [ r ].concat(e)] as [ Application, NextRedux, Expression[] ]);
  else
    return Err(`nextRedux: `
      +        `'Builtin' or 'LambdaAbstraction' expected,`
      +        ` got ${l.t}: ${l}`);
}

function substTree(r: Expression, at: Expression, w: Expression): Expression {
  if (r === at)
    return w;

  if (r.t === 'Application')
    return app(substTree(r.lambda, at, w), r.x);
  else
    return r;
}

function reduce(e: Application): ExprM {
  return nextRedux(e).flatMap(([ a, r, stack ]) => {
    if (r.t === 'LambdaAbstraction') {
      const hs = subst(r.body, r.x, a.x);
      return Ok(substTree(e, a, hs));
    } else {
      if (stack.length < r.pattern.length) {
        return Err(`builtin ${r.name} requires ${r.pattern.length} arg(s), `
          +        `got ${stack.length}`);
      }

      const es = stack.slice(0, r.pattern.length);
      const rs = es.map((a: Application, i) => {
        if (r.pattern[i])                { log(`eval: ${a.x}`);
          return tryM(a.x);              }
        else
          return Ok(a.x);
      });

      const errs = rs.filter(x => !x.isOk()).map(x => x.toString());

      if (errs.length !== 0)
        return Err(errs.join('\n'));

      return r.procedure(rs.map(x => (x.get() as Expression)))
        .flatMap(s => Ok(substTree(e, stack[rs.length - 1], s)));
    }
  });
}

function evalM(e: Expression): ExprM {
  if (e.t === 'Application')
    return reduce(e);
  else
    return Ok(e);
}

export function tryM(e: Expression, limit: number = 1000): ExprM {
  log(`tryM: ${e.t}: ${e}`);
  if (limit === 0)
    return Err(`tryM: max try`);

  if (e.t === 'Application')
    return reduce(e).flatMap((r): ExprM => tryM(r, limit - 1));
  else
    return Ok(e);
}

import * as b from './builtins';
const { if_, eq } = b;


const e1 = app( app( app(if_, bool(true))
                   , str("yes"))
              , str("no"));

log(`e1 = ${e1}`);
log(`e1 = ${tryM(e1)}`);

const ifE = (testE: Expression, thenE: Expression, elseE: Expression) => {
  return app(app(app(if_, testE), thenE), elseE);
}

const e2 = ifE(app(app(eq, num(1)), num(1)), str("Yes"), str("No"));

const test = (e: Expression, name: string = "_") => {
  log(`===========[${name}]=========`);
  log(`e = ${e}`);
  log(`r = ${tryM(e)}`);
}

test(e2);

const curriedEq = lam( sym("x")
                     , lam( sym("y")
                          , app(app(eq, sym("x")), sym("y"))));

const e3 = app(app(curriedEq, num(1)), num(1));
const e4 = app(app(curriedEq, num(1)), num(2));

test(e3);
test(e4);

const zero = app(curriedEq, num(0));

test(zero, 'zero');

const e5 = app(zero, num(13));
const e6 = app(zero, num(0));

test(e5);
test(e6);



