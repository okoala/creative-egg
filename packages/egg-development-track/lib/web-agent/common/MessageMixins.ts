export function addOffset(offset: number, envelope) {
  envelope.offset = offset;
}

export function addCorrelationBegin(correlationId, envelope) {
  envelope.types.push('correlation-begin');

  addCorrelation(correlationId, envelope);
}

export function addCorrelationEnd(correlationId, duration, envelope) {
  envelope.types.push('correlation-end');
  envelope.payload.duration = duration;

  addCorrelation(correlationId, envelope);
}

export function addCorrelation(correlationId, envelope) {
  envelope.types.push('correlation');
  envelope.payload.correlationId = correlationId;
}
