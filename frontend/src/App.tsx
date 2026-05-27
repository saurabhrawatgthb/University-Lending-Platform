import { lazy, Suspense, useEffect, useState } from 'react';
import { AuthPage } from './AuthPage';
import { UserService } from './api/apiClient';

const Dashboard = lazy(() =>
  import('./Dashboard').then((module) => ({ default: module.Dashboard }))
);

function App() {
  const [user, setUser] = useState<any>(() => {
    const saved = localStorage.getItem('campuslend_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (err) {
        console.error('Failed to parse persisted user:', err);
      }
    }
    return null;
  });

  useEffect(() => {
    if (user?.id && !user.id.toString().startsWith('dev-')) {
      UserService.getUser(user.id).then(res => {
        if (res.data) {
          setUser(res.data);
          localStorage.setItem('campuslend_user', JSON.stringify(res.data));
        }
      }).catch(err => console.error('Failed to auto-refresh user profile:', err));
    }
  }, []);

  const handleLogin = (loggedUser: any) => {
    setUser(loggedUser);
    if (loggedUser) {
      localStorage.setItem('campuslend_user', JSON.stringify(loggedUser));
    } else {
      localStorage.removeItem('campuslend_user');
    }
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('campuslend_user');
  };

  if (!user) {
    return <AuthPage onLogin={handleLogin} />;
  }

  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-600">
          Loading dashboard...
        </div>
      }
    >
      <Dashboard user={user} onLogout={handleLogout} />
    </Suspense>
  );
}

export default App;
