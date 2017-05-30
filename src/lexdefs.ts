import * as Parjs from 'parjs';

const P = Parjs.Parjs;

export const lowers  = `abcdefghijklmnopqrstuvwxyz`;
export const uppers  = `ABCDEFGHIJKLMNOPQRSTUVWXYZ`;
export const numbers = `0123456789`;

export const alphas    = lowers + uppers;
export const alphaNums = alphas + numbers;

export const leadingSyms   = '<>/~-_+=:';
export const followingSyms = `'@&^-_#<>/~=?`;

export const leadingChrs   = alphas + leadingSyms;
export const followingChrs = alphaNums + followingSyms;

export const    spaceChrs =     ' \t';
export const spaceEolChrs = ' \t\r\n';

export const    spaceP = P.anyCharOf(    ' \t');
export const spaceEolP = P.anyCharOf(' \t\r\n');

export const    spaceQ = P.anyCharOf(    ' \t').q;
export const spaceEolQ = P.anyCharOf(' \t\r\n').q;

export const    spacesP = P.anyCharOf(    ' \t').many();
export const spaceEolsP = P.anyCharOf(' \t\r\n').many();

export const    spacesQ = P.anyCharOf(    ' \t').many().q;
export const spaceEolsQ = P.anyCharOf(' \t\r\n').many().q;

export const  openSqChr = '[';
export const closeSqChr = ']';
export const  openPrChr = '(';
export const closePrChr = ')';
export const  openBrChr = '{';
export const closeBrChr = '}';

export const  openSqP = P.string('[');
export const closeSqP = P.string(']');
export const  openPrP = P.string('(');
export const closePrP = P.string(')');
export const  openBrP = P.string('{');
export const closeBrP = P.string('}');

export const  openSqQ = P.string('[').q;
export const closeSqQ = P.string(']').q;
export const  openPrQ = P.string('(').q;
export const closePrQ = P.string(')').q;
export const  openBrQ = P.string('{').q;
export const closeBrQ = P.string('}').q;

export const doubleQuoteChr = '"';
export const       colonChr = ':';
export const   semiColonChr = ';';
export const       commaChr = ',';

export const doubleQuoteP = P.string('"');
export const       colonP = P.string(':');
export const   semiColonP = P.string(';');
export const       commaP = P.string(',');

export const doubleQuoteQ = P.string('"').q;
export const       colonQ = P.string(':').q;
export const   semiColonQ = P.string(';').q;
export const       commaQ = P.string(',').q;

// Identifier
export const identifierP = P
  .anyCharOf(leadingChrs)
  .then(P.anyCharOf(followingChrs).many())
  .str;


const escapeSpecialKey = (x: string, to: string = x) =>
  P.string('\\' + x).map(_ => to);

// String literal
const escapeP = escapeSpecialKey('"')
  .or(          escapeSpecialKey('$'))
  .or(          escapeSpecialKey('\\'))
  .or(          escapeSpecialKey('n', '\n'))
  .or(          escapeSpecialKey('r', '\r'))
  .or(          escapeSpecialKey('t', '\t'));

const textP   = P.noCharOf('"');

const strLitContentP = escapeP.or(textP).many();

// TODO: string interpolation 2017-05-25 22:12:20
export const stringLiteralP = strLitContentP
  .between(doubleQuoteP, doubleQuoteP);

