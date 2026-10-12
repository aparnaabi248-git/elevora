import React from 'react';
import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';

const NotFound = () => {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-6">
      <Compass className="w-20 h-20 text-indigo-500 animate-bounce mb-6" />
      <h1 className="text-6xl font-extrabold bg-gradient-to-r from-indigo-500 to-cyan-500 bg-clip-text text-transparent mb-2">404</h1>
      <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-4">Page Lost in Space</h2>
      <p className="text-slate-500 dark:text-slate-450 max-w-md mb-8">
        The dashboard view or resource you are looking for does not exist or has been shifted.
      </p>
      <Link
        to="/"
        className="px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 text-white font-bold shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/35 transition"
      >
        Go to Dashboard
      </Link>
    </div>
  );
};

export default NotFound;
