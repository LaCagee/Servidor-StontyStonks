import { BrowserRouter } from 'react-router-dom';
import AppRoutes from './routes/AppRoutes';
import { SettingsProvider } from './context/SettingsContext';
import { NotificationsProvider } from './context/NotificationsContext';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <SettingsProvider>
        <NotificationsProvider>
          <AppRoutes />
        </NotificationsProvider>
      </SettingsProvider>
    </BrowserRouter>
  );
}

export default App;