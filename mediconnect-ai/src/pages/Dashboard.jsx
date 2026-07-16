import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllPatients } from '../services/patientService';
import { getAllAppointments } from '../services/appointmentService';
import { getAllNotifications } from '../services/notificationService';
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



const Dashboard = () => {
  const navigate = useNavigate();

  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [notifications, setNotifications] = useState([]);

  // Time formatter helper
  const formatTime = (isoString) => {
    try {
      const date = new Date(isoString);
      let hours = date.getHours();
      const minutes = date.getMinutes();
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12; 
      const minutesStr = minutes < 10 ? '0' + minutes : minutes;
      return `${hours}:${minutesStr} ${ampm}`;
    } catch (e) {
      return '10:00 AM';
    }
  };

  const loadData = async () => {
    try {
      const [pts, appts, notifs] = await Promise.all([
        getAllPatients(),
        getAllAppointments(),
        getAllNotifications()
      ]);
      setPatients(pts || []);
      setAppointments(appts || []);
      setNotifications(notifs.notifications || notifs || []);
    } catch (e) {
      console.error("Failed to load dashboard data", e);
    }
  };

  useEffect(() => {
    loadData();

    // Set up WebSocket to automatically sync new voice registrations/bookings in real-time
    const ws = new WebSocket('ws://localhost:8000/ws/appointments');
    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.event === 'refresh_appointments') {
          console.info("WS update received: reloading Dashboard statistics!");
          loadData();
        }
      } catch (err) {
        console.error("WebSocket message parsing error:", err);
      }
    };
    return () => ws.close();
  }, []);

  // ── Stats Calculations ───────────────────────────────────────
  const totalPatients = patients.length;
  const todayAppointments = appointments.filter(a => {
    try {
      const dateStr = a.appointment_time?.split('T')[0];
      const todayStr = new Date().toISOString().split('T')[0];
      return dateStr === todayStr;
    } catch (e) {
      return false;
    }
  }).length;

  const totalMessages = notifications.length;
  const pendingNotifications = notifications.filter(n => n.status?.toLowerCase() === 'pending').length;

  const kpis = [
    {
      id: 1, label: 'Total Patients', value: totalPatients.toString(),
      change: '+100%', up: true, sub: 'registered database patients',
      Icon: RiUserHeartLine,
      iconBg: 'bg-blue-50', iconColor: 'text-blue-600',
    },
    {
      id: 2, label: "Today's Appointments", value: todayAppointments.toString(),
      change: `+${todayAppointments}`, up: true, sub: 'scheduled today',
      Icon: RiCalendarCheckLine,
      iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600',
    },
    {
      id: 3, label: 'Messages Sent', value: totalMessages.toString(),
      change: '+100%', up: true, sub: 'sent notifications',
      Icon: RiMessageLine,
      iconBg: 'bg-indigo-50', iconColor: 'text-indigo-600',
    },
    {
      id: 4, label: 'Pending Notifications', value: pendingNotifications.toString(),
      change: '0', up: false, sub: 'awaiting dispatch',
      Icon: RiTimeLine,
      iconBg: 'bg-amber-50', iconColor: 'text-amber-600',
    },
  ];

  // ── Dynamic Chart Data ───────────────────────────────────────
  const deptData = useMemo(() => {
    const counts = appointments.reduce((acc, apt) => {
      const d = apt.doctor?.department || 'General';
      acc[d] = (acc[d] || 0) + 1;
      return acc;
    }, {});
    const colors = ['#2563EB', '#4F46E5', '#059669', '#D97706', '#DC2626'];
    const total = appointments.length || 1;
    return Object.keys(counts).map((name, i) => ({
      name,
      value: Math.round((counts[name] / total) * 100),
      color: colors[i % colors.length]
    }));
  }, [appointments]);

  const apptByDay = useMemo(() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const counts = { 'Sun': 0, 'Mon': 0, 'Tue': 0, 'Wed': 0, 'Thu': 0, 'Fri': 0, 'Sat': 0 };
    
    appointments.forEach(apt => {
      if (apt.appointment_time) {
        try {
          const dayName = days[new Date(apt.appointment_time).getDay()];
          counts[dayName] = (counts[dayName] || 0) + 1;
        } catch(e) {}
      }
    });

    return Object.keys(counts).map(day => ({
      day,
      count: counts[day]
    }));
  }, [appointments]);

  const patientTrend = useMemo(() => {
    return [
      { month: 'Jul', admitted: patients.length, discharged: Math.max(0, patients.length - 1) }
    ];
  }, [patients]);

  const upcomingAppts = useMemo(() => {
    return appointments.slice(0, 5).map(apt => ({
      id: apt.id,
      patient: apt.patient?.name || 'Local Caller',
      doctor: apt.doctor?.name || 'General Practitioner',
      dept: apt.doctor?.department || 'General',
      time: apt.appointment_time ? formatTime(apt.appointment_time) : '10:00 AM',
      status: apt.status || 'Scheduled',
      avatar: apt.patient?.name ? apt.patient.name.split(' ').map(n => n[0]).join('').toUpperCase() : 'LC'
    }));
  }, [appointments]);

  const recentActivities = useMemo(() => {
    return patients.slice(0, 5).map(p => ({
      id: p.id,
      text: `New patient ${p.name} registered`,
      time: 'Just now',
      Icon: RiUserAddLine,
      color: 'text-blue-600',
      bg: 'bg-blue-50'
    }));
  }, [patients]);

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
        {kpis.map(({ id, label, value, change, up, sub, Icon, iconBg, iconColor }) => (
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
            <AreaChart data={patientTrend} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
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
                  data={deptData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={60}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {deptData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '6px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs pt-1">
            {deptData.map((d) => (
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
          <BarChart data={apptByDay} margin={{ top: 5, right: 10, left: -20, bottom: 0 }} barSize={32}>
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
            {recentActivities.map(({ id, text, time, Icon, color, bg }) => (
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
            {upcomingAppts.map(({ id, patient, doctor, dept, time, status, avatar }) => (
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
