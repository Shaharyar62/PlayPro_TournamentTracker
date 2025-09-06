class Logger {
  constructor() {
    this.logLevel = "info";
  }

  static log(message) {
    console.log(message);
  }
}

export default Logger;
