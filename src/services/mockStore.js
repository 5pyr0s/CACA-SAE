// Tiny in-memory store that behaves like an onSnapshot listener: subscribe()
// runs the callback now and again after every change. Sprint 1 only; deleted
// when B's services switch to Firestore.
export function createMockStore(initial = []) {
  let items = [...initial];
  const listeners = new Set();
  return {
    all: () => items,
    update(fn) {
      items = fn(items);
      listeners.forEach((run) => run());
    },
    subscribe(run) {
      run();
      listeners.add(run);
      return () => listeners.delete(run);
    },
  };
}

/** Simulated network latency so busy states are visible in the prototype. */
export const fakeLatency = (ms = 300) => new Promise((resolve) => setTimeout(resolve, ms));
