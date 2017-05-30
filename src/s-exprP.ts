import * as Parjs   from 'parjs';
import * as T       from './lexdefs';
import * as X       from './syntax-tree';
import probe        from './builtins';

const P = Parjs.Parjs;

const trueP  = P.string('#t').map(_ => X.bool(true));
const falseP = P.string('#f').map(_ => X.bool(false));

const truthP = trueP.soft.or(falseP);

const numLitP = P.int().map(X.num);
const strLitP = T.stringLiteralP.str.map(X.str);

const identifierP  = T.identifierP.map(X.sym);
const idOrBuiltinP = T.identifierP.map(probe);

const [ lambdaP, applicationP , expressionP ] : [ () => Parjs.LoudParser<X.LambdaAbstraction>
                                                , () => Parjs.LoudParser<X.Application>
                                                , () => Parjs.LoudParser<X.Expression> ] =
[ () => {
    return P.string('\\').q
      .then(identifierP)
      .then(T.spacesQ.then(P.string('.')))
      .thenChoose(([id, _]) => {
        return expressionP().map((expression) => {
          return X.lam(id, expression);
      });
    })
  }
, () => {
    return T.openPrP.thenChoose((_: any) => {
      return expressionP().manySepBy(T.spaceP.many(1))
        .map(([head, ...rest]: X.Expression[]) => {
          // (a b c d) == (app (app (app a b) c) d)
          return rest.reduce((pre, cur) => X.app(pre, cur) as X.Expression, head);
        })
        .map(x => x as X.Application);
      }).then(T.closePrQ);
  }
, () => {
    return truthP.soft.or(numLitP.soft, strLitP.soft, idOrBuiltinP.soft, applicationP().soft, lambdaP());
  } ];

export const parseS = expressionP();
export default parseS;


