export class DatabaseUnavailableError extends Error {
  constructor(message = "Service catalogue is currently unavailable. Please try again shortly.") {
    super(message);
    this.name = "DatabaseUnavailableError";
  }
}
