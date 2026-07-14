import { useState, useMemo } from 'react';
import {
  RiBellLine, RiSearchLine, RiFilterLine, RiArrowDownSLine,
  RiMailLine, RiPhoneLine, RiMessage2Line, RiWhatsappLine,
  RiSendPlaneLine, RiEyeLine, RiRefreshLine, RiDownloadLine,
  RiCheckboxCircleLine, RiTimeLine, RiCloseCircleLine,
  RiCalendarLine, RiUserHeartLine, RiAlertLine,
  RiHeartPulseLine, RiSyringeLine, RiTestTubeLine, RiFileListLine,
  RiErrorWarningLine,
} from 'react-icons/ri';

const NOTIF_TYPES = [
  { label: 'Appointment Reminder', Icon: RiCalendarLine,   color: 'bg-blue-50 text-blue-700 border-blue-100' },
  { label: 'Lab Results Ready',    Icon: RiTestTubeLine,   color: 'bg-indigo-50 text-indigo-700 border-indigo-100' },
  { label: 'Prescription Alert',   Icon: RiSyringeLine,    color: 'bg-green-50 text-green-700 border-green-100' },
  { label: 'Emergency Alert',      Icon: RiAlertLine,      color: 'bg-red-50 text-red-700 border-red-100' },
  { label: 'Health Tip',           Icon: RiHeartPulseLine, color: 'bg-pink-50 text-pink-700 border-pink-100' },
  { label: 'Follow-up Reminder',   Icon: RiFileListLine,   color: 'bg-amber-50 text-amber-700 border-amber-100' },
  { label: 'Discharge Notice',     Icon: RiUserHeartLine,  color: 'bg-teal-50 text-teal-700 border-teal-100' },
];

const CHANNELS = [
  { label: 'SMS',        Icon: RiMessage2Line,  color: 'text-emerald-600' },
  { label: 'Email',      Icon: RiMailLine,      color: 'text-blue-600' },
  { label: 'WhatsApp',   Icon: RiWhatsappLine,  color: 'text-green-600' },
  { label: 'Phone Call', Icon: RiPhoneLine,     color: 'text-amber-600' },
];

const STATUS_STYLE = {
  Delivered: { cls: 'bg-green-50 text-green-700 border-green-200', dot: 'bg-green-500', Icon: RiCheckboxCircleLine },
  Pending:   { cls: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500', Icon: RiTimeLine },
  Failed:    { cls: 'bg-red-50 text-red-700 border-red-200',     dot: 'bg-red-500',   Icon: RiCloseCircleLine },
};

const initials = (name) => name.split(' ').map(w => w[0]).join('').slice(0, 2);

const gen = (id, patient, type, channel, date, status) => ({ id: `NID-${id}`, patient, type, channel, date, status });

const MOCK_NOTIFICATIONS = [
  gen(3001, 'Sarah Johnson',    'Appointment Reminder', 'SMS',        '2025-07-13 09:00', 'Delivered'),
  gen(3002, 'Mark Thompson',    'Lab Results Ready',    'Email',      '2025-07-13 09:15', 'Delivered'),
  gen(3003, 'Priya Nair',       'Prescription Alert',   'WhatsApp',   '2025-07-13 10:00', 'Pending'),
  gen(3004, 'Alex Rodriguez',   'Emergency Alert',      'Phone Call', '2025-07-13 10:30', 'Delivered'),
  gen(3005, 'Nina Shah',        'Appointment Reminder', 'SMS',        '2025-07-13 11:00', 'Failed'),
  gen(3006, 'Robert Kim',       'Health Tip',           'Email',      '2025-07-13 11:30', 'Delivered'),
  gen(3007, 'Fatima Al-Hassan', 'Follow-up Reminder',   'WhatsApp',   '2025-07-13 12:00', 'Delivered'),
  gen(3008, 'Vikram Singh',     'Discharge Notice',     'SMS',        '2025-07-13 13:00', 'Failed'),
  gen(3009, 'Lucy Chen',        'Lab Results Ready',    'Email',      '2025-07-13 13:30', 'Delivered'),
  gen(3010, 'John Doe',         'Appointment Reminder', 'SMS',        '2025-07-13 14:00', 'Pending'),
  gen(3011, 'Sarah Johnson',    'Prescription Alert',   'WhatsApp',   '2025-07-13 14:30', 'Delivered'),
  gen(3012, 'Mark Thompson',    'Health Tip',           'Email',      '2025-07-13 15:00', 'Delivered'),
  gen(3013, 'Priya Nair',       'Emergency Alert',      'Phone Call', '2025-07-13 15:30', 'Failed'),
  gen(3014, 'Robert Kim',       'Appointment Reminder', 'SMS',        '2025-07-13 16:00', 'Pending'),
  gen(3015, 'Vikram Singh',     'Follow-up Reminder',   'Email',      '2025-07-13 16:30', 'Delivered'),
  gen(3016, 'Lucy Chen',        'Discharge Notice',     'WhatsApp',   '2025-07-14 09:00', 'Delivered'),
  gen(3017, 'Alex Rodriguez',   'Lab Results Ready',    'SMS',        '2025-07-14 09:30', 'Pending'),
  gen(3018, 'Nina Shah',        'Health Tip',           'Email',      '2025-07-14 10:00', 'Delivered'),
  gen(3019, 'John Doe',         'Prescription Alert',   'WhatsApp',   '2025-07-14 10:30', 'Delivered'),
  gen(3020, 'Fatima Al-Hassan', 'Emergency Alert',      'Phone Call', '2025-07-14 11:00', 'Failed'),
];

const StatCard = ({ label, value, sublabel, color, Icon }) => (
  <div className="bg-white border border-slate-200 rounded-lg p-4 flex items-center gap-4 shadow-xs">
    <div className={`p-2.5 rounded-lg ${color} text-white flex-shrink-0`}>
      <Icon className="text-xl" />
    </div>
    <div>
      <p className="text-2xl font-bold text-slate-800 leading-none">{value}</p>
      <p className="text-slate-500 text-xs mt-1.5 font-semibold uppercase tracking-wider">{label}</p>
      <p className="text-[10px] text-slate-400 mt-0.5 font-medium">{sublabel}</p>
    </div>
  </div>
);

const FilterSelect = ({ icon: Icon, value, onChange, children }) => (
  <div className="relative">
    <Icon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none z-10" />
    <RiArrowDownSLine className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
    <select value={value} onChange={e => onChange(e.target.value)}
      className="bg-white border border-slate-200 rounded-lg pl-9 pr-8 py-2 text-xs text-slate-700 appearance-none cursor-pointer focus:outline-none focus:border-blue-500 transition-all shadow-xs">
      {children}
    </select>
  </div>
);

const NotificationHistory = () => {
  const [data] = useState(MOCK_NOTIFICATIONS);
  const [search, setSearch] = useState('');
  const [typeF, setTypeF] = useState('All');
  const [channelF, setChannelF] = useState('All');
  const [statusF, setStatusF] = useState('All');
  const [dateF, setDateF] = useState('');
  const [page, setPage] = useState(1);
  const [resent, setResent] = useState(null);
  const PER_PAGE = 10;

  const delivered = data.filter(n => n.status === 'Delivered').length;
  const pending = data.filter(n => n.status === 'Pending').length;
  const failed = data.filter(n => n.status === 'Failed').length;
  const rate = Math.round((delivered / data.length) * 100);

  const filtered = useMemo(() => data.filter(n =>
    (!search || n.patient.toLowerCase().includes(search.toLowerCase()) || n.type.toLowerCase().includes(search.toLowerCase())) &&
    (typeF === 'All' || n.type === typeF) &&
    (channelF === 'All' || n.channel === channelF) &&
    (statusF === 'All' || n.status === statusF) &&
    (!dateF || n.date.startsWith(dateF))
  ), [data, search, typeF, channelF, statusF, dateF]);

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const resetFilters = () => { setSearch(''); setTypeF('All'); setChannelF('All'); setStatusF('All'); setDateF(''); setPage(1); };

  const handleResend = (id) => { setResent(id); setTimeout(() => setResent(null), 2500); };

  const getTypeConfig = (type) => NOTIF_TYPES.find(t => t.label === type) || NOTIF_TYPES[0];
  const getChannelConf = (channel) => CHANNELS.find(c => c.label === channel) || CHANNELS[0];

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <RiBellLine className="text-blue-600" /> Notification History
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">Track automated SMS, email, and WhatsApp communications</p>
        </div>
        <button className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs font-semibold shadow-xs transition-all">
          <RiDownloadLine /> Export Logs CSV
        </button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        <StatCard label="Total Dispatched" value={data.length} sublabel="All messages logged" color="bg-blue-600" Icon={RiBellLine} />
        <StatCard label="Delivered"        value={delivered}   sublabel={`${rate}% success rate`} color="bg-green-600" Icon={RiCheckboxCircleLine} />
        <StatCard label="Pending"          value={pending}     sublabel="Queued in broker"        color="bg-amber-500" Icon={RiTimeLine} />
        <StatCard label="Failed"           value={failed}      sublabel="Network errors"          color="bg-red-500" Icon={RiCloseCircleLine} />
      </div>

      {/* Rate indicator */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">Delivery success stats</p>
          <span className="text-sm font-bold text-green-600">{rate}%</span>
        </div>
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full rounded-full bg-green-500 transition-all duration-300" style={{ width: `${rate}%` }} />
        </div>
        <div className="flex flex-wrap gap-4 text-[10.5px] text-slate-500 pt-1">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500" />Delivered ({delivered})</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500" />Pending ({pending})</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" />Failed ({failed})</span>
        </div>
      </div>

      {/* Filters Form */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex flex-wrap gap-3 items-end">
          
          <div className="relative flex-1 min-w-[200px]">
            <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none" />
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search by patient name or alert type..."
              className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-700 focus:outline-none focus:border-blue-500 focus:bg-white transition-all shadow-xs"
            />
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold pl-1">Type</span>
            <FilterSelect icon={RiFilterLine} value={typeF} onChange={v => { setTypeF(v); setPage(1); }}>
              <option>All</option>
              {NOTIF_TYPES.map(t => <option key={t.label}>{t.label}</option>)}
            </FilterSelect>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold pl-1">Channel</span>
            <FilterSelect icon={RiSendPlaneLine} value={channelF} onChange={v => { setChannelF(v); setPage(1); }}>
              <option>All</option>
              {CHANNELS.map(c => <option key={c.label}>{c.label}</option>)}
            </FilterSelect>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold pl-1">Status</span>
            <FilterSelect icon={RiCheckboxCircleLine} value={statusF} onChange={v => { setStatusF(v); setPage(1); }}>
              {['All', 'Delivered', 'Pending', 'Failed'].map(s => <option key={s}>{s}</option>)}
            </FilterSelect>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold pl-1">Date</span>
            <div className="relative">
              <RiCalendarLine className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none" />
              <input
                type="date"
                value={dateF}
                onChange={e => { setDateF(e.target.value); setPage(1); }}
                className="bg-white border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-blue-500 transition-all cursor-pointer shadow-xs"
              />
            </div>
          </div>

          <button onClick={resetFilters}
            className="flex items-center gap-1 px-3 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold shadow-xs">
            <RiRefreshLine /> Reset
          </button>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-150 bg-slate-50/50">
          <p className="text-slate-800 font-semibold text-sm">
            Registry Logs
            <span className="ml-1.5 text-xs text-slate-450 font-normal">({filtered.length} total)</span>
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left min-w-[800px]">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 uppercase tracking-wider">
                <th className="px-6 py-3 font-semibold">Log ID</th>
                <th className="px-6 py-3 font-semibold">Patient</th>
                <th className="px-6 py-3 font-semibold">Alert Type</th>
                <th className="px-6 py-3 font-semibold">Channel</th>
                <th className="px-6 py-3 font-semibold">Timestamp</th>
                <th className="px-6 py-3 font-semibold">Status</th>
                <th className="px-6 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-16 text-slate-400">
                    No matching logs found in system database.
                  </td>
                </tr>
              ) : (
                paginated.map((n, i) => {
                  const typeConf = getTypeConfig(n.type);
                  const channelConf = getChannelConf(n.channel);
                  const statusConf = STATUS_STYLE[n.status];
                  const globalIdx = (page - 1) * PER_PAGE + i;

                  return (
                    <tr key={n.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-3.5 font-mono text-slate-550 font-semibold">{n.id}</td>
                      <td className="px-6 py-3.5 font-bold text-slate-800">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-md bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-[10px]">
                            {initials(n.patient)}
                          </div>
                          <span>{n.patient}</span>
                        </div>
                      </td>
                      <td className="px-6 py-3.5">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded border text-[10px] font-bold ${typeConf.color}`}>
                          <typeConf.Icon className="text-xs flex-shrink-0" />
                          {n.type}
                        </span>
                      </td>
                      <td className="px-6 py-3.5">
                        <div className={`flex items-center gap-1.5 font-semibold ${channelConf.color}`}>
                          <channelConf.Icon className="text-sm flex-shrink-0" />
                          <span className="text-slate-650 text-xs font-semibold">{n.channel}</span>
                        </div>
                      </td>
                      <td className="px-6 py-3.5">
                        <p className="font-semibold text-slate-800">{n.date.split(' ')[0]}</p>
                        <p className="text-slate-400 text-[10px] mt-0.5">{n.date.split(' ')[1]}</p>
                      </td>
                      <td className="px-6 py-3.5">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[10px] font-bold ${statusConf.cls}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${statusConf.dot}`} />
                          {n.status}
                        </span>
                      </td>
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-1">
                          <button className="p-1 rounded-md text-slate-400 hover:text-blue-600 hover:bg-slate-100 transition-colors" title="View payload">
                            <RiEyeLine className="text-sm" />
                          </button>
                          {n.status === 'Failed' && (
                            <button onClick={() => handleResend(n.id)}
                              className={`p-1 rounded-md border transition-all text-sm
                                ${resent === n.id
                                  ? 'text-green-600 bg-green-50 border-green-200'
                                  : 'text-slate-400 hover:text-amber-600 hover:bg-slate-100 border-transparent'}`}
                              title="Resend payload"
                            >
                              {resent === n.id ? <RiCheckboxCircleLine /> : <RiSendPlaneLine />}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination footer */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-3.5 border-t border-slate-150 bg-slate-50/50">
            <p className="text-[11px] text-slate-500">
              Showing {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, filtered.length)} of {filtered.length} entries
            </p>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="px-3 py-1 rounded-lg border border-slate-200 text-slate-600 bg-white hover:bg-slate-50 disabled:opacity-40 text-xs font-semibold transition-all">
                Prev
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(pg => (
                <button key={pg} onClick={() => setPage(pg)}
                  className={`w-7 h-7 rounded-lg text-xs font-bold transition-all
                    ${pg === page ? 'bg-blue-600 text-white shadow-xs' : 'border border-slate-200 text-slate-600 bg-white hover:bg-slate-50'}`}>
                  {pg}
                </button>
              ))}
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="px-3 py-1 rounded-lg border border-slate-200 text-slate-600 bg-white hover:bg-slate-50 disabled:opacity-40 text-xs font-semibold transition-all">
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationHistory;
