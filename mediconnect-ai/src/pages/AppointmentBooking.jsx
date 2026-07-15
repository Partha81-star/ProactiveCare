import { useState, useMemo } from 'react';
import {
  RiCalendarCheckLine, RiUserHeartLine, RiStethoscopeLine,
  RiHospitalLine, RiCalendarLine, RiTimeLine, RiFileTextLine,
  RiAlertLine, RiSaveLine, RiRefreshLine, RiSearchLine,
  RiArrowDownSLine, RiEyeLine, RiCloseCircleLine,
  RiCheckboxCircleLine, RiFilterLine, RiErrorWarningLine,
  RiPhoneFill, RiPhoneLine, RiVolumeUpLine, RiMicFill, RiVolumeMuteLine
} from 'react-icons/ri';

const PATIENTS = [
  'John Doe', 'Sarah Johnson', 'Mark Thompson', 'Priya Nair',
  'Alex Rodriguez', 'Nina Shah', 'Robert Kim', 'Fatima Al-Hassan',
  'Vikram Singh', 'Lucy Chen',
];

const DOCTORS_BY_DEPT = {
  Cardiology:    ['Dr. Emily Chen'],
  Orthopedics:   ['Dr. Raj Patel'],
  Neurology:     ['Dr. Lisa Wong'],
  General:       ['Dr. James Miller'],
  Pediatrics:    ['Dr. Sofia Alvarez'],
  Pulmonology:   ['Dr. Ahmed Hassan'],
  Dermatology:   ['Dr. Priya Sharma'],
  Psychiatry:    ['Dr. Kevin Obi'],
  Endocrinology: ['Dr. Sara Iyer'],
  Radiology:     ['Dr. Tom Bradley'],
};

const DEPARTMENTS = Object.keys(DOCTORS_BY_DEPT);
const TIME_SLOTS = ['09:00 AM','09:30 AM','10:00 AM','10:30 AM','11:00 AM','11:30 AM',
                     '12:00 PM','02:00 PM','02:30 PM','03:00 PM','03:30 PM','04:00 PM','04:30 PM'];

const PRIORITIES = [
  { value: 'Low',      color: 'text-slate-600 bg-slate-50 border-slate-200' },
  { value: 'Medium',   color: 'text-blue-700 bg-blue-50 border-blue-200' },
  { value: 'High',     color: 'text-amber-700 bg-amber-50 border-amber-200' },
  { value: 'Critical', color: 'text-red-700 bg-red-50 border-red-200' },
];

const STATUS_STYLE = {
  Confirmed:  'bg-green-50 text-green-700 border-green-200',
  Pending:    'bg-amber-50 text-amber-700 border-amber-200',
  Cancelled:  'bg-red-50 text-red-700 border-red-200',
  Completed:  'bg-slate-100 text-slate-600 border-slate-200',
};

const PRIORITY_BADGE = {
  Low:      'bg-slate-50 text-slate-500 border-slate-200',
  Medium:   'bg-blue-50 text-blue-700 border-blue-200',
  High:     'bg-amber-50 text-amber-700 border-amber-200',
  Critical: 'bg-red-50 text-red-700 border-red-200',
};

const MOCK_APPOINTMENTS = [
  { id: 'APT-1001', patient: 'Sarah Johnson',   doctor: 'Dr. Emily Chen',   dept: 'Cardiology',   date: '2025-07-14', time: '09:00 AM', reason: 'Chest pain follow-up',        priority: 'High',     status: 'Confirmed'  },
  { id: 'APT-1002', patient: 'Mark Thompson',   doctor: 'Dr. Raj Patel',    dept: 'Orthopedics',  date: '2025-07-14', time: '10:30 AM', reason: 'Knee replacement consultation', priority: 'Medium',   status: 'Confirmed'  },
  { id: 'APT-1003', patient: 'Priya Nair',      doctor: 'Dr. Lisa Wong',    dept: 'Neurology',    date: '2025-07-14', time: '11:00 AM', reason: 'Recurring migraines',          priority: 'Medium',   status: 'Pending'    },
  { id: 'APT-1004', patient: 'Alex Rodriguez',  doctor: 'Dr. James Miller', dept: 'General',      date: '2025-07-15', time: '02:00 PM', reason: 'Annual health checkup',        priority: 'Low',      status: 'Confirmed'  },
  { id: 'APT-1005', patient: 'Nina Shah',       doctor: 'Dr. Sofia Alvarez',dept: 'Pediatrics',   date: '2025-07-15', time: '03:30 PM', reason: 'Vaccination schedule',         priority: 'Low',      status: 'Pending'    },
  { id: 'APT-1006', patient: 'Robert Kim',      doctor: 'Dr. Ahmed Hassan', dept: 'Pulmonology',  date: '2025-07-15', time: '04:00 PM', reason: 'Breathing difficulty',         priority: 'High',     status: 'Confirmed'  },
  { id: 'APT-1007', patient: 'Fatima Al-Hassan',doctor: 'Dr. Emily Chen',   dept: 'Cardiology',   date: '2025-07-16', time: '09:30 AM', reason: 'ECG review',                   priority: 'Critical', status: 'Confirmed'  },
  { id: 'APT-1008', patient: 'Vikram Singh',    doctor: 'Dr. Priya Sharma', dept: 'Dermatology',  date: '2025-07-16', time: '11:30 AM', reason: 'Skin allergy evaluation',      priority: 'Low',      status: 'Cancelled'  },
];

const EMPTY = { patient: '', dept: '', doctor: '', date: '', time: '', reason: '', priority: 'Medium' };

const inputCls = `w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2 text-sm text-slate-800
  placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-all`;

const FieldLabel = ({ children, required }) => (
  <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
    {children}{required && <span className="text-red-500 ml-1">*</span>}
  </label>
);

const IconSelect = ({ icon: Icon, children, ...props }) => (
  <div className="relative">
    <Icon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none z-10" />
    <RiArrowDownSLine className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
    <select className={`${inputCls} pl-9 pr-8 appearance-none cursor-pointer`} {...props}>{children}</select>
  </div>
);

const IconInput = ({ icon: Icon, ...props }) => (
  <div className="relative">
    <Icon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none" />
    <input className={`${inputCls} pl-9`} {...props} />
  </div>
);

const StatChip = ({ label, value, color }) => (
  <div className="bg-white border border-slate-200 rounded-lg px-4 py-1.5 text-center min-w-[70px] shadow-xs">
    <p className={`text-lg font-bold leading-none ${color}`}>{value}</p>
    <p className="text-slate-400 text-[10.5px] mt-1 font-medium">{label}</p>
  </div>
);

const AppointmentBooking = () => {
  const [form, setForm] = useState(EMPTY);
  
  // Local Voice Agent Simulation States
  const [showVoiceCall, setShowVoiceCall] = useState(false);
  const [callState, setCallState] = useState('idle'); // idle, dialing, connected, speaking, listening, processing, ended
  const [callTranscript, setCallTranscript] = useState('');
  const [callHistory, setCallHistory] = useState([]);
  const [assistantReply, setAssistantReply] = useState('');
  const [recognition, setRecognition] = useState(null);

  // Initialize browser Speech Recognition (STT)
  const initSpeech = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser. Try Google Chrome.");
      return null;
    }
    const rec = new SpeechRecognition();
    rec.continuous = false;
    rec.interimResults = false;
    rec.lang = 'en-IN';

    rec.onstart = () => {
      setCallState('listening');
      setCallTranscript('Listening...');
    };

    rec.onresult = async (event) => {
      const text = event.results[0][0].transcript;
      setCallTranscript(text);
      setCallState('processing');

      // Add user speech to history
      const updatedHistory = [...callHistory, { role: 'user', content: text }];
      setCallHistory(updatedHistory);

      try {
        const response = await fetch('http://localhost:8001/api/v1/voice/local/simulate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: text,
            chat_history: updatedHistory
          })
        });
        const data = await response.json();
        
        setAssistantReply(data.reply);
        const newHistory = [...updatedHistory, { role: 'assistant', content: data.reply }];
        setCallHistory(newHistory);

        // Playback finished callback to resume recognition
        const handlePlaybackFinished = () => {
          if (data.booking_triggered) {
            setCallState('ended');
            showToast('success', 'Appointment successfully booked via Local AI Receptionist!');
            setTimeout(() => window.location.reload(), 2500);
          } else {
            try { rec.start(); } catch (e) { console.warn("Recognition already active", e); }
          }
        };

        // If ElevenLabs returned a base64 audio file, play it back. Else, use browser TTS.
        if (data.audio_base64) {
          playAudioBase64(data.audio_base64, handlePlaybackFinished);
        } else {
          speakText(data.reply, handlePlaybackFinished);
        }
      } catch (err) {
        console.error("Local simulated conversation failed", err);
        setCallState('ended');
      }
    };

    rec.onerror = (e) => {
      console.warn("Speech recognition error", e);
      if (e.error === 'no-speech') {
        // Retry listening
        try { rec.start(); } catch (err) {}
      } else {
        setCallState('ended');
      }
    };

    setRecognition(rec);
    return rec;
  };

  // Browser Text-to-Speech (TTS)
  const speakText = (text, callback) => {
    setCallState('speaking');
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    const voice = voices.find(v => v.lang.includes('en-IN') || v.lang.includes('en-US')) || voices[0];
    if (voice) utterance.voice = voice;

    utterance.onend = () => {
      if (callback) callback();
    };
    window.speechSynthesis.speak(utterance);
  };

  // ElevenLabs audio stream player
  const playAudioBase64 = (base64Data, onEndCallback) => {
    setCallState('speaking');
    const audioUrl = `data:audio/mp3;base64,${base64Data}`;
    const audio = new Audio(audioUrl);
    audio.onended = () => {
      if (onEndCallback) onEndCallback();
    };
    audio.onerror = (e) => {
      console.warn("Failed to play base64 audio. Falling back.", e);
      if (onEndCallback) onEndCallback();
    };
    audio.play().catch(err => {
      console.warn("Audio playback failed, possibly browser policy blocked autoplay.", err);
      if (onEndCallback) onEndCallback();
    });
  };

  const startVoiceCall = () => {
    setShowVoiceCall(true);
    setCallState('dialing');
    setCallHistory([]);
    setCallTranscript('');
    setAssistantReply('');

    setTimeout(() => {
      setCallState('connected');
      const rec = recognition || initSpeech();
      const welcome = "Hello! Welcome to MediConnect local voice receptionist. How can I help you book your appointment today?";
      setAssistantReply(welcome);
      setCallHistory([{ role: 'assistant', content: welcome }]);
      speakText(welcome, () => {
        if (rec) {
          try { rec.start(); } catch(e) {}
        }
      });
    }, 2000);
  };

  const endVoiceCall = () => {
    window.speechSynthesis.cancel();
    if (recognition) {
      try { recognition.stop(); } catch(e) {}
    }
    setCallState('ended');
    setTimeout(() => setShowVoiceCall(false), 800);
  };
  const [appointments, setAppointments] = useState(MOCK_APPOINTMENTS);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [toast, setToast] = useState(null);
  const [cancelTarget, setCancelTarget] = useState(null);

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));
  const setDirect = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const showToast = (type, msg) => { setToast({ type, msg }); setTimeout(() => setToast(null), 3000); };

  const handleDeptChange = (e) => {
    const d = e.target.value;
    const doctor = DOCTORS_BY_DEPT[d]?.[0] || '';
    setForm(f => ({ ...f, dept: d, doctor }));
  };

  const handleBook = (e) => {
    e.preventDefault();
    const req = ['patient', 'dept', 'doctor', 'date', 'time', 'priority'];
    if (req.some(k => !form[k])) { showToast('error', 'Please fill in all required fields.'); return; }
    const newApt = {
      id: `APT-${1001 + appointments.length}`,
      ...form,
      status: 'Pending',
    };
    setAppointments(a => [newApt, ...a]);
    showToast('success', `Appointment successfully scheduled for ${form.patient}.`);
    setForm(EMPTY);
  };

  const handleCancel = (id) => {
    setAppointments(a => a.map(apt => apt.id === id ? { ...apt, status: 'Cancelled' } : apt));
    showToast('success', `Appointment ${id} has been marked as cancelled.`);
    setCancelTarget(null);
  };

  const filtered = useMemo(() =>
    appointments.filter(a =>
      (statusFilter === 'All' || a.status === statusFilter) &&
      (a.patient.toLowerCase().includes(search.toLowerCase()) ||
       a.doctor.toLowerCase().includes(search.toLowerCase()) ||
       a.dept.toLowerCase().includes(search.toLowerCase()))
    ), [appointments, search, statusFilter]
  );

  const counts = {
    total:     appointments.length,
    confirmed: appointments.filter(a => a.status === 'Confirmed').length,
    pending:   appointments.filter(a => a.status === 'Pending').length,
    cancelled: appointments.filter(a => a.status === 'Cancelled').length,
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <RiCalendarCheckLine className="text-blue-600" /> Appointment Booking
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">Schedule consults and assign clinical departments</p>
        </div>
        <div className="flex gap-3 flex-wrap items-center">
          <button
            type="button"
            onClick={startVoiceCall}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all hover:scale-[1.02] flex-shrink-0"
          >
            <RiPhoneFill className="animate-pulse text-sm" /> Call AI Receptionist
          </button>
          <StatChip label="Total Slots" value={counts.total}     color="text-slate-800" />
          <StatChip label="Confirmed"   value={counts.confirmed} color="text-green-600" />
          <StatChip label="Pending"     value={counts.pending}   color="text-amber-600" />
          <StatChip label="Cancelled"   value={counts.cancelled} color="text-red-650" />
        </div>
      </div>

      {/* Booking Form Card */}
      <form onSubmit={handleBook}>
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-5">
          
          <div className="flex items-center gap-2 pb-2.5 border-b border-slate-100">
            <RiCalendarCheckLine className="text-blue-650 text-base" />
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Book New Consultation</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex flex-col gap-1">
              <FieldLabel required>Patient Name</FieldLabel>
              <IconSelect icon={RiUserHeartLine} value={form.patient} onChange={set('patient')}>
                <option value="">Select patient</option>
                {PATIENTS.map(p => <option key={p}>{p}</option>)}
              </IconSelect>
            </div>
            <div className="flex flex-col gap-1">
              <FieldLabel required>Clinical Department</FieldLabel>
              <IconSelect icon={RiHospitalLine} value={form.dept} onChange={handleDeptChange}>
                <option value="">Select department</option>
                {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
              </IconSelect>
            </div>
            <div className="flex flex-col gap-1">
              <FieldLabel required>Assigned Practitioner</FieldLabel>
              <IconSelect icon={RiStethoscopeLine} value={form.doctor} onChange={set('doctor')}>
                <option value="">Select doctor</option>
                {(form.dept ? DOCTORS_BY_DEPT[form.dept] : Object.values(DOCTORS_BY_DEPT).flat()).map(d => (
                  <option key={d}>{d}</option>
                ))}
              </IconSelect>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <FieldLabel required>Appointment Date</FieldLabel>
              <IconInput icon={RiCalendarLine} type="date" value={form.date} onChange={set('date')}
                min={new Date().toISOString().split('T')[0]} />
            </div>
            <div className="flex flex-col gap-1">
              <FieldLabel required>Preferred Time Slot</FieldLabel>
              <IconSelect icon={RiTimeLine} value={form.time} onChange={set('time')}>
                <option value="">Select time slot</option>
                {TIME_SLOTS.map(t => <option key={t}>{t}</option>)}
              </IconSelect>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <FieldLabel>Clinical Notes / Reason</FieldLabel>
            <div className="relative">
              <RiFileTextLine className="absolute left-3 top-3 text-slate-400 text-sm pointer-events-none" />
              <textarea rows={2} value={form.reason} onChange={set('reason')}
                placeholder="Indicate primary complaints or follow-up details..."
                className={`${inputCls} pl-9 resize-none`} />
            </div>
          </div>

          <div className="flex flex-col gap-2 pt-1">
            <FieldLabel required>Clinical Priority</FieldLabel>
            <div className="flex gap-2 flex-wrap">
              {PRIORITIES.map(({ value, color }) => (
                <label key={value}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border cursor-pointer select-none transition-all text-xs font-semibold
                    ${form.priority === value ? color : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-350'}`}>
                  <input type="radio" className="sr-only" name="priority" value={value}
                    checked={form.priority === value} onChange={() => setDirect('priority', value)} />
                  <RiAlertLine className="text-xs" />
                  {value}
                </label>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button type="button" onClick={() => setForm(EMPTY)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold transition-all">
              <RiRefreshLine /> Reset Form
            </button>
            <button type="submit"
              className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-all">
              <RiSaveLine /> Confirm Appointment
            </button>
          </div>
        </div>
      </form>

      {/* Registry list */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-b border-slate-150 bg-slate-50/50">
          <div>
            <h2 className="text-slate-800 font-semibold text-sm">Active Appointments</h2>
            <p className="text-slate-400 text-xs mt-0.5">Showing scheduled items</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <div className="relative">
              <RiSearchLine className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search patient/practitioner..."
                className="bg-white border border-slate-200 rounded-lg pl-7 pr-3 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-blue-500 w-48 transition-all shadow-xs" />
            </div>
            <div className="relative">
              <RiFilterLine className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none" />
              <RiArrowDownSLine className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                className="bg-white border border-slate-200 rounded-lg pl-7 pr-7 py-1.5 text-xs text-slate-700 appearance-none cursor-pointer focus:outline-none focus:border-blue-500 transition-all shadow-xs">
                {['All', 'Confirmed', 'Pending', 'Cancelled', 'Completed'].map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left min-w-[900px]">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 G_Header uppercase tracking-wider">
                <th className="px-6 py-3 font-semibold">Appt. ID</th>
                <th className="px-6 py-3 font-semibold">Patient</th>
                <th className="px-6 py-3 font-semibold">Doctor</th>
                <th className="px-6 py-3 font-semibold">Department</th>
                <th className="px-6 py-3 font-semibold">Scheduled Date & Time</th>
                <th className="px-6 py-3 font-semibold">Priority</th>
                <th className="px-6 py-3 font-semibold">Status</th>
                <th className="px-6 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-400">
                    No scheduled consultations found.
                  </td>
                </tr>
              ) : (
                filtered.map((apt) => (
                  <tr key={apt.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-3 font-mono font-bold text-slate-800">{apt.id}</td>
                    <td className="px-6 py-3 font-semibold text-slate-850">{apt.patient}</td>
                    <td className="px-6 py-3 text-slate-700 font-medium">{apt.doctor}</td>
                    <td className="px-6 py-3"><span className="text-[10px] bg-slate-100 text-slate-650 px-2 py-0.5 rounded font-semibold">{apt.dept}</span></td>
                    <td className="px-6 py-3">
                      <p className="font-semibold text-slate-800">{apt.date}</p>
                      <p className="text-slate-400 text-[10px] mt-0.5">{apt.time}</p>
                    </td>
                    <td className="px-6 py-3">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${PRIORITY_BADGE[apt.priority]}`}>
                        {apt.priority}
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${STATUS_STYLE[apt.status]}`}>
                        {apt.status}
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-1">
                        <button className="p-1 rounded-md text-slate-400 hover:text-blue-600 hover:bg-slate-100 transition-colors" title="View details">
                          <RiEyeLine className="text-sm" />
                        </button>
                        {apt.status !== 'Cancelled' && apt.status !== 'Completed' && (
                          <button onClick={() => setCancelTarget(apt.id)}
                            className="p-1 rounded-md text-slate-400 hover:text-red-600 hover:bg-slate-100 transition-colors" title="Cancel slot">
                            <RiCloseCircleLine className="text-sm" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-3 border-t border-slate-150 bg-slate-50 text-[11px] text-slate-500">
          Showing {filtered.length} of {appointments.length} scheduled slots
        </div>
      </div>

      {/* Cancel Warning Dialog */}
      {cancelTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white border border-slate-200 rounded-xl shadow-lg p-6 text-center space-y-4">
            <div className="w-12 h-12 bg-red-50 border border-red-100 rounded-full flex items-center justify-center mx-auto">
              <RiCloseCircleLine className="text-red-650 text-xl" />
            </div>
            <div>
              <h3 className="text-slate-800 font-bold text-base">Cancel Appointment?</h3>
              <p className="text-slate-500 text-xs mt-1">
                Are you sure you want to cancel the booking for slot <span className="text-slate-800 font-mono font-semibold">{cancelTarget}</span>?
              </p>
            </div>
            <div className="flex gap-2 justify-center pt-2">
              <button onClick={() => setCancelTarget(null)}
                className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold">
                Keep Slot
              </button>
              <button onClick={() => handleCancel(cancelTarget)}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold">
                Cancel Appointment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Voice Call Simulation Modal */}
      {showVoiceCall && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md transition-all">
          <div className="w-full max-w-md bg-slate-955 border border-slate-800 rounded-2xl shadow-2xl p-6 relative overflow-hidden text-center space-y-6">
            
            {/* Visual Ringing/Calling pulse */}
            <div className="relative w-28 h-28 mx-auto flex items-center justify-center">
              <div className={`absolute inset-0 rounded-full bg-emerald-500/20 animate-ping duration-1000 ${callState === 'connected' || callState === 'speaking' || callState === 'listening' ? '' : 'hidden'}`} />
              <div className={`absolute inset-2 rounded-full bg-emerald-500/30 animate-pulse ${callState === 'connected' || callState === 'speaking' || callState === 'listening' ? '' : 'hidden'}`} />
              <div className="w-20 h-20 bg-emerald-650 rounded-full flex items-center justify-center shadow-lg relative z-10">
                <RiMicFill className="text-white text-3xl animate-pulse" />
              </div>
            </div>

            <div className="space-y-1.5">
              <h3 className="text-white font-bold text-lg tracking-wide">MediConnect Local AI Voice Agent</h3>
              <p className="text-[11px] uppercase tracking-widest text-slate-400 font-bold">
                {callState === 'dialing' && 'Ringing... Connecting local server'}
                {callState === 'connected' && 'Agent connected'}
                {callState === 'speaking' && 'Agent is speaking...'}
                {callState === 'listening' && 'Listening to you...'}
                {callState === 'processing' && 'Processing your response...'}
                {callState === 'ended' && 'Call ended'}
              </p>
            </div>

            {/* Conversation Window */}
            <div className="bg-slate-900/50 border border-slate-800/80 rounded-xl p-4 min-h-[140px] max-h-[220px] overflow-y-auto text-left space-y-3.5 text-xs custom-scrollbar">
              {callHistory.map((ch, idx) => (
                <div key={idx} className={`flex flex-col ${ch.role === 'user' ? 'items-end' : 'items-start'}`}>
                  <span className="text-[9px] font-bold text-slate-500 uppercase mb-0.5">{ch.role === 'user' ? 'You' : 'AI Receptionist'}</span>
                  <div className={`px-3.5 py-2 rounded-xl max-w-[85%] leading-relaxed ${ch.role === 'user' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-slate-800 text-slate-200 rounded-tl-none border border-slate-700/50'}`}>
                    {ch.content}
                  </div>
                </div>
              ))}
              
              {/* Live speech transcription */}
              {callState === 'listening' && callTranscript && (
                <div className="flex flex-col items-end">
                  <span className="text-[9px] font-bold text-slate-500 uppercase mb-0.5">Speaking...</span>
                  <div className="px-3.5 py-2 rounded-xl max-w-[85%] bg-blue-600/50 text-slate-200 italic rounded-tr-none">
                    {callTranscript}
                  </div>
                </div>
              )}

              {callState === 'processing' && (
                <div className="flex items-center gap-1.5 text-slate-500 font-medium py-1">
                  <div className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  <span>Thinking...</span>
                </div>
              )}
            </div>

            {/* Call Action Controls */}
            <div className="flex justify-center pt-2">
              <button
                type="button"
                onClick={endVoiceCall}
                className="w-12 h-12 rounded-full bg-red-650 hover:bg-red-700 flex items-center justify-center transition-all shadow-md hover:scale-105"
                title="Hang Up"
              >
                <RiPhoneFill className="text-white text-xl rotate-[135deg]" />
              </button>
            </div>
            
            <p className="text-[10px] text-slate-500 font-semibold">
              Uses local browser speech capabilities and local Llama 3.2.
            </p>
          </div>
        </div>
      )}

      {/* Toast popup */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-md border text-sm font-medium
          ${toast.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}
        >
          {toast.type === 'success' ? (
            <RiCheckboxCircleLine className="text-base flex-shrink-0" />
          ) : (
            <RiErrorWarningLine className="text-base flex-shrink-0" />
          )}
          {toast.message}
        </div>
      )}
    </div>
  );
};

export default AppointmentBooking;
