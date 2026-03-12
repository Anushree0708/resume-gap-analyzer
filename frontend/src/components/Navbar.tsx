import { NavLink } from 'react-router-dom';

const links = [
  { to: '/', label: 'Analyze' },
  { to: '/history', label: 'History' },
  { to: '/analytics', label: 'Analytics' },
];

interface Props {
  userEmail: string | null;
  onLogout: () => void;
}

export default function Navbar({ userEmail, onLogout }: Props) {
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

          {/* Divider */}
          <div className="w-px h-5 bg-indigo-500 mx-1" />

          {/* User email */}
          {userEmail && (
            <span className="text-indigo-200 text-xs hidden sm:block max-w-[160px] truncate">
              {userEmail}
            </span>
          )}

          {/* Logout */}
          <button
            onClick={onLogout}
            className="px-3 py-1.5 rounded-full text-sm font-medium bg-indigo-800 hover:bg-indigo-900 transition-colors"
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}
