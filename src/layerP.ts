import * as Parjs          from 'parjs';
import * as T              from './lexdefs';
import { Literal, Layer }  from './tree';

const P = Parjs.Parjs;

const trueP           = P.string('#t').map(_ => '#true');
const falseP          = P.string('#f').map(_ => '#false');
const truthP          = trueP.soft.or(falseP);
const literalP        = P.int().or(P.float(), T.stringLiteralP, truthP).str.map(Literal.of);
const identifierListP = T.identifierP.manySepBy(T.spaceP.many(1));

const end         = P.anyCharOf(';\n');
const endQ        = end.many(1).q;

const buildLayer = ([id, ...names]: string[], body: Literal | Layer[]) => {
  return names.reduce((body, t) => Layer.of(t, [body]), Layer.of(id, body));
}

const [ pwP, rP, bP ] : [ () => Parjs.LoudParser<Layer>
                        , () => Parjs.LoudParser<Literal| Layer[]>
                        , () => Parjs.LoudParser<Layer[]>       ] =
[
  () => { // pw
    return identifierListP.then(T.spaceP.many(1).q)
      .thenChoose((idChain) => rP().map(
        body => buildLayer(idChain.reverse(), body)));
  }
, () => { // r
    const inBlock = literalP.or(bP().soft).orVal([]);
    const block   = T.openBrQ.then(T.spaceEolsQ)
      .then(inBlock).then(T.spaceEolsQ).then(T.closeBrQ);
    return literalP.or(block);
  }
, () => { // b
    const sep1P = endQ.then(T.spaceEolsQ).then(T.closeBrQ).not;
    const sepP  = sep1P.then(endQ).then(T.spaceEolsQ);
    return pwP().manySepBy(sepP);
  }
];

export const layerP  = pwP();

const layersP = T.spaceEolsQ.then(layerP
  .manySepBy(endQ.then(P.eof).not.then(endQ)))
  .then(T.spaceEolsQ);

export default layersP;

