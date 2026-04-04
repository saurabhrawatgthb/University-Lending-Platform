import { lazy, Suspense, useState } from 'react';
import { AuthPage } from './AuthPage';

const Dashboard = lazy(() =>
  import('./Dashboard').then((module) => ({ default: module.Dashboard }))
);

function App() {
  const [user, setUser] = useState<any>(null);

  if (!user) {
    return <AuthPage onLogin={setUser} />;
  }

  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-600">
          Loading dashboard...
        </div>
      }
    >
      <Dashboard user={user} />
    </Suspense>
  );
}

export default App;
