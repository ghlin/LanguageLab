import * as Parjs from 'parjs';
import * as T     from './lexdefs';
import { layer, strlit, numlit, truthlit
       , cxxintp, coreintp, named }         from './shape/layer';
import { Layer, Field, Param, Named, Atom } from './shape/layer';
import { LoudParser } from 'parjs';

const P = Parjs.Parjs;
const { string: lit } = P;

// {{{ Boolean literal
const trueP  = lit("True").or(lit("Yes"), lit("Ok")).map(_ => truthlit(true));
const falseP = lit("False").or(lit("No")).map(_ => truthlit(false));
export const truthP = trueP.or(falseP);
// }}}

// {{{ Interpolation
// {{{ C++ raw code interpolation
export const cxxRawP = lit('{').q
  .then(P.noCharOf('}').many().str)
  .then(lit('}').q)
  .map(cxxintp);
// }}}

// {{{ Core code interpolation
const coreNameP = T.lowerIdP;
const coreExpP  = lit('{').q
  .then(P.noCharOf('}').many().str)
  .then(lit('}').q);

export const coreRawP  = coreExpP.or(coreNameP).map(coreintp);
// }}}

const interpolationP = lit('$').q
  .then(lit('$').q.then(cxxRawP).or(coreRawP));
// }}}

// {{{ Number literal
export const numLitP = P.float().map(numlit);
// }}}

// {{{ String literal
export const strLitP = T.stringLiteralP.map(strlit);
// }}}

// {{{ Literal
export const literalP = strLitP
  .or(numLitP, truthP, interpolationP);
// }}}

// {{{ Param
const probeNamedP = T.spacesQ.then(lit(':').q)
  .then(T.spacesQ)
  .then(literalP);

const namedP = T.identifierP.then(probeNamedP)
  .map(([k, v]) => named(k, v));
const atomP  = literalP;

export const paramP : LoudParser<Param> = atomP.or(namedP);
// }}}

// {{{ Params
export const paramsP : LoudParser<Param[]> = paramP
  .then(T.spacesQ)
  .manySepBy(lit(',').then(T.spacesQ))
  .between(T.openPrQ.then(T.spacesQ), T.closePrQ);
// }}}


// {{{ leading part
//
// define-routine "name...name" with "argsssss" {
// ^~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//   ...blah blah...
// }
class LayerComponent {
  readonly t = 'LayerComponent';
  constructor( readonly layerName: string
             , readonly params: Param[] = []) { }

  toString() {
    return `LayerComponent(${this.layerName}`
      +    `, ${this.params.map(x => x.toString()).join(', ')})`;
  }
}

const layerNameP       = T.lowerIdP.map(x => new LayerComponent(x));
const layerWithParamsP = T.lowerIdP.then(paramsP).map(([x, p]) =>
  new LayerComponent(x, p));
const layerComponentP  = layerWithParamsP.soft.or(layerNameP);

type LeadingComponent  = Atom|LayerComponent;
type LeadingComponents = LeadingComponent[];

const lcSepP = T.spacesQ.then(P.anyCharOf(';{')).not
  .then(T.spacesQ);
export const leadingComponentP = layerComponentP.or(literalP)
  .manySepBy(lcSepP);
// }}}

// {{{ build a layer
function compress([head, ...rest]: LeadingComponents) {
  if (head.t !== 'LayerComponent')
    throw new Error(`!!!`);

  const insert = (l: Layer, p: Param) =>
    layer(l.name, l.params.concat(p), l.body, l.next);

  const reducer = (accu: [Layer], c: LeadingComponent) => {
    if (c.t === 'LayerComponent')
      return [layer(c.layerName, c.params)].concat(accu);
    else {
      const [ first, ...rest ] = accu;
      return [ insert(first, c), ...rest ];
    }
  }

  return rest.reduce(reducer, [ layer(head.layerName, head.params) ]).reverse();
}

function buildLayer(components: LeadingComponents): Layer {
  const chain = (l: Layer, n: Layer): Layer => {
    if (!l.next)
      return layer(l.name, l.params, l.body, n);
    else
      return layer(l.name, l.params, l.body, chain(l.next, n));
  }

  const [ first, ...rest ] = compress(components);

  return rest.reduce(chain, first);
}

function build( components: LeadingComponents
              , body: Field[]): Layer {
  const addBody = (l: Layer, body: Field[]): Layer => {
    if (!l.next)
      return layer(l.name, l.params, l.body.concat(body));
    else
      return layer(l.name, l.params, l.body, addBody(l.next, body));
  }

  return addBody(buildLayer(components), body);
}
// }}}

// {{{ layer|field
export const layerP: LoudParser<Field> = literalP.or(
  leadingComponentP
    .then(T.spacesQ)
    .thenChoose((components) => {
      return P.anyCharOf('\n;').q.map(() => build(components, []))
        .or(lit('{').then(T.spaceEolsQ).thenChoose(() => {
          const sepP = T.spaceEolsQ.then(lit('}')).not.then(T.spaceEolsQ);

          return layerP.manySepBy(sepP).then(T.spaceEolsQ.then(lit('}').q))
            .map(body => build(components, body));
        }));
  }));
// }}}

// {{{ main parser
const layersSep = T.spaceEolsQ.then(P.eof).not.then(T.spaceEolsQ);
export const layersP = T.spaceEolsQ
  .then(layerP.manySepBy(layersSep))
  .then(T.spaceEolsQ);

export default layersP;
// }}}

