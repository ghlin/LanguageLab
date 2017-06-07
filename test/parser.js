const Parjs = require('parjs');
const { truthP
      , coreRawP
      , cxxRawP
      , interpolationP
      , numLitP
      , strLitP
      , paramP
      , paramsP
      , leadingComponentP
      , layerP
      , layersP } = require('../dist/parser');
const { BooleanLit
      , NumberLit
      , StringLit
      , CxxInterpolation
      , CoreInterpolation
      , Layer
      , Named } = require('../dist/shape/layer');

const expect = require('chai').expect;

const ok = Parjs.ReplyKind.OK;

const eq_ = (x, t) => expect(x._).to.deep.equal(t);

const testParser = (p, c, tests, extra = eq_) => {
  for (const test of tests) {
    const r = p.parse(test[0]);

    expect(r.kind).to.equal(ok);
    expect(r.value).to.instanceOf(c);

    extra(r.value, test[1]);
  }
}

expectReject = (p, tests) => {
  for (const src of tests) {
    const r = p.parse(src);

    expect(r.kind).not.to.equal(ok);
  }
}

describe('parser', () => {
  describe('truthP', () => {
    it('should parse a truth value', () => {
      const tests = [ [ 'Yes', true ]
                    , [ 'No', false ]
                    , [ 'Ok', true ]
                    , [ 'True', true ]
                    , [ 'False', false ] ];
      testParser(truthP, BooleanLit, tests);
    });

    it('should reject any others', () => {
      const anywhat = [ 'bbb', '@@', ' alsdj', 'yes', 'no', 'false' ];
      expectReject(truthP, anywhat);
    });
  });

  describe('numLitP', () => {
    it('should parse a numberic literals', () => {
      const tests = [ [ '0', 0 ]
                    , [ '0.0', 0.0 ]
                    , [ '1.23', 1.23 ]
                    , [ '123', 123 ] ];

      testParser(numLitP, NumberLit, tests);
    });

    it('should reject any others', () => {
      const anywhat = [ 'bbb', 'eee', '', ' ' ];
      expectReject(numLitP, anywhat);
    });
  });

  describe('strLitP', () => {
    it('should parse string literals', () => {
      const tests = [ [ '"abc"', 'abc' ]
                    , [ '""', '' ]
                    , [ '"\\\\"', '\\' ]
                    , [ '"abc\\ndef"', 'abc\ndef' ] ];

      testParser(strLitP, StringLit, tests);
    });

    it('should reject any others', () => {
      const anywhat = [ '', 'ab', '"', "''" ];
      expectReject(strLitP, anywhat);
    });
  });

  describe('coreRawP', () => {
    it('should parse strings like {...}', () => {
      testParser(coreRawP, CoreInterpolation, [ ['{anywhat}', 'anywhat'] ]);
    });

    it('should parse names like foo, bar', () => {
      testParser(coreRawP, CoreInterpolation, [ ['foo', 'foo'] ]);
    });
  });

  describe('cxxRawP', () => {
    it('should parse strings like {...}', () => {
      testParser(cxxRawP, CxxInterpolation, [ ['{anywhat}', 'anywhat'] ]);
    });
  });

  describe('interpolationP', () => {
    it('should parse cxx interpolations', () => {
      testParser(interpolationP, CxxInterpolation,
                 [ [ '$${ a + b }', ' a + b ' ] ]);
    });

    it('should parse core interpolations', () => {
      testParser(interpolationP, CoreInterpolation,
                 [ [ '${ a + b }', ' a + b ' ]
                 , [ '$hello', 'hello' ] ]);
    });
  });

  describe('paramP', () => {
    it('should parse any literal', () => {
      const tests = [ [ 'Yes', true ]
                    , [ 'No', false ]
                    , [ 'Ok', true ]
                    , [ 'True', true ]
                    , [ 'False', false ]
                    , [ '0', 0 ]
                    , [ '0.0', 0.0 ]
                    , [ '1.23', 1.23 ]
                    , [ '123', 123 ]
                    , [ '"abc"', 'abc' ]
                    , [ '""', '' ]
                    , [ '"\\\\"', '\\' ]
                    , [ '"abc\\ndef"', 'abc\ndef' ]
                    , [ '$${anywhat}', 'anywhat' ]
                    , [ '${anywhat}', 'anywhat' ] ];

      for (const test of tests) {
        const r = paramP.parse(test[0]);

        expect(r.kind).to.equal(ok);
        expect(r.value._).to.equal(test[1]);
      }
    });

    it('should also accept paired param', () => {
      const tests = [ [ 'k: "v"', 'k', StringLit, 'v' ]
                    , [ 'q: 0', 'q', NumberLit, 0 ]
                    , [ 'x: Yes', 'x', BooleanLit, true ] ];

      for (const test of tests) {
        const r = paramP.parse(test[0]);

        expect(r.kind).to.equal(ok);
        expect(r.value.k).to.equal(test[1]);
        expect(r.value.v).to.instanceOf(test[2]);
        expect(r.value.v._).to.equal(test[3]);
      }
    });
  });

  describe('layerP', () => {
    function run(desc, src, out) {
      it(desc, () => {
        const r = layerP.parse(src);

        expect(r.kind).to.equal(ok);
        expect(r.value.toString()).to.equal(out);
      });
    }

    const src0 = [ 'define-model "super-fancy-model" {'
                 , '  scope "awesome"'
                 , '  closure { inline Yes }'
                 , '  optional-semi-colon;'
                 , '}' ].join('\n');
    const str0 = [ 'define-model("super-fancy-model")'
                 , '  - scope("awesome")'
                 , '  - closure'
                 , '    - inline(true)'
                 , '  - optional-semi-colon' ].join('\n');

    run('should parse a layer', src0, str0);

    const src1 = 'one-line-with-semi-colon;'
    const str1 = 'one-line-with-semi-colon';

    run('should parse an inline layer, with semi-colon', src1, str1);

    const src2 = 'one-line-without-semi-colon';
    const str2 = 'one-line-without-semi-colon';

    run('should parse an inline layer, no semi-colon', src2, str2);

    const src3 = 'inline-closure { k }';
    const str3 = [ 'inline-closure'
                 , '  - k' ].join('\n');

    run('should parse an inline closure layer', src3, str3);

    const src4 = [ 'multi-line-closure {'
                 , ' k'
                 , '}' ].join('\n');
    const str4 = [ 'multi-line-closure'
                 , '  - k' ].join('\n');

    run('should parse a multi-line closure layer', src4, str4);

    const src5 = 'inline-closure-with-atom-field { Yes }';
    const str5 = [ 'inline-closure-with-atom-field'
                 , '  - BooleanLit: true' ].join('\n');

    run('should parse an inline closure layer with atom fileds', src5, str5);

    const src6 = 'inline-closure-with-sep-atom-field { o Yes; "awesome" }';
    const str6 = [ 'inline-closure-with-sep-atom-field'
                 , '  - o(true)'
                 , '  - StringLit: "awesome"' ].join('\n');

    run('should parse an inline closure layer with semi-colon sep', src6, str6);

    const src7 = 'very-nested { very { very { nested Yes } } }';
    const str7 = [ 'very-nested'
                 , '  - very'
                 , '    - very'
                 , '      - nested(true)' ].join('\n');

    run('should parse a multi-line, nested closure layer', src7, str7);

    const src8 = 'inline-closure-with-sep-atom-field { Yes; "awesome" }';
    const str8 = [ 'inline-closure-with-sep-atom-field'
                 , '  - BooleanLit: true'
                 , '  - StringLit: "awesome"' ].join('\n');

    run('should parse an inline closure layer with semi-colon sep, and atom fields only', src8, str8);

    it('should fail on multi-semi-colon', () => {
      expect(() => layerP.parse('inline { Yes;;; No }')).to.throw();
    });
  });

  describe('layersP', () => {
    it('should parse a bunch of layers', () => {
      const src0 = [ '"starts-with-literal"'
                   , ''
                   , 'inline-def Yes'
                   , ''
                   , 'with-semi-colon Yes;'
                   , 'no-empty-line-sep'
                   , ''
                   , 'complex-one here("with arguments", v: Yes) {'
                   , '  nested { inline }'
                   , '  "Literal, and semi-colon";'
                   , '}' ].join('\n');
      const str0 = [ [ '"starts-with-literal"' ].join('\n')
                   , [ 'inline-def(true)' ].join('\n')
                   , [ 'with-semi-colon(true)' ].join('\n')
                   , [ 'no-empty-line-sep' ].join('\n')
                   , [ 'complex-one here("with arguments", < v : true >)'
                     , '  - nested'
                     , '    - inline'
                     , '  - StringLit: "Literal, and semi-colon"' ].join('\n') ];

      const r = layersP.parse(src0);

      expect(r.kind).to.equal(ok);
      expect(r.value.map(x => `${x}`)).to.deep.equal(str0);
    });

    it('should also parse empty lines', () => {
      const r = layersP.parse('');

      expect(r.kind).to.equal(ok);
      expect(r.value).to.be.a('Array');
      expect(r.value).to.be.lengthOf(0);
    });
  });
});


