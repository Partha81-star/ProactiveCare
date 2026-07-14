import { useState } from 'react';
import {
  RiBarChart2Line, RiDownloadLine, RiArrowUpLine, RiArrowDownLine,
  RiMessage2Line, RiCalendarCheckLine, RiUserHeartLine, RiStethoscopeLine,
} from 'react-icons/ri';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, RadialBarChart, RadialBar,
} from 'recharts';

const MONTHLY_PATIENTS = [
  { month: 'Jan', registered: 320, discharged: 290, readmitted: 45 },
  { month: 'Feb', registered: 380, discharged: 340, readmitted: 52 },
  { month: 'Mar', registered: 410, discharged: 375, readmitted: 48 },
  { month: 'Apr', registered: 390, discharged: 360, readmitted: 61 },
  { month: 'May', registered: 450, discharged: 420, readmitted: 55 },
  { month: 'Jun', registered: 490, discharged: 460, readmitted: 70 },
  { month: 'Jul', registered: 530, discharged: 495, readmitted: 63 },
];

const DEPT_APPOINTMENTS = [
  { dept: 'Cardiology',   appointments: 148, completed: 132, cancelled: 16 },
  { dept: 'Orthopedics',  appointments: 124, completed: 110, cancelled: 14 },
  { dept: 'Neurology',    appointments: 96,  completed: 85,  cancelled: 11 },
  { dept: 'General',      appointments: 210, completed: 195, cancelled: 15 },
  { dept: 'Pediatrics',   appointments: 88,  completed: 80,  cancelled: 8  },
  { dept: 'Pulmonology',  appointments: 72,  completed: 65,  cancelled: 7  },
  { dept: 'Dermatology',  appointments: 60,  completed: 55,  cancelled: 5  },
];

const NOTIF_CHANNEL_PIE = [
  { name: 'SMS',        value: 42, color: '#2563EB' },
  { name: 'Email',      value: 28, color: '#4F46E5' },
  { name: 'WhatsApp',   value: 22, color: '#059669' },
  { name: 'Phone Call', value: 8,  color: '#D97706' },
];

const WEEKLY_MESSAGES = [
  { week: 'W1', sent: 210, delivered: 190, failed: 20 },
  { week: 'W2', sent: 265, delivered: 240, failed: 25 },
  { week: 'W3', sent: 310, delivered: 285, failed: 25 },
  { week: 'W4', sent: 290, delivered: 268, failed: 22 },
  { week: 'W5', sent: 348, delivered: 318, failed: 30 },
  { week: 'W6', sent: 375, delivered: 350, failed: 25 },
  { week: 'W7', sent: 420, delivered: 395, failed: 25 },
];

const DOCTOR_AVAILABILITY = [
  { name: 'On Duty',  value: 24, fill: '#059669' },
  { name: 'Off Duty', value: 4,  fill: '#64748b'  },
  { name: 'On Leave', value: 2,  fill: '#D97706'  },
];

const KPI_CARDS = [
  {
    label: 'Messages Sent',       value: '1,293', change: '+8.2%',  up: true,
    sub: 'This month',            Icon: RiMessage2Line,
    iconBg: 'bg-indigo-50',       iconColor: 'text-indigo-600',
  },
  {
    label: 'Appointments',        value: '248',   change: '+12.5%', up: true,
    sub: 'This month',            Icon: RiCalendarCheckLine,
    iconBg: 'bg-blue-50',         iconColor: 'text-blue-600',
  },
  {
    label: 'Patients Registered',  value: '4,827', change: '+5.1%',  up: true,
    sub: 'All time',              Icon: RiUserHeartLine,
    iconBg: 'bg-emerald-50',      iconColor: 'text-emerald-600',
  },
  {
    label: 'Doctors Available',    value: '24/30', change: '-2',     up: false,
    sub: 'Currently on duty',      Icon: RiStethoscopeLine,
    iconBg: 'bg-amber-50',        iconColor: 'text-amber-600',
  },
];

const RANGES = ['7 Days', '30 Days', '3 Months', '1 Year'];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-lg px-3 py-2 shadow-md text-xs min-w-[130px]">
      <p className="text-slate-500 font-semibold mb-1.5">{label}</p>
      {payload.map(p => (
        <div key={p.name} className="flex items-center justify-between gap-4">
          <span style={{ color: p.color }} className="font-semibold">{p.name}</span>
          <span className="text-slate-800 font-bold">{p.value}</span>
        </div>
      ))}
    </div>
  );
};

const PieTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-lg px-3 py-2 shadow-md text-xs">
      <p style={{ color: payload[0].payload.color }} className="font-bold">{payload[0].name}</p>
      <p className="text-slate-800 font-semibold">{payload[0].value}%</p>
    </div>
  );
};

const ChartHeader = ({ title, subtitle, legend }) => (
  <div className="flex items-start justify-between mb-4 flex-wrap gap-2">
    <div>
      <h3 className="text-slate-800 font-semibold text-sm">{title}</h3>
      {subtitle && <p className="text-slate-400 text-xs mt-0.5">{subtitle}</p>}
    </div>
    {legend && (
      <div className="flex items-center gap-3 flex-wrap">
        {legend.map(({ color, label }) => (
          <span key={label} className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: color }} />
            {label}
          </span>
        ))}
      </div>
    )}
  </div>
);

const Analytics = () => {
  const [range, setRange] = useState('30 Days');

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <RiBarChart2Line className="text-blue-600" /> Analytics Dashboard
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">Statistical insights, clinical metrics, and communication delivery reports</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex bg-white border border-slate-200 rounded-lg p-0.5 gap-0.5 shadow-xs">
            {RANGES.map(r => (
              <button key={r} onClick={() => setRange(r)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all
                  ${range === r ? 'bg-blue-650 text-white shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}>
                {r}
              </button>
            ))}
          </div>
          <button className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs font-semibold shadow-xs transition-all">
            <RiDownloadLine /> Export Analytics
          </button>
        </div>
      </div>

      {/* KPI stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {KPI_CARDS.map(({ label, value, change, up, sub, Icon, iconBg, iconColor }) => (
          <div key={label} className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">{label}</p>
              <p className="text-2xl font-bold text-slate-800 leading-none">{value}</p>
              <div className="flex items-center gap-1.5 pt-1">
                <span className={`text-xs font-bold ${up ? 'text-green-600' : 'text-amber-600'}`}>
                  {change}
                </span>
                <span className="text-[10.5px] text-slate-400 font-medium">{sub}</span>
              </div>
            </div>
            <div className={`w-11 h-11 rounded-lg ${iconBg} flex items-center justify-center`}>
              <Icon className={`text-2xl ${iconColor}`} />
            </div>
          </div>
        ))}
      </div>

      {/* Graphs Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Line graph */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <ChartHeader
            title="Patient Registration Trend"
            subtitle="Monthly registered, discharged & readmitted"
            legend={[{ color: '#2563EB', label: 'Registered' }, { color: '#059669', label: 'Discharged' }, { color: '#D97706', label: 'Readmitted' }]}
          />
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={MONTHLY_PATIENTS} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="registered" name="Registered" stroke="#2563EB" strokeWidth={2.5} dot={{ fill: '#2563EB', r: 4 }} activeDot={{ r: 6 }} />
              <Line type="monotone" dataKey="discharged" name="Discharged" stroke="#059669" strokeWidth={2.5} dot={{ fill: '#059669', r: 4 }} activeDot={{ r: 6 }} />
              <Line type="monotone" dataKey="readmitted" name="Readmitted" stroke="#D97706" strokeWidth={2} strokeDasharray="5 3" dot={{ fill: '#D97706', r: 3 }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Graph */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <ChartHeader title="Notification Channels" subtitle="Distribution by channel" />
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={NOTIF_CHANNEL_PIE} cx="50%" cy="50%"
                innerRadius={45} outerRadius={65} dataKey="value" paddingAngle={3}>
                {NOTIF_CHANNEL_PIE.map((entry, i) => (
                  <Cell key={i} fill={entry.color} stroke="transparent" />
                ))}
              </Pie>
              <Tooltip content={<PieTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-2">
            {NOTIF_CHANNEL_PIE.map(({ name, value, color }) => (
              <div key={name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-sm flex-shrink-0" style={{ background: color }} />
                  <span className="text-slate-500 font-medium">{name}</span>
                </div>
                <span className="text-slate-800 font-bold">{value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bar Chart */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <ChartHeader
          title="Appointments by Department"
          subtitle="Total, completed & cancelled breakdown"
          legend={[{ color: '#2563EB', label: 'Total' }, { color: '#059669', label: 'Completed' }, { color: '#DC2626', label: 'Cancelled' }]}
        />
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={DEPT_APPOINTMENTS} margin={{ top: 5, right: 10, left: -20, bottom: 0 }} barSize={16} barGap={4}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
            <XAxis dataKey="dept" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
            <Bar dataKey="appointments" name="Total"     fill="#2563EB" radius={[3, 3, 0, 0]} />
            <Bar dataKey="completed"    name="Completed" fill="#059669" radius={[3, 3, 0, 0]} />
            <Bar dataKey="cancelled"    name="Cancelled" fill="#DC2626" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Area + Radial Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <ChartHeader
            title="Messages Sent Weekly"
            subtitle="Sent, delivered & failed over 7 weeks"
            legend={[{ color: '#2563EB', label: 'Sent' }, { color: '#059669', label: 'Delivered' }, { color: '#DC2626', label: 'Failed' }]}
          />
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={WEEKLY_MESSAGES} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <defs>
                {[['aGradSent', '#2563EB'], ['aGradDel', '#059669'], ['aGradFail', '#DC2626']].map(([id, color]) => (
                  <linearGradient key={id} id={id} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={color} stopOpacity={0.15} />
                    <stop offset="95%" stopColor={color} stopOpacity={0} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis dataKey="week" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="sent"      name="Sent"      stroke="#2563EB" strokeWidth={2} fill="url(#aGradSent)" />
              <Area type="monotone" dataKey="delivered" name="Delivered" stroke="#059669" strokeWidth={2} fill="url(#aGradDel)" />
              <Area type="monotone" dataKey="failed"    name="Failed"    stroke="#DC2626" strokeWidth={2} fill="url(#aGradFail)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <ChartHeader title="Doctor Availability" subtitle="Current duty status (30 total)" />
            <div className="flex justify-center py-2">
              <ResponsiveContainer width="100%" height={140}>
                <RadialBarChart cx="50%" cy="50%" innerRadius={25} outerRadius={60}
                  data={DOCTOR_AVAILABILITY} startAngle={90} endAngle={-270}>
                  <RadialBar dataKey="value" cornerRadius={4} background={{ fill: '#f1f5f9' }} />
                  <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '6px' }} />
                </RadialBarChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2 text-xs pt-1">
              {DOCTOR_AVAILABILITY.map(({ name, value, fill }) => (
                <div key={name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: fill }} />
                    <span className="text-slate-500 font-medium">{name}</span>
                  </div>
                  <span className="text-slate-800 font-bold">{value} <span className="text-slate-400 font-normal">/ 30</span></span>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex justify-between text-xs">
            <span className="text-slate-500 font-semibold">Duty Utilization</span>
            <span className="text-green-600 font-bold">{Math.round((24/30)*100)}%</span>
          </div>
        </div>
      </div>

      {/* Summary chips */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
        {[
          { label: 'Avg. Daily Patients', value: '68',    unit: 'patients/day',  color: 'text-blue-600',  icon: '🏥' },
          { label: 'Bed Occupancy Rate',  value: '78%',   unit: 'of 500 beds',   color: 'text-amber-600', icon: '🛏️' },
          { label: 'Avg. Consultation',   value: '18 min',unit: 'per patient',   color: 'text-indigo-600',icon: '⏱️' },
          { label: 'Patient Satisfaction',value: '4.7★',  unit: 'out of 5.0',    color: 'text-green-600', icon: '⭐' },
        ].map(({ label, value, unit, color, icon }) => (
          <div key={label} className="bg-white border border-slate-200 rounded-xl p-4 text-center shadow-xs">
            <span className="text-xl">{icon}</span>
            <p className={`text-xl font-bold mt-1.5 ${color}`}>{value}</p>
            <p className="text-slate-700 text-xs font-bold mt-1 uppercase tracking-wider">{label}</p>
            <p className="text-slate-405 text-[10px] mt-0.5">{unit}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Analytics;
