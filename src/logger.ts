export class Logger {
    static ENABLED: boolean;

    // Logs a debug message if the Logger is enabled and verbose.
    // static debug(...args) {
    //     if (Logger.VERBOSE) Logger.info(...args);
    // }

    // Logs an information message if the Logger is enabled.
    static info(...args) {
        if (Logger.ENABLED) console.log(...args);
    }

    // Logs a warning message if the Logger is enabled.
    static warning(...args) {
        if (Logger.ENABLED) console.warn(...args);
    }

    // Logs an error message if the Logger is enabled.
    static error(...args) {
        if (Logger.ENABLED) console.error(...args);
    }
}

Logger.ENABLED = true;
