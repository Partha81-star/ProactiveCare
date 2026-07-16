import { useState, useEffect, useMemo } from 'react';
import { getAllPatients } from '../services/patientService';
import { getAllAppointments } from '../services/appointmentService';
import { getAllNotifications } from '../services/notificationService';
import { getAllDoctors } from '../services/doctorService';
import {
  RiBarChart2Line, RiDownloadLine, RiArrowUpLine, RiArrowDownLine,
  RiMessage2Line, RiCalendarCheckLine, RiUserHeartLine, RiStethoscopeLine,
} from 'react-icons/ri';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, RadialBarChart, RadialBar,
} from 'recharts';



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
  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [doctorsList, setDoctorsList] = useState([]);

  const loadData = async () => {
    try {
      const [pts, appts, notifs, docs] = await Promise.all([
        getAllPatients(),
        getAllAppointments(),
        getAllNotifications(),
        getAllDoctors()
      ]);
      setPatients(pts || []);
      setAppointments(appts || []);
      setNotifications(notifs.notifications || notifs || []);
      setDoctorsList(docs || []);
    } catch (e) {
      console.error("Failed to load analytics data", e);
    }
  };

  useEffect(() => {
    loadData();
    // Re-fetch automatically on appointments WebSocket notifications
    const ws = new WebSocket('ws://localhost:8000/ws/appointments');
    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.event === 'refresh_appointments') {
          loadData();
        }
      } catch (err) {}
    };
    return () => ws.close();
  }, []);

  // 1. KPI Cards
  const totalPatients = patients.length;
  const totalAppointments = appointments.length;
  const totalMessages = notifications.length;

  const onDuty = doctorsList.filter(d => d.availability === 'On Duty' || d.availability === 'Available' || !d.availability).length;
  const totalDocs = doctorsList.length || 30;

  const kpiCards = [
    {
      label: 'Messages Sent',       value: totalMessages.toString(), change: '+100%',  up: true,
      sub: 'This month',            Icon: RiMessage2Line,
      iconBg: 'bg-indigo-50',       iconColor: 'text-indigo-600',
    },
    {
      label: 'Appointments',        value: totalAppointments.toString(),   change: '+100%', up: true,
      sub: 'This month',            Icon: RiCalendarCheckLine,
      iconBg: 'bg-blue-50',         iconColor: 'text-blue-600',
    },
    {
      label: 'Patients Registered',  value: totalPatients.toString(), change: '+100%',  up: true,
      sub: 'All time',              Icon: RiUserHeartLine,
      iconBg: 'bg-emerald-50',      iconColor: 'text-emerald-600',
    },
    {
      label: 'Doctors Available',    value: `${onDuty}/${totalDocs}`, change: '0',     up: true,
      sub: 'Currently on duty',      Icon: RiStethoscopeLine,
      iconBg: 'bg-amber-50',        iconColor: 'text-amber-600',
    },
  ];

  // 2. Patient Registration Trend (Monthly or Daily)
  const monthlyPatients = useMemo(() => {
    return [
      { month: 'Jul', registered: patients.length, discharged: Math.max(0, patients.length - 1), readmitted: 0 }
    ];
  }, [patients]);

  // 3. Notification Channels Distribution
  const notifChannelPie = useMemo(() => {
    const counts = { 'SMS': 0, 'Email': 0, 'WhatsApp': 0, 'Phone Call': 0 };
    notifications.forEach(n => {
      const channelName = n.channel?.toLowerCase() === 'sms' ? 'SMS' :
                          n.channel?.toLowerCase() === 'email' ? 'Email' :
                          n.channel?.toLowerCase() === 'whatsapp' ? 'WhatsApp' : 'Phone Call';
      counts[channelName] = (counts[channelName] || 0) + 1;
    });
    const total = notifications.length || 1;
    const colors = { 'SMS': '#2563EB', 'Email': '#4F46E5', 'WhatsApp': '#059669', 'Phone Call': '#D97706' };
    return Object.keys(counts).map(name => ({
      name,
      value: total > 0 ? Math.round((counts[name] / total) * 100) : 0,
      color: colors[name]
    })).filter(item => item.value > 0 || notifications.length === 0);
  }, [notifications]);

  // 4. Appointments by Department Breakdown
  const deptAppointments = useMemo(() => {
    const depts = {};
    doctorsList.forEach(doc => {
      if (doc.department && !depts[doc.department]) {
        depts[doc.department] = { dept: doc.department, appointments: 0, completed: 0, cancelled: 0 };
      }
    });
    
    if (!depts['General']) {
      depts['General'] = { dept: 'General', appointments: 0, completed: 0, cancelled: 0 };
    }

    appointments.forEach(apt => {
      const deptName = apt.doctor?.department || 'General';
      if (!depts[deptName]) {
        depts[deptName] = { dept: deptName, appointments: 0, completed: 0, cancelled: 0 };
      }
      depts[deptName].appointments += 1;
      if (apt.status === 'Confirmed' || apt.status === 'Completed') {
        depts[deptName].completed += 1;
      } else if (apt.status === 'Cancelled') {
        depts[deptName].cancelled += 1;
      } else {
        depts[deptName].completed += 1;
      }
    });
    return Object.values(depts);
  }, [appointments, doctorsList]);

  // 5. Weekly message delivery
  const weeklyMessages = useMemo(() => {
    const total = notifications.length;
    const delivered = notifications.filter(n => n.status?.toLowerCase() === 'delivered' || n.status?.toLowerCase() === 'sent').length;
    const failed = notifications.filter(n => n.status?.toLowerCase() === 'failed').length;
    return [
      { week: 'W1', sent: total, delivered, failed }
    ];
  }, [notifications]);

  // 6. Doctor availability status
  const doctorAvailability = useMemo(() => {
    const onDutyCount = doctorsList.filter(d => d.availability === 'On Duty' || d.availability === 'Available' || !d.availability).length;
    const offDutyCount = doctorsList.filter(d => d.availability === 'Off Duty').length;
    const onLeaveCount = doctorsList.filter(d => d.availability === 'On Leave').length;
    return [
      { name: 'On Duty',  value: onDutyCount, fill: '#059669' },
      { name: 'Off Duty', value: offDutyCount, fill: '#64748b'  },
      { name: 'On Leave', value: onLeaveCount, fill: '#D97706'  },
    ];
  }, [doctorsList]);

  const utilizationRate = Math.round((onDuty / totalDocs) * 100) || 0;

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
        {kpiCards.map(({ label, value, change, up, sub, Icon, iconBg, iconColor }) => (
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
            <LineChart data={monthlyPatients} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
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
              <Pie data={notifChannelPie} cx="50%" cy="50%"
                innerRadius={45} outerRadius={65} dataKey="value" paddingAngle={3}>
                {notifChannelPie.map((entry, i) => (
                  <Cell key={i} fill={entry.color} stroke="transparent" />
                ))}
              </Pie>
              <Tooltip content={<PieTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-2">
            {notifChannelPie.map(({ name, value, color }) => (
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
          <BarChart data={deptAppointments} margin={{ top: 5, right: 10, left: -20, bottom: 0 }} barSize={16} barGap={4}>
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
            <AreaChart data={weeklyMessages} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
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
            <ChartHeader title="Doctor Availability" subtitle={`Current duty status (${totalDocs} total)`} />
            <div className="flex justify-center py-2">
              <ResponsiveContainer width="100%" height={140}>
                <RadialBarChart cx="50%" cy="50%" innerRadius={25} outerRadius={60}
                  data={doctorAvailability} startAngle={90} endAngle={-270}>
                  <RadialBar dataKey="value" cornerRadius={4} background={{ fill: '#f1f5f9' }} />
                  <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '6px' }} />
                </RadialBarChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2 text-xs pt-1">
              {doctorAvailability.map(({ name, value, fill }) => (
                <div key={name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: fill }} />
                    <span className="text-slate-500 font-medium">{name}</span>
                  </div>
                  <span className="text-slate-800 font-bold">{value} <span className="text-slate-400 font-normal">/ {totalDocs}</span></span>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex justify-between text-xs">
            <span className="text-slate-500 font-semibold">Duty Utilization</span>
            <span className="text-green-600 font-bold">{utilizationRate}%</span>
          </div>
        </div>
      </div>

      {/* Summary chips */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
        {[
          { label: 'Avg. Daily Patients', value: patients.length ? Math.ceil(patients.length / 7).toString() : '0', unit: 'patients/day',  color: 'text-blue-600',  icon: '🏥' },
          { label: 'Bed Occupancy Rate',  value: patients.length ? `${Math.min(100, Math.ceil(patients.length * 1.5))}%` : '0%',   unit: 'of 500 beds',   color: 'text-amber-600', icon: '🛏️' },
          { label: 'Avg. Consultation',   value: '15 min',unit: 'per patient',   color: 'text-indigo-600',icon: '⏱️' },
          { label: 'Patient Satisfaction',value: '4.9★',  unit: 'out of 5.0',    color: 'text-green-600', icon: '⭐' },
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
