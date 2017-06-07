const expect                  = require('chai').expect;
const { slot, union, struct } = require('../dist/render/cxxmodel');
const { simpleCollectConfig } = require('../dist/render/collect');

describe('cxxmodel', () => {
  describe('slot', () => {
    const s = slot('foo', 'int', '0');

    it('should return a nice slot decl', () => {
      expect(s).to.be.a('Object');
    });

    it('should generate a nice c++ variable declaration', () => {
      expect(s.declaration).to.deep.equal([ 'int foo;' ]);
    });

    it('should generate a nice c++ variable assignment', () => {
      expect(s.initialization).to.be.a('Function');
      expect(s.initialization('', '')).to.deep.equal([ 'foo = 0;' ]);
    });

    it('should generate a nice variable name', () => {
      expect(s.access).to.be.a('Function');
      expect(s.access('', '')).to.equal('foo');
    });
  });

  describe('struct', () => {
    const s1 = slot('foo', 'int', '0');
    const s2 = slot('bar', 'float');

    const s  = struct('Foo', 's', [ s1, s2 ], simpleCollectConfig());

    it('should return a nice struct decl', () => {
      expect(s).to.be.a('Object');
    });

    it('should generate a nice c++ variable declaration', () => {
      const decl = [ 'struct Foo {'
                   , '  int foo;'
                   , '  float bar;'
                   , '};'
                   , 'Foo s;' ].join('\n');

      expect(s.declaration.join('\n')).to.equal(decl);
    });

    it('should generate a nice bulk initialization', () => {
      expect(s.initialization).to.be.a('Function');
      expect(s.initialization('s.', '')).to.deep.equal([ 's.foo = 0;' ]);
    });

    it('should generate a nice variable name', () => {
      expect(s.access).to.be.a('Function');
      expect(s.access('', '')).to.equal('s');
    });
  });

  describe('union', () => {
    const s1 = slot('foo', 'int', '0');
    const s2 = slot('bar', 'float');

    const s  = union('Foo', 's', [ s1, s2 ], simpleCollectConfig());

    it('should return a nice struct decl', () => {
      expect(s).to.be.a('Object');
    });

    it('should generate a nice c++ variable declaration', () => {
      const decl = [ 'union Foo {'
                   , '  int foo;'
                   , '  float bar;'
                   , '};'
                   , 'Foo s;' ].join('\n');

      expect(s.declaration.join('\n')).to.equal(decl);
    });

    it('doesn\'t need initialization', () => {
      expect(s.initialization).to.be.a('Function');
      expect(s.initialization('', '')).to.be.lengthOf(0);
    });

    it('should generate a nice variable name', () => {
      expect(s.access).to.be.a('Function');
      expect(s.access('', '')).to.equal('s');
    });
  });

  describe('nested', () => {
    const s1 = slot('foo', 'int', '0');
    const s2 = slot('bar', 'float');
    const s3 = slot('s3', 'Vector3F', 'Vector3F(0, 0, 0)');

    const s  = struct('Foo', 's', [ s1, s2 ], simpleCollectConfig());
    const u  = union('Bar', 'q', [ s, s3 ], simpleCollectConfig());

    it('should return a nice struct decl', () => {
      expect(s).to.be.a('Object');
    });

    it('should generate a nice c++ variable declaration', () => {
      const decl = [ 'union Bar {'
                   , '  struct Foo {'
                   , '    int foo;'
                   , '    float bar;'
                   , '  };'
                   , '  Foo s;'
                   , '  Vector3F s3;'
                   , '};'
                   , 'Bar q;' ].join('\n');

      expect(u.declaration.join('\n')).to.equal(decl);
    });

    it('doesn\'t need initialization', () => {
      expect(u.initialization).to.be.a('Function');
      expect(u.initialization('', '')).to.be.lengthOf(0);
    });

    it('gives access to inner-most names', () => {
      const foo = s1.access(`${s.access(`${u.access('', '')}.`, '')}.`, '');

      expect(foo).to.be.a('String');
      expect(foo).to.equal('q.s.foo');

      const init = s1.initialization(`${s.access(`${u.access('', '')}.`, '')}.`, '');

      expect(init).to.be.an('Array');
      expect(init).to.deep.equal([ 'q.s.foo = 0;' ]);
    });
  });
});
