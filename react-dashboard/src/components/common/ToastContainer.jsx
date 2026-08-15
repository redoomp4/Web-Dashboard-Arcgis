import { Icon } from './Icons';

export function ToastContainer({ toasts, onRemove }) {
  if (!toasts || !toasts.length) return null;

  return (
    <div className="toast-container" aria-live="polite">
      {toasts.map(toast => (
        <div key={toast.id} className={`toast-card toast-${toast.type}`}>
          <div className="toast-icon">
            {toast.type === 'success' && <Icon name="check" size={16} />}
            {toast.type === 'error' && <Icon name="alert-triangle" size={16} />}
            {toast.type === 'warning' && <Icon name="alert-triangle" size={16} />}
            {toast.type === 'info' && <Icon name="bolt" size={16} />}
          </div>
          <div className="toast-msg">{toast.message}</div>
          <button className="toast-close" onClick={() => onRemove(toast.id)} aria-label="Tutup notifikasi">
            <Icon name="x" size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
