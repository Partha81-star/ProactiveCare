import { useState } from 'react';
import {
  RiSparklingLine, RiUserHeartLine, RiGlobalLine, RiMailSendLine,
  RiFileListLine, RiCheckboxCircleLine, RiErrorWarningLine,
} from 'react-icons/ri';

const PATIENTS = [
  { id: 'P-1001', name: 'John Doe', age: 34, disease: 'Hypertension', doctor: 'Dr. Emily Chen', phone: '+91 98765 43210', email: 'john.doe@email.com' },
  { id: 'P-1002', name: 'Sarah Johnson', age: 28, disease: 'Diabetes', doctor: 'Dr. Raj Patel', phone: '+91 98001 11002', email: 's.johnson@email.com' },
  { id: 'P-1003', name: 'Mark Thompson', age: 45, disease: 'Knee Osteoarthritis', doctor: 'Dr. Raj Patel', phone: '+91 98001 11003', email: 'm.thompson@email.com' },
  { id: 'P-1004', name: 'Priya Nair', age: 52, disease: 'Chronic Migraine', doctor: 'Dr. Lisa Wong', phone: '+91 98001 11004', email: 'p.nair@email.com' },
];

const NOTIF_TYPES = [
  { value: 'appointment_reminder', label: 'Appointment Reminder' },
  { value: 'lab_results', label: 'Lab Results Ready' },
  { value: 'prescription_alert', label: 'Prescription Refill Alert' },
  { value: 'follow_up', label: 'Follow-up Care Instructions' },
];

const LANGUAGES = [
  { value: 'English', label: 'English' },
  { value: 'Spanish', label: 'Spanish' },
  { value: 'Hindi', label: 'Hindi' },
  { value: 'French', label: 'French' },
];

const TONE_OPTIONS = [
  { value: 'Professional', label: 'Professional & Direct' },
  { value: 'Empathetic', label: 'Warm & Empathetic' },
  { value: 'Urgent', label: 'Urgent Alert' },
];

const AiNotifications = () => {
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [notifType, setNotifType] = useState('appointment_reminder');
  const [language, setLanguage] = useState('English');
  const [tone, setTone] = useState('Professional');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [generatedMessage, setGeneratedMessage] = useState('');
  const [channel, setChannel] = useState('SMS'); // SMS, Email, WhatsApp
  const [toast, setToast] = useState(null);

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const handleGenerate = async () => {
    if (!selectedPatientId) {
      showToast('error', 'Please select a patient first.');
      return;
    }

    setIsGenerating(true);
    // Simulate AI generation delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const patient = PATIENTS.find((p) => p.id === selectedPatientId);
    let msg = '';

    if (notifType === 'appointment_reminder') {
      msg = `Dear ${patient.name},\nThis is a friendly reminder of your upcoming consultation with ${patient.doctor} scheduled for tomorrow at 10:00 AM. Please arrive 10 minutes early. If you need to reschedule, reply to this message.`;
    } else if (notifType === 'lab_results') {
      msg = `Hello ${patient.name},\nYour recent diagnostic laboratory reports for ${patient.disease} are now available in the MediConnect patient portal. ${patient.doctor} has reviewed them. No immediate actions are required, but please discuss during your next visit.`;
    } else if (notifType === 'prescription_alert') {
      msg = `Important: ${patient.name},\nYour prescription for ${patient.disease} management is due for a refill. Please confirm your pharmacy pickup or schedule delivery via our app.`;
    } else {
      msg = `Dear ${patient.name},\nWe hope you are recovering well. Please remember to log your daily blood pressure readings and follow the recovery exercise plan prescribed by ${patient.doctor}.`;
    }

    if (language === 'Spanish') {
      msg = `Estimado/a ${patient.name},\nLe recordamos su próxima consulta médica con el/la ${patient.doctor}. Por favor, confirme su asistencia o póngase en contacto con nosotros si necesita reprogramar.`;
    } else if (language === 'Hindi') {
      msg = `प्रिय ${patient.name},\nयह ${patient.doctor} के साथ आपकी आगामी अपॉइंटमेंट की याद दिलाने के लिए है। कृपया समय पर पहुंचें।`;
    } else if (language === 'French') {
      msg = `Cher/Chère ${patient.name},\nNous vous rappelons votre prochain rendez-vous avec le ${patient.doctor}. Merci de confirmer votre présence.`;
    }

    if (tone === 'Empathetic') {
      msg = `Warm greetings ${patient.name}, we hope you're feeling well today! Just a gentle reminder about your upcoming visit with ${patient.doctor}. We look forward to seeing you. Take care!`;
    } else if (tone === 'Urgent') {
      msg = `ALERT: ${patient.name}, important notification regarding your care with ${patient.doctor}. Immediate action/review requested. Please log in or call us.`;
    }

    setGeneratedMessage(msg);
    setIsGenerating(false);
    showToast('success', 'AI Message generated successfully.');
  };

  const handleSend = async () => {
    if (!generatedMessage) {
      showToast('error', 'No message to send. Please generate one first.');
      return;
    }

    setIsSending(true);
    // Simulate api dispatch
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSending(false);
    showToast('success', `Notification successfully dispatched via ${channel}!`);
    setGeneratedMessage('');
    setSelectedPatientId('');
  };

  const selectedPatient = PATIENTS.find((p) => p.id === selectedPatientId);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <RiSparklingLine className="text-blue-600" /> AI Notification Generator
        </h1>
        <p className="text-slate-500 text-sm mt-0.5">
          Generate customized, localized patient communications using AI templates
        </p>
      </div>

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Generator Controls */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
            <h3 className="text-slate-800 font-semibold text-sm border-b border-slate-100 pb-3">
              Configuration Parameters
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Patient Selection */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Select Patient <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <RiUserHeartLine className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none" />
                  <select
                    value={selectedPatientId}
                    onChange={(e) => setSelectedPatientId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-8 py-2 text-sm text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 cursor-pointer appearance-none"
                  >
                    <option value="">-- Choose Patient --</option>
                    {PATIENTS.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.id}) - {p.disease}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Notification Type */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider font-medium">
                  Notification Type
                </label>
                <div className="relative">
                  <RiFileListLine className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none" />
                  <select
                    value={notifType}
                    onChange={(e) => setNotifType(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-8 py-2 text-sm text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 cursor-pointer appearance-none"
                  >
                    {NOTIF_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Language Selection */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Target Language
                </label>
                <div className="relative">
                  <RiGlobalLine className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none" />
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-8 py-2 text-sm text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 cursor-pointer appearance-none"
                  >
                    {LANGUAGES.map((l) => (
                      <option key={l.value} value={l.value}>
                        {l.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Communication Tone */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  AI Communication Tone
                </label>
                <select
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 cursor-pointer"
                >
                  {TONE_OPTIONS.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={handleGenerate}
                disabled={isGenerating}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGenerating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Generating draft...
                  </>
                ) : (
                  <>
                    <RiSparklingLine className="text-base" /> Generate AI Message
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Editable Message Preview Card */}
          {generatedMessage && (
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-slate-800 font-semibold text-sm">
                  Editable Message Draft
                </h3>
                <span className="text-[11px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full font-medium">
                  Verify before sending
                </span>
              </div>

              <textarea
                value={generatedMessage}
                onChange={(e) => setGeneratedMessage(e.target.value)}
                rows={6}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 resize-none font-sans"
              />

              {/* Delivery Channel selection */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Channel:
                  </span>
                  <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                    {['SMS', 'Email', 'WhatsApp'].map((ch) => (
                      <button
                        key={ch}
                        onClick={() => setChannel(ch)}
                        className={`px-3 py-1 text-xs font-medium rounded-md transition-all
                          ${channel === ch ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                      >
                        {ch}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleSend}
                  disabled={isSending}
                  className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold shadow-sm transition-all disabled:opacity-50"
                >
                  {isSending ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <RiMailSendLine className="text-base" /> Send Notification
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Selected Patient Information Card */}
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <h3 className="text-slate-800 font-semibold text-sm border-b border-slate-100 pb-3 mb-4">
              Patient Context
            </h3>

            {selectedPatient ? (
              <div className="space-y-3.5 text-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm">
                    {selectedPatient.name.split(' ').map(w => w[0]).join('')}
                  </div>
                  <div>
                    <h4 className="text-slate-800 font-semibold">{selectedPatient.name}</h4>
                    <p className="text-slate-400 text-xs">{selectedPatient.id}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100 text-xs">
                  <div>
                    <span className="text-slate-400 block mb-0.5">Age</span>
                    <span className="text-slate-800 font-medium">{selectedPatient.age} years</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Condition</span>
                    <span className="text-slate-800 font-medium">{selectedPatient.disease}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Assigned Doctor</span>
                    <span className="text-slate-800 font-medium">{selectedPatient.doctor}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Preferred Language</span>
                    <span className="text-slate-800 font-medium">{language}</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 text-xs space-y-1 text-slate-500">
                  <p>📞 Phone: <span className="text-slate-700 font-medium">{selectedPatient.phone}</span></p>
                  <p>✉️ Email: <span className="text-slate-700 font-medium">{selectedPatient.email}</span></p>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-slate-400 text-xs flex flex-col items-center gap-2">
                <RiUserHeartLine className="text-3xl text-slate-300" />
                <p>No patient selected. Choose a patient from configuration parameters to load their details.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Toast Alert */}
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

export default AiNotifications;
