// Simple event system for decoupled communication
export class EventSystem {
    constructor() {
      this.listeners = {};
    }
  
    on(event, callback) {
      console.log(`EventSystem: Subscribing to event "${event}"`);
      if (!this.listeners[event]) {
        this.listeners[event] = [];
      }
      this.listeners[event].push(callback);
    }
  
    off(event, callback) {
      if (!this.listeners[event]) return;
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    }
  
    emit(event, data) {
      console.log(`EventSystem: Emitting event "${event}"`, data);
      if (!this.listeners[event]) {
        console.warn(`EventSystem: No listeners for event "${event}"`);
        return;
      }
      this.listeners[event].forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event handler for "${event}":`, error);
        }
      });
    }
}