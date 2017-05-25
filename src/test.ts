import * as Parjs from 'parjs';

export default function runTest<T>( srcList: string[]
                                  , p: Parjs.LoudParser<T>
                                  , name: string = '_')
{
  console.log(`running test: ${name}`);
  for (const src of srcList) {
    console.log(`src: ${src}`);
    const result = p.parse(src);

    //if (result.kind == Parjs.ReplyKind.OK) {
      //console.log(`succ!`);
      //console.log(`${result.value}`);
    //} else {
      //console.log(`fail!`);
      //console.log(`${result.toString()}`);
    //}

    console.log(`out: ${result}`);
  }
}

