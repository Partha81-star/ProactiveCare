import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ROUTES } from '../../utils/constants';
import {
  RiDashboardLine, RiUserHeartLine, RiStethoscopeLine,
  RiCalendar2Line, RiSparklingLine, RiBellLine, RiBarChart2Line,
  RiSettings3Line, RiLogoutBoxRLine, RiHospitalLine, RiCloseLine,
} from 'react-icons/ri';

const NAV_ITEMS = [
  { to: ROUTES.DASHBOARD,        label: 'Dashboard',            Icon: RiDashboardLine     },
  { to: ROUTES.PATIENTS,         label: 'Patient Registration', Icon: RiUserHeartLine     },
  { to: ROUTES.DOCTORS,          label: 'Doctor Management',    Icon: RiStethoscopeLine   },
  { to: ROUTES.APPOINTMENTS,     label: 'Appointment Booking',  Icon: RiCalendar2Line     },
  { to: ROUTES.AI_NOTIFICATIONS, label: 'AI Notifications',     Icon: RiSparklingLine     },
  { to: ROUTES.NOTIFICATIONS,    label: 'Notification History', Icon: RiBellLine          },
  { to: ROUTES.ANALYTICS,        label: 'Analytics',            Icon: RiBarChart2Line     },
  { to: ROUTES.SETTINGS,         label: 'Settings',             Icon: RiSettings3Line     },
];

const Sidebar = ({ isOpen, onClose }) => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate(ROUTES.LOGIN);
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-20 bg-slate-900/40 backdrop-blur-xs lg:hidden"
          onClick={onClose}
        />
      )}

      <aside className={`
        fixed top-0 left-0 z-30 h-full w-64 bg-white border-r border-slate-200
        flex flex-col transition-transform duration-200 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static lg:z-auto
      `}>

        {/* Logo / Header */}
        <div className="flex items-center justify-between px-5 py-4.5 border-b border-slate-150">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center shadow-sm">
              <RiHospitalLine className="text-white text-lg" />
            </div>
            <div>
              <p className="text-slate-800 font-bold text-sm leading-tight">MediConnect</p>
              <p className="text-blue-600 text-[10.5px] font-semibold tracking-wider">AI SYSTEM</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <RiCloseLine className="text-xl" />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map(({ to, label, Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => window.innerWidth < 1024 && onClose()}
              className={({ isActive }) => `
                flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                transition-all duration-150 group border border-transparent
                ${isActive
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-slate-600 hover:text-slate-950 hover:bg-slate-50'
                }
              `}
            >
              <Icon className="text-base flex-shrink-0" />
              <span className="flex-1">{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Divider + Logout */}
        <div className="mx-4 border-t border-slate-150 mb-2" />
        <div className="px-3 pb-4">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium
              text-slate-500 hover:text-red-600 hover:bg-red-50 transition-all duration-150"
          >
            <RiLogoutBoxRLine className="text-base flex-shrink-0" />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
