import { useNavigate } from 'react-router-dom';
import {
  RiUserHeartLine, RiCalendarCheckLine, RiMessageLine,
  RiTimeLine, RiUserAddLine, RiCheckDoubleLine,
  RiFileListLine, RiAlertLine, RiStethoscopeLine,
  RiBellLine, RiArrowUpLine, RiArrowDownLine,
  RiCalendarLine, RiDownloadLine, RiPulseLine,
} from 'react-icons/ri';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { ROUTES } from '../utils/constants';

const STAT_CARDS = [
  {
    id: 1, label: 'Total Patients', value: '4,827',
    change: '+12%', up: true, sub: 'vs last month',
    Icon: RiUserHeartLine,
    iconBg: 'bg-blue-50', iconColor: 'text-blue-600',
  },
  {
    id: 2, label: "Today's Appointments", value: '38',
    change: '+5', up: true, sub: 'vs yesterday',
    Icon: RiCalendarCheckLine,
    iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600',
  },
  {
    id: 3, label: 'Messages Sent', value: '1,293',
    change: '+8%', up: true, sub: 'this month',
    Icon: RiMessageLine,
    iconBg: 'bg-indigo-50', iconColor: 'text-indigo-600',
  },
  {
    id: 4, label: 'Pending Notifications', value: '14',
    change: '-3', up: false, sub: 'awaiting dispatch',
    Icon: RiTimeLine,
    iconBg: 'bg-amber-50', iconColor: 'text-amber-600',
  },
];

const PATIENT_TREND = [
  { month: 'Jan', admitted: 320, discharged: 290 },
  { month: 'Feb', admitted: 380, discharged: 340 },
  { month: 'Mar', admitted: 410, discharged: 380 },
  { month: 'Apr', admitted: 390, discharged: 370 },
  { month: 'May', admitted: 450, discharged: 420 },
  { month: 'Jun', admitted: 490, discharged: 460 },
  { month: 'Jul', admitted: 520, discharged: 480 },
];

const APPT_BY_DAY = [
  { day: 'Mon', count: 28 },
  { day: 'Tue', count: 35 },
  { day: 'Wed', count: 42 },
  { day: 'Thu', count: 38 },
  { day: 'Fri', count: 30 },
  { day: 'Sat', count: 18 },
  { day: 'Sun', count: 10 },
];

const DEPT_DATA = [
  { name: 'Cardiology',   value: 28, color: '#2563EB' },
  { name: 'Orthopedics',  value: 22, color: '#4F46E5' },
  { name: 'Neurology',    value: 18, color: '#059669' },
  { name: 'Pediatrics',   value: 16, color: '#D97706' },
  { name: 'General',      value: 16, color: '#DC2626' },
];

const RECENT_ACTIVITY = [
  { id: 1, text: 'New patient John Doe registered',         time: '2 min ago',  Icon: RiUserAddLine,      color: 'text-blue-600',    bg: 'bg-blue-50' },
  { id: 2, text: 'Appointment confirmed — Dr. Patel',        time: '15 min ago', Icon: RiCheckDoubleLine,  color: 'text-emerald-600', bg: 'bg-emerald-50' },
  { id: 3, text: 'Lab results uploaded for Patient #P-1002', time: '1 hr ago',   Icon: RiFileListLine,     color: 'text-indigo-600',  bg: 'bg-indigo-50' },
  { id: 4, text: 'ICU capacity alert — 85% full',           time: '2 hr ago',   Icon: RiAlertLine,        color: 'text-red-600',     bg: 'bg-red-50' },
  { id: 5, text: 'Dr. Emily Chen completed 12 consultations',time: '3 hr ago',   Icon: RiStethoscopeLine,  color: 'text-slate-600',   bg: 'bg-slate-100' },
];

const UPCOMING_APPTS = [
  { id: 1, patient: 'Sarah Johnson',  doctor: 'Dr. Emily Chen',   dept: 'Cardiology',   time: '09:00 AM', status: 'Confirmed',  avatar: 'SJ' },
  { id: 2, patient: 'Mark Thompson',  doctor: 'Dr. Raj Patel',    dept: 'Orthopedics',  time: '10:30 AM', status: 'Confirmed',  avatar: 'MT' },
  { id: 3, patient: 'Priya Nair',     doctor: 'Dr. Lisa Wong',    dept: 'Neurology',    time: '11:00 AM', status: 'Pending',    avatar: 'PN' },
  { id: 4, patient: 'Alex Rodriguez', doctor: 'Dr. James Miller',  dept: 'General',      time: '02:00 PM', status: 'Confirmed',  avatar: 'AR' },
  { id: 5, patient: 'Nina Shah',      doctor: 'Dr. Emily Chen',   dept: 'Pediatrics',   time: '03:30 PM', status: 'Pending',    avatar: 'NS' },
];

const Dashboard = () => {
  const navigate = useNavigate();

  const QUICK_ACTIONS = [
    { label: 'Register Patient',  Icon: RiUserAddLine,    onClick: () => navigate(ROUTES.PATIENTS),      color: 'text-blue-600 bg-blue-50 border-blue-100 hover:bg-blue-100/70' },
    { label: 'Book Appointment',  Icon: RiCalendarLine,   onClick: () => navigate(ROUTES.APPOINTMENTS),  color: 'text-emerald-600 bg-emerald-50 border-emerald-100 hover:bg-emerald-100/70' },
    { label: 'AI Notification',   Icon: RiMessageLine,    onClick: () => navigate(ROUTES.AI_NOTIFICATIONS), color: 'text-indigo-600 bg-indigo-50 border-indigo-100 hover:bg-indigo-100/70' },
    { label: 'Export Report',     Icon: RiDownloadLine,   onClick: () => {},                             color: 'text-slate-600 bg-slate-50 border-slate-200 hover:bg-slate-100' },
    { label: 'View Analytics',    Icon: RiPulseLine,      onClick: () => navigate(ROUTES.ANALYTICS),     color: 'text-amber-600 bg-amber-50 border-amber-100 hover:bg-amber-100/70' },
    { label: 'System Settings',   Icon: RiFileListLine,   onClick: () => navigate(ROUTES.SETTINGS),      color: 'text-teal-600 bg-teal-50 border-teal-100 hover:bg-teal-100/70' },
  ];

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
        <p className="text-slate-500 text-sm mt-0.5">
          Welcome back — system-wide clinical metrics overview and active workflows.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {STAT_CARDS.map(({ id, label, value, change, up, sub, Icon, iconBg, iconColor }) => (
          <div key={id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">{label}</p>
              <p className="text-2xl font-bold text-slate-800">{value}</p>
              <div className="flex items-center gap-1.5 pt-0.5">
                <span className={`text-xs font-bold ${up ? 'text-green-600' : 'text-amber-600'}`}>
                  {change}
                </span>
                <span className="text-[10.5px] text-slate-400 font-medium">{sub}</span>
              </div>
            </div>
            <div className={`w-12 h-12 rounded-lg ${iconBg} flex items-center justify-center`}>
              <Icon className={`text-2xl ${iconColor}`} />
            </div>
          </div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Patient Trend Line Chart */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-slate-800 font-semibold text-sm">Weekly Admissions Trend</h3>
              <p className="text-slate-400 text-xs mt-0.5">Registered and discharged patient records</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={PATIENT_TREND} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorAdmitted" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563EB" stopOpacity={0.15}/>
                  <stop offset="95%" stopColor="#2563EB" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorDischarged" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#059669" stopOpacity={0.15}/>
                  <stop offset="95%" stopColor="#059669" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '12px' }} />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
              <Area type="monotone" dataKey="admitted" name="Admissions" stroke="#2563EB" strokeWidth={2} fillOpacity={1} fill="url(#colorAdmitted)" />
              <Area type="monotone" dataKey="discharged" name="Discharges" stroke="#059669" strokeWidth={2} fillOpacity={1} fill="url(#colorDischarged)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Department Share Pie Chart */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-slate-800 font-semibold text-sm">Distribution by Dept</h3>
            <p className="text-slate-400 text-xs mt-0.5">Active patients share</p>
          </div>
          <div className="flex justify-center relative">
            <ResponsiveContainer width="100%" height={150}>
              <PieChart>
                <Pie
                  data={DEPT_DATA}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={60}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {DEPT_DATA.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '6px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs pt-1">
            {DEPT_DATA.map((d) => (
              <div key={d.name} className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }} />
                <span className="text-slate-600 truncate">{d.name} ({d.value}%)</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Weekly Activity Bar Chart */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
        <div className="border-b border-slate-100 pb-3">
          <h3 className="text-slate-800 font-semibold text-sm">Weekly Analytics</h3>
          <p className="text-slate-400 text-xs mt-0.5">Consultations conducted daily</p>
        </div>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={APPT_BY_DAY} margin={{ top: 5, right: 10, left: -20, bottom: 0 }} barSize={32}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
            <XAxis dataKey="day" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ fontSize: '12px', borderRadius: '6px' }} cursor={{ fill: '#f8fafc' }} />
            <Bar dataKey="count" name="Appointments" fill="#2563EB" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Bottom Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Recent Activities */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-slate-800 font-semibold text-sm">Recent Activity</h3>
            <p className="text-slate-400 text-xs mt-0.5">Latest clinical and system logs</p>
          </div>
          <div className="space-y-4">
            {RECENT_ACTIVITY.map(({ id, text, time, Icon, color, bg }) => (
              <div key={id} className="flex gap-3 items-start">
                <div className={`p-2 rounded-lg ${bg} ${color} flex-shrink-0 mt-0.5`}>
                  <Icon className="text-sm" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-slate-700 leading-snug font-medium">{text}</p>
                  <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                    <RiTimeLine /> {time}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming appointments */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-slate-800 font-semibold text-sm">Upcoming Appointments</h3>
            <p className="text-slate-400 text-xs mt-0.5">Awaiting check-in</p>
          </div>
          <div className="space-y-3.5">
            {UPCOMING_APPTS.map(({ id, patient, doctor, dept, time, status, avatar }) => (
              <div key={id} className="flex items-center gap-3 p-1 rounded-lg">
                <div className="w-8 h-8 rounded-md bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-xs flex-shrink-0">
                  {avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-800 truncate">{patient}</p>
                  <p className="text-[10px] text-slate-400 truncate">{doctor} · {dept}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-slate-700">{time}</p>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full
                    ${status === 'Confirmed' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                    {status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions Panel */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-slate-800 font-semibold text-sm">Quick Actions</h3>
            <p className="text-slate-400 text-xs mt-0.5">Common administrative routes</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {QUICK_ACTIONS.map(({ label, Icon, onClick, color }) => (
              <button
                key={label}
                onClick={onClick}
                className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border text-center transition-all ${color}`}
              >
                <Icon className="text-lg" />
                <span className="text-[11px] font-semibold leading-tight">{label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
