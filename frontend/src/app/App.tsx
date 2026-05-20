import { useEffect } from 'react';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { RouterProvider } from 'react-router';
import { store, persistor } from './store';
import { Loader2 } from 'lucide-react';
import { router } from './router';
import { Toaster } from 'sonner';
import { connectSocket, disconnectSocket } from '@/shared/socket/socketClient';
 
/** Shown during the brief localStorage rehydration window. */
function PersistLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-surface">
      <Loader2 size={28} className="animate-spin text-brand-orange" />
    </div>
  );
}

export function App() {
  useEffect(() => {
    connectSocket();

    return () => {
      disconnectSocket();
    };
  }, []);

  return (
    <Provider store={store}>
      <PersistGate loading={<PersistLoader />} persistor={persistor}>
        <RouterProvider router={router} />
      </PersistGate>
      {/* Toaster outside PersistGate so toasts work during rehydration */}
      <Toaster position="top-right" richColors />
    </Provider>
  );
}
