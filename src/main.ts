import layerP from './layerP';
import * as Parjs from 'parjs';

const src =
`

html {
  head {
    title "hello"
  }

  body {
    div {
      h1 "WOW"
    }

    ul {
      li 1
      li 2
      li 3
    }
  }
}

ok 12


yes { }


y {}

yy yy yy 0
yy y "y";

o "";
o {
}

o {
}
q "";

o {

}

o {

};
q "yes"


use-awesome-weapon= #t

import /root/undefined/fantasy/object from "V"

include "some"

test-string-escaping= "\\n\\n[\\t]\\$[\\\\]"

include "some.ll"
`;
// this is comment

/*
const r = layerP.parse(src);

if (r.kind == Parjs.ReplyKind.OK) {
  for (let v of r.value) {
    console.log(v.toString());
  }
} else {
  console.log(r.toString());
}
*/

//require("./eval");
import * as e from "./reduce-tree";
import p from './s-exprP';

const sexpList = [ `\\x.x`
                 , `#t`
                 , `\\x.\\y.(== x y)` ];

for (const sexp of sexpList) {
  const r = p.parse(sexp);

  if (r.kind == Parjs.ReplyKind.OK) {
    const exp = r.value;

    console.log(`in  = ${exp}`);
    console.log(`out = ${e.tryM(exp)}`);
  } else {
    console.log(r.toString());
  }
}


