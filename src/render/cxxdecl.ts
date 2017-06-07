// TODO: type 2017-06-06 10:58:14
export type CxxType  = string;
export type CxxValue = string;
export type CxxName  = string;

export type NameFn = (qualifier: string, t: CxxType) => string;
export type InitFn = (qualifier: string, t: CxxType) => string[];

export interface CxxDecl {
  declaration:        string[]
  initialization:     InitFn
  access:             NameFn
  reference:          NameFn
}

export function decl( declaration_:       string[]|string
                    , initialization:     InitFn
                    , access:             NameFn
                    , reference:          NameFn): CxxDecl {
  const declaration    = Array.isArray(declaration_)    ? declaration_    : [ declaration_    ];

  return { declaration
         , initialization
         , access
         , reference
         };
}

