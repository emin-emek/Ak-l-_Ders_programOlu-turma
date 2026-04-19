import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import PlannerPage from './pages/PlannerPage.jsx';

// İleride eklenebilecek Login şablonu (Boş component olarak tutulabilir veya sadece Planner çalıştırılır)
const LoginPlaceholder = () => (
  <div style={{ padding: '4rem', textAlign: 'center', color: '#fff' }}>
    <h2>Giriş Yap (Şablon)</h2>
    <p>React Router yönlendirmesi çalışıyor. Ana sayfaya dönmek için tarayıcı üzerinden geri gidebilirsiniz.</p>
  </div>
);

function App() {
  return (
    <div className="app-container">
      {/* react-hot-toast Sağ üstte bildirim göstermesi için */}
      <Toaster 
        position="top-right" 
        toastOptions={{
          style: {
            background: '#1e1e2f',
            color: '#fff',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          },
        }}
      />
      
      <Routes>
        <Route path="/" element={<PlannerPage />} />
        <Route path="/login" element={<LoginPlaceholder />} />
      </Routes>
    </div>
  );
}

export default App;
