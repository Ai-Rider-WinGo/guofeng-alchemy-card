type EventHandler<T = unknown> = (payload: T) => void;

export class EventBus {
  private static handlers = new Map<string, Set<EventHandler>>();

  static on<T>(eventName: string, handler: EventHandler<T>): void {
    const handlers = this.handlers.get(eventName) ?? new Set<EventHandler>();
    handlers.add(handler as EventHandler);
    this.handlers.set(eventName, handlers);
  }

  static off<T>(eventName: string, handler: EventHandler<T>): void {
    this.handlers.get(eventName)?.delete(handler as EventHandler);
  }

  static emit<T>(eventName: string, payload: T): void {
    this.handlers.get(eventName)?.forEach((handler) => handler(payload));
  }

  static clear(): void {
    this.handlers.clear();
  }
}

