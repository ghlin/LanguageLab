import { tryM }   from './reduce-tree';
import p          from './s-exprP';
import * as Parjs from 'parjs';

import * as readline from 'readline';

const rl = readline.createInterface({ input: process.stdin
                                    , output: process.stdout });

const cb = (line: string) => {
  if (line === ':q') {
    return rl.close();
  }

  if (line.length === 0)
    return rl.question(`Eval> `, cb);

  const r = p.parse(line);

  if (r.kind === Parjs.ReplyKind.OK) {
    const ev = r.value;

    console.log(`in  = ${ev.t}: ${ev}`);

    const ov = tryM(ev);

    if (ov.isOk()) {
      console.log(`out = ${ov.get().t}: ${ov.get()}`);
    } else {
      console.log(`err = ${ov.get()}`);
    }
  } else {
    console.log(`Ooops: ${r}`);
  }

  return rl.question(`Eval> `, cb);
}

rl.question(`Eval> `, cb);

rl.on('close', () => console.log(`Bye Bye ~`));
