import p from './grammar';
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
`;

const r = p.parse(src);

if (r.kind == Parjs.ReplyKind.OK) {
  for (let v of r.value) {
    console.log(v.toString());
  }
} else {
  console.log(r);
}

