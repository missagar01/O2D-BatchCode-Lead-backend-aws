const levelWeights = {
  fatal: 0,
  error: 1,
  warn: 2,
  info: 3,
  debug: 4,
  trace: 5
};

class Logger {
  constructor(level = 'info') {
    this.level = level;
  }

  canLog(level) {
    return levelWeights[level] <= levelWeights[this.level];
  }

  setLevel(level) {
    this.level = level;
  }

  fatal(message, error) {
    if (this.canLog('fatal')) {
      console.error(`[FATAL] ${message}`, error || '');
    }
  }

  error(message, error) {
    if (this.canLog('error')) {
      console.error(`[ERROR] ${message}`, error || '');
    }
  }

  warn(message, error) {
    if (this.canLog('warn')) {
      console.warn(`[WARN] ${message}`, error || '');
    }
  }

  info(message, payload) {
    if (this.canLog('info')) {
      console.log(`[INFO] ${message}`, payload || '');
    }
  }

  debug(message, payload) {
    if (this.canLog('debug')) {
      console.debug(`[DEBUG] ${message}`, payload || '');
    }
  }

  trace(message, payload) {
    if (this.canLog('trace')) {
      console.trace(`[TRACE] ${message}`, payload || '');
    }
  }
}

const logger = new Logger('info');

const configureLogger = (level) => {
  logger.setLevel(level);
};

module.exports = { logger, configureLogger };


