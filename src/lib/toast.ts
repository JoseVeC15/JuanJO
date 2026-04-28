export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
}

type Subscriber = (items: ToastItem[]) => void;

const subscribers = new Set<Subscriber>();
let queue: ToastItem[] = [];

function publish() {
  subscribers.forEach(s => s([...queue]));
}

function add(type: ToastType, message: string, duration = 4000) {
  const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  queue = [...queue, { id, type, message }];
  publish();
  setTimeout(() => {
    queue = queue.filter(t => t.id !== id);
    publish();
  }, duration);
}

export function subscribeToasts(fn: Subscriber) {
  subscribers.add(fn);
  fn([...queue]);
  return () => { subscribers.delete(fn); };
}

export const toast = {
  success: (message: string) => add('success', message),
  error: (message: string) => add('error', message, 5500),
  warning: (message: string) => add('warning', message, 5000),
  info: (message: string) => add('info', message),
};
