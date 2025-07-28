interface EventsError {
  description: string;
  message: string;
  code?: number;
}

class FireEventsError extends Error implements EventsError {
  description: string;
  code?: number;

  constructor(message: string, description: string, code?: number) {
    super(message);
    this.name = "FireEventsError";
    this.code = code;
    this.description = description;
  }
}

export const handleError = (error: EventsError) => { throw new FireEventsError(error.message, error.description, error.code)};
