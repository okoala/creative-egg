import * as ErrorStackParser from 'error-stack-parser';

export interface IStackFrame {
  fileName: string;
  functionName: string;
  lineNumber: number;
  columnNumber: number;
}

export function getStackTrace(cb: (frames: IStackFrame[]) => void): void {

  // stacktrace-js library has a Get method that will try to apply sourcemaps, however
  // that will trigger a download of the source, and will show up as an XHR request
  // in glimpse, which we don't want.  When we disable source-maps, then
  // stacktrace-js will reject a promise, which causes undesired debugger breakpoints
  // when the user has their app open in f12 tools. The easiest thing here is to put
  // generate the error ourself, and use the error-stack-parser library to parse the
  // error into stack frames.

  // this logic to get an error comes from stacktrace-js library.
  // See https://github.com/stacktracejs/stacktrace.js/blob/master/stacktrace.js#L25-L32
  function getError() {
    let err = new Error();
    if (!err.stack) {
      try {
        // Error must be thrown to get stack in IE
        throw new Error();
      } catch (e2) {
        err = e2;
      }
    }
    return err;
  }

  let stackFrames = ErrorStackParser.parse(getError());

  // slice off top frames where glimpse code is on the stack.
  for (let i = 0; i < stackFrames.length; i++) {
    if (stackFrames[i].fileName && !stackFrames[i].fileName.endsWith('/glimpse/agent/agent.js?hash={hash}')) {
      stackFrames = stackFrames.slice(i);
      break;
    }
  }

  // strip out any extra properties we don't want to send w/ the glimpse message
  const newFrames: IStackFrame[] = [];
  stackFrames.forEach((val: ErrorStackParser.StackFrame, index: number) => {
    newFrames[index] = {
      fileName: val.fileName,
      functionName: val.functionName,
      lineNumber: val.lineNumber,
      columnNumber: val.columnNumber,
    };
  });

  // various tests are expecting this to run asynchronously, which we'll eventually need if we ever hook up
  // source maps.  Even though we don't need it today, we'll leave this as an async function.
  window.setTimeout(() => { cb(newFrames); }, 0);
}
