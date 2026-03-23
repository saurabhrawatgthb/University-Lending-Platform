import React, { useState } from 'react';
import { AuthPage } from './AuthPage';
import { Dashboard } from './Dashboard';

function App() {
  const [user, setUser] = useState<any>(null);

  if (!user) {
    return <AuthPage onLogin={setUser} />;
  }

  return <Dashboard user={user} />;
}

export default App;
