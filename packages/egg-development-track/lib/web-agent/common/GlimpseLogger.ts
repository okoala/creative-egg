export interface IGlimpseLogger {
  error(message?: string): void;
}

export class GlimpseLogger implements IGlimpseLogger {
  constructor(private logToConsole: boolean) {
  }

  public error(message?: string): void {
    if (this.logToConsole) {
      // tslint:disable-next-line:no-console
      console.error(message);
    }
  }
}

const logger = new GlimpseLogger(LOG_TO_CONSOLE);

export default logger;
