import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { SocketProvider } from './context/SocketContext';
import { HomePage } from './pages/HomePage';
import { SenderPage } from './pages/SenderPage';
import { ReceiverPage } from './pages/ReceiverPage';

const router = createBrowserRouter([
  { path: '/', element: <HomePage /> },
  { path: '/send/:roomId', element: <SenderPage /> },
  { path: '/join/:roomId', element: <ReceiverPage /> },
  { path: '*', element: <Navigate to="/" replace /> },
]);

export default function App() {
  return (
    <SocketProvider>
      <RouterProvider router={router} />
    </SocketProvider>
  );
}
