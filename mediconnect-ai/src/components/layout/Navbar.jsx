import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ROUTES } from '../../utils/constants';
import {
  RiMenuLine, RiSearchLine, RiBellLine,
  RiUserLine, RiSettings3Line, RiLogoutBoxRLine,
} from 'react-icons/ri';

const MOCK_NOTIFICATIONS = [
  { id: 1, text: 'New patient registered: John Doe',          time: '2m ago',  unread: true  },
  { id: 2, text: 'Appointment confirmed for Dr. Patel',        time: '15m ago', unread: true  },
  { id: 3, text: 'Lab results uploaded for Patient #P-1002',   time: '1h ago',  unread: false },
  { id: 4, text: 'Pediatric ward review scheduled',            time: '2h ago',  unread: false },
];

const Navbar = ({ onMenuClick }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [notifOpen, setNotifOpen]     = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchVal, setSearchVal]     = useState('');
  const notifRef   = useRef(null);
  const profileRef = useRef(null);

  const unreadCount = MOCK_NOTIFICATIONS.filter(n => n.unread).length;
  const initials = user?.name
    ? user.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : 'MC';

  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current   && !notifRef.current.contains(e.target))   setNotifOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <header className="sticky top-0 z-10 h-15 bg-white border-b border-slate-200 flex items-center px-4 gap-3">
      
      {/* Menu Hamburger for mobile */}
      <button
        onClick={onMenuClick}
        className="lg:hidden p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
      >
        <RiMenuLine className="text-xl" />
      </button>

      {/* Brand Logo and Name */}
      <div className="flex items-center gap-2.5 mr-2 flex-shrink-0">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
          <span className="text-white font-black text-xs">M+</span>
        </div>
        <div className="leading-tight">
          <p className="text-slate-800 font-bold text-sm">MediConnect AI</p>
          <p className="text-slate-500 text-[10.5px] font-medium tracking-wide">Intelligent Hospital System</p>
        </div>
      </div>

      <div className="hidden sm:block w-px h-6 bg-slate-200 flex-shrink-0" />

      {/* Global Search */}
      <div className="flex-1 max-w-sm relative">
        <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none" />
        <input
          type="text"
          value={searchVal}
          onChange={e => setSearchVal(e.target.value)}
          placeholder="Search patients, doctors..."
          className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-4 py-1.5 text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
        />
      </div>

      <div className="flex-1" />

      {/* Notification and User Actions */}
      <div className="flex items-center gap-2">
        
        {/* Notifications Dropdown */}
        <div ref={notifRef} className="relative">
          <button
            onClick={() => { setNotifOpen(p => !p); setProfileOpen(false); }}
            className="relative p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <RiBellLine className="text-lg" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 rounded-full text-white text-[9px] font-bold flex items-center justify-center ring-2 ring-white">
                {unreadCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 top-11 w-80 bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden z-50">
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100 bg-slate-50">
                <p className="text-slate-700 font-semibold text-xs">Notifications</p>
                <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-semibold rounded-full">
                  {unreadCount} unread
                </span>
              </div>
              <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
                {MOCK_NOTIFICATIONS.map(n => (
                  <div key={n.id} className={`flex gap-3 px-4 py-3 hover:bg-slate-50 cursor-pointer transition-colors ${n.unread ? 'bg-blue-50/10' : ''}`}>
                    <div className={`mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${n.unread ? 'bg-blue-500' : 'bg-slate-300'}`} />
                    <div className="space-y-0.5">
                      <p className="text-xs text-slate-700 leading-snug">{n.text}</p>
                      <p className="text-[10px] text-slate-400">{n.time}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="px-4 py-2 border-t border-slate-100 text-center">
                <button className="text-[11px] text-blue-600 hover:text-blue-700 font-semibold transition-colors">
                  Mark all as read
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User Profile Dropdown */}
        <div ref={profileRef} className="relative">
          <button
            onClick={() => { setProfileOpen(p => !p); setNotifOpen(false); }}
            className="flex items-center gap-2 pl-2 pr-2.5 py-1 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <div className="w-7 h-7 rounded-md bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">
              {initials}
            </div>
            <div className="hidden md:block text-left leading-tight">
              <p className="text-xs font-semibold text-slate-800">{user?.name || 'Administrator'}</p>
              <p className="text-[9.5px] text-slate-400 capitalize">{user?.role || 'Admin'}</p>
            </div>
          </button>

          {profileOpen && (
            <div className="absolute right-0 top-11 w-48 bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden z-50">
              <div className="px-4 py-2.5 border-b border-slate-100 bg-slate-50">
                <p className="text-slate-700 font-semibold text-xs">{user?.name || 'Admin User'}</p>
                <p className="text-slate-400 text-[10px] truncate">{user?.email || 'admin@mediconnect.ai'}</p>
              </div>
              <div className="py-1">
                <button
                  onClick={() => { setProfileOpen(false); navigate(ROUTES.SETTINGS); }}
                  className="flex items-center gap-2.5 w-full px-4 py-2 text-xs text-slate-600 hover:text-slate-800 hover:bg-slate-50 transition-colors"
                >
                  <RiSettings3Line className="text-sm text-slate-400" /> Settings
                </button>
              </div>
              <div className="border-t border-slate-100 py-1">
                <button
                  onClick={() => { logout(); navigate(ROUTES.LOGIN); }}
                  className="flex items-center gap-2.5 w-full px-4 py-2 text-xs text-red-600 hover:bg-red-50 transition-colors"
                >
                  <RiLogoutBoxRLine className="text-sm" /> Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
