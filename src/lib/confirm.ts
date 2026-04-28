export interface ConfirmState {
  open: boolean;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  danger: boolean;
}

type Subscriber = (state: ConfirmState) => void;

const subscribers = new Set<Subscriber>();
let resolver: ((ok: boolean) => void) | null = null;

const DEFAULT_STATE: ConfirmState = {
  open: false, message: '', confirmLabel: 'Confirmar', cancelLabel: 'Cancelar', danger: false,
};

function publish(state: ConfirmState) {
  subscribers.forEach(s => s(state));
}

export function subscribeConfirm(fn: Subscriber) {
  subscribers.add(fn);
  return () => { subscribers.delete(fn); };
}

export function resolveConfirm(ok: boolean) {
  if (resolver) { resolver(ok); resolver = null; }
  publish(DEFAULT_STATE);
}

export interface ConfirmOptions {
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
}

export function confirmAsync(options: string | ConfirmOptions): Promise<boolean> {
  const opts = typeof options === 'string' ? { message: options } : options;
  return new Promise((resolve) => {
    resolver = resolve;
    publish({
      open: true,
      message: opts.message,
      confirmLabel: opts.confirmLabel ?? 'Confirmar',
      cancelLabel: opts.cancelLabel ?? 'Cancelar',
      danger: opts.danger ?? false,
    });
  });
}
