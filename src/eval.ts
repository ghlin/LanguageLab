import * as T from './tree';
import * as U from 'space-lift';
import * as I from 'immutable';
import "colors";

const log = console.log;

type Expr = T.Expr;

const color = (x: string, c: string): string => (x as any)[c];

function highlight(e: Expr, hi: T.Application): string {
  if (e == hi) {
    const le = e.lambda.toString();
    const l = (  e.lambda instanceof T.Variable
              || e.lambda instanceof T.Application)
      ? le : `(${le})`;

    const re = e.x.toString();
    const r = (  e.x instanceof T.Variable
              || e.x instanceof T.Literal)
      ? re : `(${re})`;

    return `${color(l, 'red')} ${color(r, 'blue')}`;
  }

  switch (e.t) {
  case 'Literal':
  case 'Variable':
    return e.toString();

  case 'Application':
    const l = (  e.lambda instanceof T.Variable
              || e.lambda instanceof T.Application)
      ? highlight(e.lambda, hi)
      : `(${highlight(e.lambda, hi)})`;

    const r = (  e.x instanceof T.Variable
              || e.x instanceof T.Literal)
      ? highlight(e.x, hi)
      : `(${highlight(e.x, hi)})`;

    return `${l} ${r}`;
  case 'LambdaAbstraction':
    return `λ${e.x}. ${highlight(e.body, hi)}`;
  }
  return e.toString();
}

/*
 *
 *           @
 *          / \
 *         @  E1
 *        / \
 *  # -> λ E2
 *      / \
 *     x  E3
 *
 * 0. find left-most, out-most application
 *    go left, until left-child (E) is not of Application.
 *    (if # is not a LambdaAbstraction, fail)
 *    substitute # with E3[E2/x]
 *
 *
 */
type M = U.Result<string, Expr>;

function diveLeftOut(r: T.Application): U.Result<string, [ T.Application, T.LambdaAbstraction ]> {
  const left = r.lambda;

  if (left.t === 'Application')
    return diveLeftOut(left);

  if (left.t === 'LambdaAbstraction')
    return U.Ok([ r, left ] as [ T.Application, T.LambdaAbstraction ]);
  else
    return U.Err(`diveLeftOut: `
      + `left-child of left-most-out-most application `
      + `should be of LambdaAbstraction, but got ${left.t}: ${left}`);
}

function subst(m: Expr, v: T.Variable, e: Expr): T.Expr {
  switch (m.t) {
  case 'Literal':  return m;
  case 'Variable':
    if (m.id === v.id)
      return e;
    else
      return m;
  case 'Application':
    return T.Application.of( subst(m.lambda, v, e)
                           , subst(m.x, v, e));
  case 'LambdaAbstraction':
    if (m.x.id === v.id)
      return m;
    else
      return T.LambdaAbstraction.of( m.x
                                   , subst(m.body, v, e));
  }
  log(`subst: ??? ${e.t}: ${e}`);
  return e;
}

function copyTree(r: Expr, at: Expr, to: Expr): Expr {
  if (r === at)
    return to;

  if (r.t === 'Application')
    return T.Application.of( copyTree(r.lambda, at, to)
                           , r.x);

  return r;
}

function reduceLeftOut(r: T.Application /* very root */): M {
  return diveLeftOut(r).map(([ p, h ]) => {
    /*
     *
     *           @
     *          / \
     *    p -> @  E1
     *        / \
     *  h -> λ E2
     *      / \
     *     x  E3
     *
     */
    log(`highlight: ${highlight(r, p)}`);
    const hs = subst(h.body, h.x, p.x);
    return copyTree(r, p, hs);
  });
}

function step(e: Expr): U.Result<string, Expr> {
  switch (e.t) {
  case 'Literal':
    return U.Ok(e);

  case 'Variable':
    return U.Err(`don't know how to evaluate variable ${e.id}`);

  case 'LambdaAbstraction':
    return U.Ok(e);

  case 'Application':
    return reduceLeftOut(e);
  }

  return U.Err(`nah`);
}

const Lam = T.LambdaAbstraction.of;
const App = T.Application.of;
const Var = T.Variable.of;
const Lit = T.Literal.of;

// cons = \x.\y.\f f x y
const consE = Lam( Var("x")
                 , Lam( Var("y")
                      , Lam( Var("f")
                           , App( App( Var("f")
                                     , Var("x"))
                                , Var("y")))));

// car = \f.f (\x.\y. x)
const carE = Lam( Var("f")
                , App( Var("f")
                     , Lam( Var("x")
                          , Lam( Var("y")
                               , Var("x")))));

// cdr = \f.f (\x.\y. y)
const cdrE = Lam( Var("f")
                , App( Var("f")
                     , Lam( Var("x")
                          , Lam( Var("y")
                               , Var("y")))));

const testE = App( carE
                 , App( App( consE
                           , Lit("1"))
                      , Lit("2"))); // should be 1


function tryE(r: Expr, n: number = 1000): M {
  if (n === 0)
    return U.Err(`tryE: max try`)

  if (r.t === 'Application')
    return step(r).flatMap((e): M => tryE(e, n - 1));
  else
    return U.Ok(r);
}

const r = tryE(testE);

log(`cons = ${consE.toString()}`);
log(`car  = ${carE.toString()}`);
log(`cdr  = ${cdrE.toString()}`);
log(`r = ${r.toString()}`);

const testE1 = App( carE
                  , App( App( consE
                            , consE)
                       , Lit("1")));

log(`testE1 = ${testE1}`);
log(`testE1 = ${tryE(testE1)}`);

const testE2 = App( carE
                  , App( App( testE1
                            , Lit("Hello"))
                       , Lit("World")));

log(`testE2 = ${testE2}`);
log(`testE2 = ${tryE(testE2)}`);

// cdr (car (cons cons 1) "hello" "World")
const shouldFail = App( cdrE
                      , App( App( App( cdrE
                                     , App( App( consE
                                               , consE)
                                          , Lit("1")))
                                , Lit("Hello"))
                           , Lit("World")));

log(`shouldFail = ${shouldFail}`);
log(`shouldFail = ${tryE(shouldFail)}`);

log(`F 1 = ${App(T.F, Lit("1"))}`);
log(`F 1 = ${tryE(App(T.F, Lit("1")))}`);

log(`cons 1 2= ${App(App(consE, Lit("1")), Lit("2"))}`);
log(`cons 1 2= ${tryE(App(App(consE, Lit("1")), Lit("2")))}`);

// omega = (\x. x x) (\x. x x)
const omega = App( Lam(Var("x"), App(Var("x"), Var("x")))
                 , Lam(Var("x"), App(Var("x"), Var("x"))));

log(`omega = ${omega}`);
log(`omega = ${tryE(omega)}`);
