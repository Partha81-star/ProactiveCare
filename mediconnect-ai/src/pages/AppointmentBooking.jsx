import { useCallback, useState, useMemo, useEffect, useRef } from 'react';
import { getAllAppointments, bookPatientAppointment, updateAppointment } from '../services/appointmentService';
import { VOICE_BASE_URL, subscribeAppointments } from '../services/realtime';
import { getAllDoctors } from '../services/doctorService';
import {
  RiCalendarCheckLine, RiUserHeartLine, RiStethoscopeLine,
  RiHospitalLine, RiCalendarLine, RiTimeLine, RiFileTextLine,
  RiAlertLine, RiSaveLine, RiRefreshLine, RiSearchLine,
  RiArrowDownSLine, RiEyeLine, RiCloseCircleLine,
  RiCheckboxCircleLine, RiFilterLine, RiErrorWarningLine,
  RiPhoneFill, RiMicFill
} from 'react-icons/ri';

const to24Hour = (value) => {
  const [clock, period] = value.split(' ');
  const [hours, minutes] = clock.split(':').map(Number);
  return `${String(hours % 12 + (period === 'PM' ? 12 : 0)).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`;
};

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

const EMPTY = { name: '', email: '', phone: '', dept: '', doctor: '', date: '', time: '', reason: '', priority: 'Medium' };

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
    } catch {
      return '10:00 AM';
    }
  };

const AppointmentBooking = () => {
  const [form, setForm] = useState(EMPTY);
  const bookingKey = useRef(null);
  const [saving, setSaving] = useState(false);

  // Local Voice Agent Simulation States
  const [showVoiceCall, setShowVoiceCall] = useState(false);
  const [callState, setCallState] = useState('idle'); // idle, dialing, connected, speaking, listening, processing, ended
  const [callTranscript, setCallTranscript] = useState('');
  const [callHistory, setCallHistory] = useState([]);
  const [callPhone, setCallPhone] = useState('');
  const [typedReply, setTypedReply] = useState('');
  const [speechSupported, setSpeechSupported] = useState(true);
  const [recorderSupported, setRecorderSupported] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const voiceRef = useRef({ active: false, history: [], session: null, step: 0, recognition: null });

  const speakText = (text, callback) => {
    if (!voiceRef.current.active) return;
    setCallState('speaking');
    if (!window.speechSynthesis || !window.SpeechSynthesisUtterance) {
      setCallState('connected');
      callback?.();
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-IN';
    utterance.onend = () => { if (voiceRef.current.active) callback?.(); };
    utterance.onerror = () => { if (voiceRef.current.active) callback?.(); };
    window.speechSynthesis.speak(utterance);
  };

  const sendVoiceTurn = async (text = '') => {
    const state = voiceRef.current;
    if (!state.active || state.processing) return;
    state.processing = true;
    setCallState('processing');
    if (text) state.history.push({ role: 'user', content: text });
    setCallHistory([...state.history]);
    try {
      const response = await fetch(`${VOICE_BASE_URL}/api/v1/voice/local/simulate`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        signal: state.controller.signal,
        body: JSON.stringify({ text, phone: state.phone, session_id: state.session, step: state.step })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(typeof data.detail === 'string' ? data.detail : 'Voice service unavailable');
      if (!state.active || voiceRef.current !== state) return;
      state.session = data.session_id;
      state.step = data.step;
      state.history.push({ role: 'assistant', content: data.reply });
      setCallHistory([...state.history]);
      state.processing = false;
      speakText(data.reply, () => {
        if (data.ended) {
          state.active = false;
          setCallState('ended');
          if (data.booking_triggered) {
            showToast('success', `Appointment booked. Reference: ${data.appointment_id}`);
            fetchAppointments();
          }
        } else {
          try { state.recognition.start(); } catch { setCallState('connected'); }
        }
      });
    } catch (error) {
      if (state.active) {
        showToast('error', error.message);
        setCallState('ended');
        state.active = false;
      }
    } finally {
      state.processing = false;
    }
  };

  const connectVoiceCall = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const phone = callPhone.trim();
    if (!/^\+[1-9]\d{7,14}$/.test(phone)) {
      showToast('error', 'Enter a valid phone number with country code, for example +919876543210.');
      return;
    }
    const rec = SpeechRecognition ? new SpeechRecognition() : null;
    setSpeechSupported(Boolean(rec));
    voiceRef.current = { active: true, history: [], session: null, step: 0,
      phone, recognition: rec, controller: new AbortController() };
    if (rec) {
      rec.lang = 'en-IN';
      rec.continuous = false;
      rec.interimResults = false;
      rec.onstart = () => { setCallState('listening'); setCallTranscript(''); };
      rec.onresult = (event) => {
        const text = event.results[0][0].transcript;
        setCallTranscript(text);
        sendVoiceTurn(text);
      };
      rec.onerror = (event) => {
        if (!voiceRef.current.active) return;
        if (event.error === 'no-speech') {
          setCallState('connected');
        } else {
          setSpeechSupported(false);
          setCallState('connected');
          showToast('error', 'Microphone speech recognition is unavailable. Continue by typing below.');
        }
      };
    }
    setCallHistory([]);
    setCallState('dialing');
    sendVoiceTurn();
  };

  const startVoiceCall = () => {
    setCallPhone(form.phone || '');
    setTypedReply('');
    setCallHistory([]);
    setCallState('idle');
    setSpeechSupported(Boolean(window.SpeechRecognition || window.webkitSpeechRecognition));
    setRecorderSupported(Boolean(navigator.mediaDevices?.getUserMedia && window.MediaRecorder));
    setShowVoiceCall(true);
  };

  const stopRecording = () => {
    const recorder = voiceRef.current.mediaRecorder;
    if (recorder?.state === 'recording') recorder.stop();
  };

  const startRecording = async () => {
    const state = voiceRef.current;
    if (!state.active || state.processing || isTranscribing) return;
    try {
      state.recognition?.abort();
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const preferredType = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus']
        .find(type => MediaRecorder.isTypeSupported(type));
      const recorder = new MediaRecorder(stream, preferredType ? { mimeType: preferredType } : undefined);
      const chunks = [];
      state.mediaRecorder = recorder;
      state.mediaStream = stream;
      recorder.ondataavailable = event => { if (event.data.size) chunks.push(event.data); };
      recorder.onstop = async () => {
        stream.getTracks().forEach(track => track.stop());
        setIsRecording(false);
        if (!state.active || !chunks.length) return;
        setIsTranscribing(true);
        setCallState('processing');
        try {
          const blob = new Blob(chunks, { type: recorder.mimeType || 'audio/webm' });
          const body = new FormData();
          body.append('audio', blob, `answer.${blob.type.includes('ogg') ? 'ogg' : 'webm'}`);
          const response = await fetch(`${VOICE_BASE_URL}/api/v1/voice/transcribe`, {
            method: 'POST', body, signal: state.controller.signal,
          });
          const data = await response.json();
          if (!response.ok) throw new Error(data.detail || 'Could not understand the recording.');
          setCallTranscript(data.text);
          await sendVoiceTurn(data.text);
        } catch (error) {
          if (state.active && error.name !== 'AbortError') {
            showToast('error', error.message);
            setCallState('connected');
          }
        } finally {
          setIsTranscribing(false);
        }
      };
      recorder.start();
      setCallTranscript('');
      setIsRecording(true);
      setCallState('listening');
    } catch {
      setRecorderSupported(false);
      setCallState('connected');
      showToast('error', 'Microphone permission was denied. Allow microphone access and try again.');
    }
  };

  const submitTypedReply = (event) => {
    event.preventDefault();
    const text = typedReply.trim();
    if (!text || !voiceRef.current.active || callState === 'processing') return;
    voiceRef.current.recognition?.abort();
    setTypedReply('');
    sendVoiceTurn(text);
  };

  const endVoiceCall = () => {
    const state = voiceRef.current;
    state.active = false;
    state.controller?.abort();
    state.recognition?.abort();
    if (state.mediaRecorder?.state === 'recording') state.mediaRecorder.stop();
    state.mediaStream?.getTracks().forEach(track => track.stop());
    window.speechSynthesis.cancel();
    setCallState('ended');
    setShowVoiceCall(false);
  };

  useEffect(() => () => {
    const state = voiceRef.current;
    state.active = false;
    state.controller?.abort();
    state.recognition?.abort();
    window.speechSynthesis?.cancel();
  }, []);
  const [appointments, setAppointments] = useState([]);
  const [doctorsList, setDoctorsList] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [toast, setToast] = useState(null);
  const [cancelTarget, setCancelTarget] = useState(null);

  // Time formatter helper

  // Fetch appointments from API
  const fetchAppointments = useCallback(async () => {
    try {
      const data = await getAllAppointments();
      const mapped = data.map(apt => {
        let dateVal = '2026-07-20';
        if (apt.appointment_time) {
          dateVal = apt.appointment_time.split('T')[0];
        }

        return {
          id: `APT-${apt.id}`,
          patient: apt.patient?.name || 'Local Caller',
          doctor: apt.doctor?.name || 'General Practitioner',
          dept: apt.doctor?.department || 'General',
          date: dateVal,
          time: apt.appointment_time ? formatTime(apt.appointment_time) : '10:00 AM',
          reason: apt.notes || 'Booked via AI receptionist',
          priority: 'Medium',
          status: ['Scheduled', 'Rescheduled'].includes(apt.status) ? 'Confirmed' : (apt.status || 'Pending')
        };
      });
      setAppointments(mapped);
    } catch (err) {
      console.error("Failed to load database appointments:", err);
    }
  }, []);

  // Fetch doctors from API
  const fetchDoctors = useCallback(async () => {
    try {
      const data = await getAllDoctors();
      setDoctorsList(data);
    } catch (e) {
      console.error("Failed to load doctors list:", e);
    }
  }, []);

  // Set up real-time websocket and pull initial lists
  useEffect(() => {
    fetchAppointments();
    // HTTP data loading updates state after the awaited network response.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchDoctors();

    return subscribeAppointments(fetchAppointments);
  }, [fetchAppointments, fetchDoctors]);
  // Compute departments and filter doctors dynamically from the database
  const departments = useMemo(() => {
    return [...new Set(doctorsList.map(d => d.department))];
  }, [doctorsList]);

  const filteredDoctors = useMemo(() => {
    return doctorsList.filter(d => !form.dept || d.department === form.dept);
  }, [doctorsList, form.dept]);

  const set = (k) => (e) => { bookingKey.current = null; setForm(f => ({ ...f, [k]: e.target.value })); };
  const setDirect = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const showToast = (type, msg) => { setToast({ type, msg }); setTimeout(() => setToast(null), 3000); };

  const handleDeptChange = (e) => {
    const d = e.target.value;
    const firstDocOfDept = doctorsList.find(doc => doc.department === d)?.name || '';
    setForm(f => ({ ...f, dept: d, doctor: firstDocOfDept }));
  };

  const handleBook = async (e) => {
    e.preventDefault();
    const req = ['name', 'email', 'phone', 'dept', 'doctor', 'date', 'time', 'priority'];
    if (req.some(k => !form[k])) { showToast('error', 'Please fill in all required fields.'); return; }

    if (saving) return;
    setSaving(true);
    try {
      await bookPatientAppointment({
        patient_name: form.name, email: form.email, phone: form.phone,
        doctor: form.doctor, appointment_time: `${form.date}T${to24Hour(form.time)}`,
        notes: form.reason || 'Booked through web portal', confirmed: true,
        idempotency_key: bookingKey.current || (bookingKey.current = crypto.randomUUID())
      });
      bookingKey.current = null;
      showToast('success', `Appointment successfully scheduled for ${form.name}.`);
      setForm(EMPTY);

      // Fetch latest list
      fetchAppointments();
    } catch (err) {
      console.error("Booking error:", err);
      showToast('error', err.message || 'Failed to schedule appointment.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = async (id) => {
    try {
      const dbId = parseInt(id.replace('APT-', ''));
      await updateAppointment(dbId, { status: 'Cancelled' });
      showToast('success', `Appointment ${id} has been marked as cancelled.`);
      setCancelTarget(null);
      fetchAppointments();
    } catch (err) {
      console.error("Failed to cancel appointment:", err);
      showToast('error', 'Failed to cancel appointment.');
    }
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
              <IconInput icon={RiUserHeartLine} type="text" placeholder="Enter patient name" value={form.name} onChange={set('name')} />
            </div>
            <div className="flex flex-col gap-1">
              <FieldLabel required>Patient Email</FieldLabel>
              <IconInput icon={RiUserHeartLine} type="email" placeholder="Enter patient email" value={form.email} onChange={set('email')} />
            </div>
            <div className="flex flex-col gap-1">
              <FieldLabel required>Patient Phone</FieldLabel>
              <IconInput icon={RiUserHeartLine} type="tel" placeholder="Enter phone (e.g. +91...)" value={form.phone} onChange={set('phone')} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex flex-col gap-1">
              <FieldLabel required>Clinical Department</FieldLabel>
              <IconSelect icon={RiHospitalLine} value={form.dept} onChange={handleDeptChange}>
                <option value="">Select department</option>
                {departments.map(d => <option key={d}>{d}</option>)}
              </IconSelect>
            </div>
            <div className="flex flex-col gap-1">
              <FieldLabel required>Assigned Practitioner</FieldLabel>
              <IconSelect icon={RiStethoscopeLine} value={form.doctor} onChange={set('doctor')}>
                <option value="">Select doctor</option>
                {filteredDoctors.map(d => (
                  <option key={d.id} value={d.name}>{d.name}</option>
                ))}
              </IconSelect>
            </div>
            <div className="flex flex-col gap-1">
              <FieldLabel required>Appointment Date</FieldLabel>
              <IconInput icon={RiCalendarLine} type="date" value={form.date} onChange={set('date')}
                min={new Date().toISOString().split('T')[0]} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            <button type="submit" disabled={saving}
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
              <h3 className="text-white font-bold text-lg tracking-wide">MediConnect Online Receptionist</h3>
              <p className="text-[11px] uppercase tracking-widest text-slate-400 font-bold">
                {callState === 'idle' && 'Ready to connect over the internet'}
                {callState === 'dialing' && 'Ringing... Connecting local server'}
                {callState === 'connected' && 'Agent connected'}
                {callState === 'speaking' && 'Agent is speaking...'}
                {callState === 'listening' && 'Listening to you...'}
                {callState === 'processing' && 'Processing your response...'}
                {callState === 'ended' && 'Call ended'}
              </p>
            </div>

            {callState === 'idle' && (
              <div className="space-y-3 text-left">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400" htmlFor="online-call-phone">
                  Patient phone number
                </label>
                <input id="online-call-phone" type="tel" autoFocus value={callPhone}
                  onChange={(event) => setCallPhone(event.target.value)}
                  onKeyDown={(event) => { if (event.key === 'Enter') connectVoiceCall(); }}
                  placeholder="+919876543210"
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none" />
                <p className="text-[10px] leading-relaxed text-slate-500">
                  This identifies the patient record. The online call does not dial or charge this number.
                </p>
                <button type="button" onClick={connectVoiceCall}
                  className="w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-700">
                  Connect to Receptionist
                </button>
              </div>
            )}

            {/* Conversation Window */}
            {callState !== 'idle' && <div className="bg-slate-900/50 border border-slate-800/80 rounded-xl p-4 min-h-[140px] max-h-[220px] overflow-y-auto text-left space-y-3.5 text-xs custom-scrollbar">
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
            </div>}

            {callState !== 'idle' && callState !== 'ended' && (
              <div className="space-y-3">
                {recorderSupported && (
                  <button type="button" onClick={isRecording ? stopRecording : startRecording}
                    disabled={isTranscribing || callState === 'processing'}
                    className={`w-full rounded-xl px-4 py-3 text-sm font-bold text-white transition-all disabled:cursor-not-allowed disabled:opacity-50 ${isRecording ? 'bg-red-600 hover:bg-red-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}>
                    <span className="inline-flex items-center gap-2">
                      <RiMicFill className={isRecording ? 'animate-pulse' : ''} />
                      {isRecording ? 'Stop & Send Recording' : isTranscribing ? 'Understanding your voice…' : 'Tap to Record Your Answer'}
                    </span>
                  </button>
                )}
                <form onSubmit={submitTypedReply} className="space-y-2">
                <div className="flex gap-2">
                  <input value={typedReply} onChange={(event) => setTypedReply(event.target.value)}
                    placeholder={speechSupported ? 'Or type your answer here…' : 'Type your answer here…'}
                    aria-label="Type your answer"
                    className="min-w-0 flex-1 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none" />
                  <button type="submit" disabled={!typedReply.trim() || callState === 'processing'}
                    className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-50">
                    Send
                  </button>
                </div>
                <p className="text-[10px] text-slate-500">
                  {recorderSupported ? 'Tap once to record, speak your answer, then tap again. Typing remains available as a backup.' : (speechSupported ? 'Speak after the prompt, or type your answer.' : 'Microphone recording is unavailable in this browser. Continue by typing.')}
                </p>
                </form>
              </div>
            )}

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
              Online call over Wi-Fi/data. No international phone call is placed.
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
