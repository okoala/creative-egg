
/**
 * This exports a class that can efficiently perform stream-based parsing of multipart/form-data http values.
 * The code is tolerant in the face of errors/malformed bodies in that the parser instance can be queried
 *  after all chunks have been admitted for summaries of the various parts.
 *
 * The parser implements a determinstic state machine which let's us parse the content
 * one character at a time, without backtracking. Each state has a set of transitions that map
 * the next character to a new state.  If no match is found, each state has a "fallback state".
 *
 * Key RFCs:
 *    - RFC 2388 - Returning Values From Forms: multipart/form-data (https://www.ietf.org/rfc/rfc2388.txt)
 *    - RFC 2046 - Multipurpose Internet Mail Extensions (MIME)
 *                 Part Two: Media Types. (https://tools.ietf.org/html/rfc2046)
 *               - Note section 5.1 of 2046 for definitions on boundary delimiters.
 *    - RFC 2045 - Multipurpose Internet Mail Extensions (MIME)
 *                 Part One: Format of Internet Message Bodies (https://tools.ietf.org/html/rfc2045)
 */

/**
 *  A summary of a single part in a multi-part/form body
 */
export interface IPartSummary {
  rawHeaders: string;      // string of raw headers section.
  bodyStartIndex: number;  // index in the multi-part payload of the first character of this part's body.
  bodyEndIndex: number;    // index in the multi-part payload of the first character  **after** this part's body.
}

/**
 * An enum that defines the various states the parser can be.  To account for arbitrary boundary strings,
 * a range is left open in the enum starting at Boundary1_LeadingCR and Boundary2_LeadingCR to account for
 * first boundary delimiter, and subsequent boundary delimiters.
 */
enum ParserState {
  None = 0,

  InitialState,                                  // indicates parser is at the initial state
  PreambleState,                                 // indicates we're consuming content before the first boundary marker
  // indicates parser found the first boundary section in the multi-part payload
  FoundBoundary_1,
  FoundBoundary_1_consuming_trailing_whitespace, // in trailing whitespace after first boundary
  FoundBoundary_1_CR_1,                          // first CR after boundary + whitespace
  FoundBoundary_1_LF_1,                          // first LF after boundary + whitespace
  FoundBoundary_1_CR_2,                          // second CR after boundary + whitespace.
  // second LF after boundary + whitespace.
  // A \r\n\r\n after a boundary indicates no headers, so we go straight to body
  FoundBoundary_1_LF_2,
  CloseBoundary_1_trailing_dash_1,               // indicates we've found 1st dash after a boundary

  InHeaders,                                     // indicates we're currently in the headers section
  InHeader_CR_1,                                 // first CR after headers
  InHeader_LF_1,                                 // first LF after in CRLF after headers section
  InHeader_CR_2,                                 // second CR in a \r\n\r sequence after headers
  InHeader_LF_2,                                 // found \r\n\r\n after headers, so we can transition to InBody

  InBody,                                        // indicates we're currently in the bodies section

  // indicates parser found a "internal boundary", that is, not the first boundary in the payload
  FoundBoundary_2,
  FoundBoundary_2_consuming_trailing_whitespace, // in trailing whitespace after a internal boundary
  FoundBoundary_2_CR_1,                          // indicates first CR after boundary + whitespace
  FoundBoundary_2_LF_1,                          // indicates first LF after boundary + whitespace
  FoundBoundary_2_CR_2,                          // indicates second CR after boundary + whitespace.
  // indicates second LF after boundary + whitespace.  A \r\n\r\n after a boundary indicates no headers
  FoundBoundary_2_LF_2,
  CloseBoundary_2_trailing_dash_1,               // indicates we've found 1st dash after a boundary

  Done,                                          // indicates we've found 2nd dash after a boundary - we're done

  // indicates first CR of the 1st boundary.
  // Note that up to the next 73 IDs correspond to states of characters in the boundary.
  Boundary1_LeadingCR,

  // indicates first CR of the 2nd boundary.
  // Add 80 to previous since max length on a boundary is 70 characters, not including leading \r\n--
  Boundary2_LeadingCR = Boundary1_LeadingCR + 80,
}

/**
 * An entry for the state machine.  `transitions` array defines how the next input character
 * will move from this state to subsequent state
 */
interface IStateEntry {
  stateID: ParserState | number;         // ID for this state.  Can be used to lookup state in state table

  // state ID we'll transition to if next character is not equal to a character in transitions[]
  fallBackStateID: ParserState | number;

  fallBackStateEntry?: IStateEntry;      // resolved StateEntry instance associated with fallBackState
  transitions: ITransition[];            // transition character
  description?: string;                  // a string to help debug this.
  onFallback?: () => void;               // optional callback to fire when we move to fallback state
}

/**
 * interface that defines a transition, given character `transitionChar`, we'll transition to newState
 */
interface ITransition {
  transitionChar: string;     // the single character, that if matched, will trigger a transition to newState
  newStateID: number;           // the newState to transition to.
  newStateEntry?: IStateEntry; // resolve StateEntry instance associated with newState.
  onTransition?: () => void;  // optional callback to be raised when we do this transition
}

/**
 * Map from a number (a ParserState enum val for the "major states", or a number for "minor states"), to a StateEntry
 * that defines how to transition from this state to the next state.
 */
interface IStateTable {
  [key: number]: IStateEntry;
}

/**
 * class that performs the parsing.
 */
export class MultiPartFormParser {

  // lookup table on how to go from one parser state to another parser state
  private stateTable: IStateTable = {};

  private currentState: IStateEntry;

  private parts: IPartSummary[] = [];
  private rawHeaderSections: string[] = [];
  private consumeHeaders: boolean = false;
  private currentCharacterIndex: number = 0;
  private currentBoundaryStartIndex = 0;

  public constructor(private boundary: string, private encoding: string) {

    if (!boundary) {
      throw new Error('boundary string must be a valid string');
    }

    if (boundary.length > 70 || boundary.length < 1) {
      throw new Error(
        `
          Boundary string has unsupported size of ${boundary.length}.
          Length is 70 characters. See RFC 2046 Section 5.1.1
        `,
      );
    }

    this.populateStateTable();
    this.resolveStateTable();
    this.currentState = this.stateTable[ParserState.InitialState];
  }

  /**
   * Add a chunk of body to be parsed.  Once all chunks have been added, the part summaries can
   * be retrieved by calling getParts()
   */
  public addChunk(chunk: Buffer | string) {
    if (Buffer.isBuffer(chunk)) {
      this.scanBuffer(chunk as Buffer);
    } else if (typeof (chunk) === 'string') {
      this.scanString(chunk as string);
    } else {
      throw new Error(`unexpected type ${typeof chunk} passed to addChunk`);
    }
  }

  /**
   * Retrieve known parts.  For accurate representation,
   * should only be called after all chunks of the body have been added.
   */
  public getParts(): IPartSummary[] {
    return this.parts;
  }

  /**
   * Add all the state transitions for the parser
   */
  private populateStateTable() {

    // first rule to get off the initial state
    this.addStateEntry(
      ParserState.InitialState,
      ParserState.PreambleState,
      [
        // special case if first character is a -, jump into first dash
        {
          transitionChar: '-',
          newStateID: ParserState.Boundary1_LeadingCR + 2,
          onTransition: () => { this.currentBoundaryStartIndex = this.currentCharacterIndex; },
        },
        {
          transitionChar: '\r', newStateID: ParserState.Boundary1_LeadingCR,
        },
      ]);

    // state transitions to go from PreambleState -> FoundBoundary_1
    this.addBoundaryStates(
      '\r\n--' + this.boundary,
      ParserState.PreambleState,
      ParserState.FoundBoundary_1,
      ParserState.PreambleState,
      ParserState.Boundary1_LeadingCR,
    );

    // from FoundBoundary state to consuming whitespace
    this.addStateEntry(
      ParserState.FoundBoundary_1,
      ParserState.PreambleState,
      [
        { transitionChar: '-', newStateID: ParserState.CloseBoundary_1_trailing_dash_1 },
        { transitionChar: ' ', newStateID: ParserState.FoundBoundary_1_consuming_trailing_whitespace },
        { transitionChar: '\t', newStateID: ParserState.FoundBoundary_1_consuming_trailing_whitespace },
        { transitionChar: '\n', newStateID: ParserState.FoundBoundary_1_consuming_trailing_whitespace },
        { transitionChar: '\r', newStateID: ParserState.FoundBoundary_1_CR_1 },
      ]);

    // '-' => Done.  2nd dash after boundary indicates we're done
    this.addStateEntry(
      ParserState.CloseBoundary_1_trailing_dash_1,
      ParserState.PreambleState,
      [
        {
          transitionChar: '-', newStateID: ParserState.Done, onTransition: () => { this.notifyDone(); },
        },
        {
          transitionChar: '\r',
          newStateID: ParserState.Boundary1_LeadingCR,
          onTransition: () => { this.currentBoundaryStartIndex = this.currentCharacterIndex; },
        },
      ]);

    // consume any remaining characters after done state
    this.addStateEntry(
      ParserState.Done,
      ParserState.Done,
      [
        // no-op.  just stay in Done state
      ]);

    // rules to consume trailing whitespace after a boundary
    this.addStateEntry(
      ParserState.FoundBoundary_1_consuming_trailing_whitespace,
      ParserState.PreambleState,
      [
        { transitionChar: ' ', newStateID: ParserState.FoundBoundary_1_consuming_trailing_whitespace },
        { transitionChar: '\t', newStateID: ParserState.FoundBoundary_1_consuming_trailing_whitespace },
        { transitionChar: '\r', newStateID: ParserState.FoundBoundary_1_CR_1 },
        // a \n w/out being preceded by \r is considered whitespace
        { transitionChar: '\n', newStateID: ParserState.FoundBoundary_1_consuming_trailing_whitespace },
      ]);

    // rules to transition from CR_1 after boundary
    this.addStateEntry(
      ParserState.FoundBoundary_1_CR_1,
      ParserState.PreambleState,
      [
        { transitionChar: '\n', newStateID: ParserState.FoundBoundary_1_LF_1 },
        { transitionChar: ' ', newStateID: ParserState.FoundBoundary_1_consuming_trailing_whitespace },
        { transitionChar: '\t', newStateID: ParserState.FoundBoundary_1_consuming_trailing_whitespace },
        { transitionChar: '\r', newStateID: ParserState.FoundBoundary_1_CR_1 },
      ]);

    // rules to go from FoundBoundary_LF_1 => FoundBoundary_CR_2
    this.addStateEntry(
      ParserState.FoundBoundary_1_LF_1,
      ParserState.InHeaders,
      [
        { transitionChar: '\r', newStateID: ParserState.FoundBoundary_1_CR_2 },
      ],
      () => { this.notifyStartHeaderSection(); });

    // rules to go from FoundBoundary_CR_2 => FoundBoundary_LF_2
    this.addStateEntry(
      ParserState.FoundBoundary_1_CR_2,
      ParserState.InHeaders,
      [
        { transitionChar: '\n', newStateID: ParserState.FoundBoundary_1_LF_2 },
      ],
      () => { this.notifyStartHeaderSection(); });

    // rules to go from FoundBoundary_CR_2 => FoundBoundary_LF_2.
    // CRLFCRLF after boundary means no headers, and go directly into InBody
    this.addStateEntry(
      ParserState.FoundBoundary_1_LF_2,
      ParserState.InBody,
      [
        // empty - just always go to in-body on next character
      ],
      () => {
        this.notifyStartHeaderSection();
        this.notifyEndHeaderSection();
        this.notifyStartBodySection();
      },
    );

    // rules to go from InHeaders -> InBody
    this.addStateEntry(
      ParserState.InHeaders,
      ParserState.InHeaders,
      [
        { transitionChar: '\r', newStateID: ParserState.InHeader_CR_1 },
      ],
    );
    this.addStateEntry(
      ParserState.InHeader_CR_1,
      ParserState.InHeaders,
      [
        { transitionChar: '\n', newStateID: ParserState.InHeader_LF_1 },
      ],
    );
    this.addStateEntry(
      ParserState.InHeader_LF_1,
      ParserState.InHeaders,
      [
        { transitionChar: '\r', newStateID: ParserState.InHeader_CR_2 },
        {
          transitionChar: '-',
          newStateID: ParserState.Boundary2_LeadingCR + 2,
          onTransition: () => { this.currentBoundaryStartIndex = this.currentCharacterIndex - 2; },
        },
      ],
    );
    this.addStateEntry(
      ParserState.InHeader_CR_2,
      ParserState.InHeaders,
      [
        { transitionChar: '\n', newStateID: ParserState.InHeader_LF_2 }
      ],
    );
    this.addStateEntry(
      ParserState.InHeader_LF_2,
      ParserState.InBody,
      [
        // empty - just always go to in-body on next character
      ],
      () => {
        this.notifyEndHeaderSection();
        this.notifyStartBodySection();
      },
    );

    // transition from InBody -> FoundBoundary_2
    this.addBoundaryStates(
      '\r\n--' + this.boundary,
      ParserState.InBody,
      ParserState.FoundBoundary_2,
      ParserState.InBody,
      ParserState.Boundary2_LeadingCR,
    );

    // from FoundBoundary state to consuming whitespace
    this.addStateEntry(
      ParserState.FoundBoundary_2,
      ParserState.InBody,
      [
        { transitionChar: '-', newStateID: ParserState.CloseBoundary_2_trailing_dash_1 },
        { transitionChar: ' ', newStateID: ParserState.FoundBoundary_2_consuming_trailing_whitespace },
        { transitionChar: '\t', newStateID: ParserState.FoundBoundary_2_consuming_trailing_whitespace },
        { transitionChar: '\n', newStateID: ParserState.FoundBoundary_2_consuming_trailing_whitespace },
        { transitionChar: '\r', newStateID: ParserState.FoundBoundary_2_CR_1 },
      ]);

    // '-' => Done.  2nd dash after boundary indicates we're done
    this.addStateEntry(
      ParserState.CloseBoundary_2_trailing_dash_1,
      ParserState.InBody,
      [{
        transitionChar: '-', newStateID: ParserState.Done,
        onTransition: () => {
          this.notifyEndBodySection();
          this.notifyDone();
        },
      },
      {
        transitionChar: '\r',
        newStateID: ParserState.Boundary2_LeadingCR,
        onTransition: () => { this.currentBoundaryStartIndex = this.currentCharacterIndex; },
      },
      ]);

    // rules to consume trailing whitespace after a boundary
    this.addStateEntry(
      ParserState.FoundBoundary_2_consuming_trailing_whitespace,
      ParserState.InBody,
      [
        { transitionChar: ' ', newStateID: ParserState.FoundBoundary_2_consuming_trailing_whitespace },
        { transitionChar: '\t', newStateID: ParserState.FoundBoundary_2_consuming_trailing_whitespace },
        { transitionChar: '\r', newStateID: ParserState.FoundBoundary_2_CR_1 },
        // a \n w/out being preceded by \r is considered whitespace
        { transitionChar: '\n', newStateID: ParserState.FoundBoundary_2_consuming_trailing_whitespace },
      ]);

    // rules to transition from CR_1 after boundary
    this.addStateEntry(
      ParserState.FoundBoundary_2_CR_1,
      ParserState.InBody,
      [
        { transitionChar: '\n', newStateID: ParserState.FoundBoundary_2_LF_1 },
        { transitionChar: ' ', newStateID: ParserState.FoundBoundary_2_consuming_trailing_whitespace },
        { transitionChar: '\t', newStateID: ParserState.FoundBoundary_2_consuming_trailing_whitespace },
        { transitionChar: '\r', newStateID: ParserState.FoundBoundary_2_CR_1 }
      ]);

    // rules to go from FoundBoundary_LF_1 => FoundBoundary_CR_2
    this.addStateEntry(
      ParserState.FoundBoundary_2_LF_1,
      ParserState.InHeaders,
      [
        { transitionChar: '\r', newStateID: ParserState.FoundBoundary_2_CR_2 }
      ],
      () => {
        this.notifyEndBodySection();
        this.notifyStartHeaderSection();
      });

    // rules to go from FoundBoundary_CR_2 => FoundBoundary_LF_2
    this.addStateEntry(
      ParserState.FoundBoundary_2_CR_2,
      ParserState.InHeaders,
      [
        { transitionChar: '\n', newStateID: ParserState.FoundBoundary_2_LF_2 }
      ],
      () => {
        this.notifyEndBodySection();
        this.notifyStartHeaderSection();
      });

    // rules to go from FoundBoundary_CR_2 => FoundBoundary_LF_2.
    // CRLFCRLF after boundary means no headers, and go directly into InBody
    this.addStateEntry(
      ParserState.FoundBoundary_2_LF_2,
      ParserState.InBody,
      [
        // empty - just always go to in-body on next character
      ],
      () => {
        this.notifyEndBodySection();
        this.notifyStartHeaderSection();
        this.notifyEndHeaderSection();
        this.notifyStartBodySection();
      }
    );
  }

  /**
   * resolves indexes for transition states to their state entry instances.  Avoids any runtime lookups into state table
   */
  private resolveStateTable() {
    for (const k in this.stateTable) {
      if (this.stateTable.hasOwnProperty(k)) {
        const e: IStateEntry = this.stateTable[k];
        e.fallBackStateEntry = this.stateTable[e.fallBackStateID];
        for (let i = 0; i < e.transitions.length; i++) {
          e.transitions[i].newStateEntry = this.stateTable[e.transitions[i].newStateID];
        }
      }
    }
  }

  /**
   * Add a state entry to the state table.
   * Transitions from `initialState` are defined by the entries in `transitions` array.
   */
  private addStateEntry(
    initialState: ParserState | number,
    fallBackStateID: ParserState,
    transitions: ITransition[],
    onFallback?: () => void, debugDescription?: string,
  ) {

    const t: IStateEntry = {
      stateID: initialState,
      fallBackStateID,
      transitions,
      onFallback,
      description: debugDescription || `
        initialState: ${ParserState[initialState]},
        finalState: ${ParserState[fallBackStateID]},
        fallbackState = ${ParserState[fallBackStateID]}
      `,
    };

    if (this.stateTable[initialState]) {
      throw new Error(`unexpected found existing transition table entry for state ${ParserState[initialState]}`);
    }

    this.stateTable[initialState] = t;
  }

  /**
   * Add a set of state transitions for a boundary string.  e.g., `--boundary-delimiter-1`
   *
   * @s: the string to construct state entries for.
   * A "minor state" will be constructed for each character in this string
   * @initialState:  the initial state of the parser to apply this rule.
   * @finalTransitionState:  the final state we will transition too if the string is matched.
   * @fallBackState:  The fallback state we will revert to if we don't match a character.
   * @nextStateId:  The number at which we should start assigning state IDs.
   * This should be unique among all the state entries
   */
  private addBoundaryStates(
    s: string,
    initialState: ParserState,
    finalTransitionState: ParserState,
    fallBackState: ParserState,
    nextStateId: number,
  ) {
    let startState: number = initialState;
    for (let i = 0; i < s.length; i++) {

      const currentTransitionId = nextStateId++;
      const transition: ITransition = {
        transitionChar: s[i],
        newStateID: i === s.length - 1 ? finalTransitionState : currentTransitionId
      };

      // special case to capture the index of the start of the next potential boundary delimiter.
      if (i === 0) {
        transition.onTransition = () => { this.currentBoundaryStartIndex = this.currentCharacterIndex; };
      }

      this.addStateEntry(
        startState,
        fallBackState, [transition],
        undefined,
        ` intialState: ${ParserState[initialState]},
          finalState: ${ParserState[finalTransitionState]},
          fallbackState = ${ParserState[fallBackState]},
          i = ${i},
          s = ${s}
        `,
      );
      startState = transition.newStateID;
    }
  }

  private notifyStartHeaderSection() {
    const partSummary: IPartSummary = {
      rawHeaders: '',
      bodyStartIndex: -1,
      bodyEndIndex: -1,
    };

    this.rawHeaderSections.push('');
    this.parts.push(partSummary);
    this.consumeHeaders = true;
  }

  private notifyEndHeaderSection() {
    this.consumeHeaders = false;
    const summary = this.parts[this.parts.length - 1];
    summary.rawHeaders = summary.rawHeaders.trim();
  }

  private notifyStartBodySection() {
    const summary = this.parts[this.parts.length - 1];
    summary.bodyStartIndex = this.currentCharacterIndex;
  }

  private notifyEndBodySection() {
    const summary = this.parts[this.parts.length - 1];
    if (summary.bodyStartIndex >= 0) {
      summary.bodyEndIndex = this.currentBoundaryStartIndex;
    }
  }

  private notifyNextCharacter(c: string) {
    if (this.consumeHeaders) {
      this.parts[this.parts.length - 1].rawHeaders += c;
    }
  }

  private notifyDone() {
    // no-op
  }

  /**
   * scan a buffer that has been added to
   */
  private scanBuffer(chunk: Buffer) {
    // TODO - work directly on buffer w/out converting to a string
    // not sure what is more efficient here.  We should be able to look at a sequence of characters
    //
    const s: string = chunk.toString(this.encoding);
    this.scanString(s);
  }

  /**
   * scan a string of characters that has been added
   */
  private scanString(chunk: string) {
    for (let currIndex = 0; currIndex < chunk.length; currIndex++) {
      const currChar = chunk[currIndex];

      const stateEntry = this.currentState;

      let isMatch = false;
      for (let j = 0; j < stateEntry.transitions.length; j++) {
        const transition = stateEntry.transitions[j];
        if (currChar === transition.transitionChar) {

          isMatch = true;

          this.currentState = transition.newStateEntry;
          if (transition.onTransition) {
            transition.onTransition();
          }

          break;
        }
      }

      if (!isMatch) {
        if (this.currentState.stateID !== stateEntry.fallBackStateID) {
          this.currentState = stateEntry.fallBackStateEntry;
          if (stateEntry.onFallback) {
            stateEntry.onFallback();
          }
        }
      }

      if (this.consumeHeaders) {
        this.notifyNextCharacter(currChar);
      }
      this.currentCharacterIndex++;
    }
  }
}
