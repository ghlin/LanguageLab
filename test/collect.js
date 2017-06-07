const expect                  = require('chai').expect;
const { slot, union, struct } = require('../dist/render/cxxmodel');
const C                       = require('../dist/render/collect');

describe('collect', () => {
  describe('collect config', () => {
    const cc = C.simpleCollectConfig(4);

    it('should indent string with width 4', () => {
      const source   = [ 'A', 'B', 'C' ].join('\n');
      const expected = [ '    A', '    B', '    C' ].join('\n');

      expect(cc.indent(source)).to.equal(expected);
    });
  });

  describe('Scope', () => {
    describe('of', () => {
      it('should perfectly normalize arguments', () => {
        const d = slot('foo', 'int');
        const s = C.Scope.of('scope', d);

        expect(s).to.be.instanceOf(C.Scope);
        expect(s.source).to.be.a('Array');
        expect(s.source[0]).to.equal(d);
      });
    });

    describe('combine', () => {
      it('should combine&compress arrays', () => {
        const verbose  = [ [ 'foo', 'bar', 'baz' ]
                         , [ 'zash', 'foo', 'bar' ]
                         , [ 'q' ] ];
        const compress = [ 'foo', 'bar', 'baz', 'zash', 'q' ].sort();
        const c = C.Scope.combine(verbose);

        expect(c).to.be.a('Array');
        expect(c).have.lengthOf(compress.length);
        expect(c).to.deep.equal(compress);
      });
    });

    describe('seq', () => {
      it('shoule combine scopes', () => {
        const l1 = slot('foo', 'int');
        const s1 = C.Scope.of('s1', l1, [ 'render', 'particle' ], [ 'velocity' ]);

        const l2 = slot('bar', 'int');
        const s2 = C.Scope.of('s1', l2, [ 'nothing' ]);

        const s = C.Scope.seq([ s1, s2 ]);

        expect(s).to.be.instanceOf(C.Scope);
        expect(s.introduces).to.deep.equal([ 'render', 'particle', 'nothing'].sort());
        expect(s.before).to.deep.equal([ 'velocity' ]);
        expect(s.after).to.deep.equal([]);
        expect(s.source).to.deep.equal([ l1, l2 ]);
      });

      it('should reject mismatched scopes', () => {
        const s1 = C.Scope.of('s1', []);
        const s2 = C.Scope.of('s2', []);

        expect(() => {
          const s = C.Scope.seq([ s1, s2 ]);
        }).to.throw();
      });
    });
  });
});
