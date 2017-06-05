import * as X from './parser';
import * as T from './lexdefs';
import * as Parjs from 'parjs';
import * as readline from 'readline';
require('colors');

const hls = (x: string, c: string = 'red') => (x as any)[c] as string;
const error  = (x: string) => console.log(hls(x, 'red'))
const ok     = (x: string) => console.log(hls(x, 'green'))

const rl = readline.createInterface({ input: process.stdin
                                    , output: process.stdout });

type Parser = Parjs.LoudParser<any>;

const P = Parjs.Parjs;

const allParsers : [string, Parser][] = [ [ "X.truthP  ", X.truthP   ]
                                        , [ "X.numLitP ", X.numLitP  ]
                                        , [ "X.strLitP ", X.strLitP  ]
                                        , [ "X.cxxRawP ", X.cxxRawP  ]
                                        , [ "X.coreRawP", X.coreRawP ]
                                        , [ "X.literalP", X.literalP ]
                                        , [ "X.paramP  ", X.paramP   ]
                                        , [ "X.paramsP ", X.paramsP  ]
                                        , [ "X.leadingComponentP", X.leadingComponentP ]
                                        , [ "X.layerP  ", X.layerP ]
                                        , [ "X.layersP ", X.layersP ] ]

const print = (r: any): string => {
  if (Array.isArray(r))
    return r.map(print).join('\n');
  else
    return r.toString();
}
const test = (src: string, parsers: [string, Parser][] = allParsers) => {
  for (const [ name, p ] of parsers) {
    const r = p.parse(src);

    if (r.kind === Parjs.ReplyKind.OK) {
      ok(`using ${name}: OK`);
      console.log(print(r.value));
    } else {
      error(`using ${name}: Failed.`);
      console.log(r.toString());
    }
  }
}

console.log("=======");

test(`


a b c d "Yes";

define-routine "super-awesome-routine" where {
  requires-shapes {
    component "stateComponent";
    member "s" type "int";
  }

  main seq {
    repeat 5 seq {
      delay 100 "ticks";
      goto "there"
    }

    fork { do "A" Yes; then "B" 0 Ok; }
  }
}


`
, [['a', X.layersP]]);

rl.on('line', line => {
  if (line.length === 0)
    return;

  test(line);
});

