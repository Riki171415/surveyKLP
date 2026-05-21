import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import SurveyForm from './components/SurveyForm';
import Dashboard from './components/Dashboard';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-slate-50">
        <nav className="bg-white shadow-sm sticky top-0 z-50">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16 items-center">
              <div className="flex-shrink-0 flex items-center">
                <span className="font-bold text-xl text-primary-600">Survey KKLP</span>
              </div>
              <div className="flex space-x-4">
                <a href="/" className="text-slate-600 hover:text-primary-600 font-medium px-3 py-2 rounded-md text-sm transition-colors">Isi Survey</a>
                <a href="/dashboard" className="text-slate-600 hover:text-primary-600 font-medium px-3 py-2 rounded-md text-sm transition-colors">Dashboard</a>
              </div>
            </div>
          </div>
        </nav>
        <main className="py-10">
          <Routes>
            <Route path="/" element={<SurveyForm />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/edit/:id" element={<SurveyForm isEdit={true} />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
