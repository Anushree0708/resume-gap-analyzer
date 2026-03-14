// src/components/Navbar.tsx

import { NavLink } from 'react-router-dom';

const links = [
  { to: '/',          label: 'Analyze'   },
  { to: '/history',   label: 'History'   },
  { to: '/analytics', label: 'Analytics' },
];

export default function Navbar() {
  return (
    <nav className="bg-indigo-700 text-white shadow-md">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-8">
        <span className="font-bold text-lg tracking-tight">
          📄 Resume Gap Analyzer
        </span>
        <div className="flex gap-2 ml-auto items-center">
          {links.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-white text-indigo-700'
                    : 'hover:bg-indigo-600 text-white'
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  );
}