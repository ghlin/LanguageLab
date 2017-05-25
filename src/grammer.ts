import * as Parjs        from 'parjs';
import * as T            from './lexdefs';
import { Expr, Pattern } from './tree';

const P = Parjs.Parjs;

const exprP           = P.int().or(P.float(), T.stringLiteralP).str.map(Expr.of);
const identifierListP = T.identifierP.manySepBy(T.spaceP.many(1));

const end         = P.anyCharOf(';\n');
const endQ        = end.many(1).q;

const buildPattern = ([id, ...names]: string[], body: Expr | Pattern[]) => {
  return names.reduce((body, t) => Pattern.of(t, [body]), Pattern.of(id, body));
}

const [ pwP, rP, bP ] = [
  () => { // pw
    return identifierListP.then(T.spaceP.many(1).q)
      .thenChoose((idChain) => rP().map(
        body => buildPattern(idChain, body)));                 }
, () => { // r
    const inBlock = exprP.or(bP().soft).orVal([]);
    const block   = T.openBrQ.then(T.spaceEolsQ)
      .then(inBlock).then(T.spaceEolsQ).then(T.closeBrQ);
    return exprP.or(block);                                    }
, () => { // b
    const sep1P = endQ.then(T.spaceEolsQ).then(T.closeBrQ).not;
    const sepP  = sep1P.then(endQ).then(T.spaceEolsQ);
    return pwP().manySepBy(sepP);                              }
];

export const patternP  = pwP();

const patternsP = T.spaceEolsQ.then(patternP
  .manySepBy(endQ.then(P.eof).not.then(endQ)))
  .then(T.spaceEolsQ);

export default patternsP;

