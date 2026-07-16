import { useState, useEffect } from 'react';
import { getAllPatients, registerPatient } from '../services/patientService';
import { getAllDoctors } from '../services/doctorService';
import {
  RiUserLine, RiUserHeartLine, RiPhoneLine, RiMailLine,
  RiMapPinLine, RiVirusLine, RiStethoscopeLine, RiCalendarLine,
  RiTranslate2, RiBellLine, RiSaveLine, RiRefreshLine,
  RiUserAddLine, RiHashtag, RiArrowDownSLine,
  RiCheckboxCircleLine, RiCloseCircleLine, RiErrorWarningLine
} from 'react-icons/ri';

const GENDERS = ['Male', 'Female', 'Other', 'Prefer not to say'];
const DISEASES = ['Hypertension', 'Diabetes Type 2', 'Asthma', 'Arthritis', 'Cardiac Disease', 'Neurological Disorder', 'Orthopaedic Issue', 'General Checkup', 'Other'];
const LANGUAGES = ['English', 'Hindi', 'Tamil', 'Telugu', 'Marathi', 'Bengali', 'Gujarati', 'Kannada', 'Malayalam'];
const NOTIF_METHODS = [
  { value: 'sms',      label: 'SMS',         icon: '💬' },
  { value: 'email',    label: 'Email',        icon: '📧' },
  { value: 'whatsapp', label: 'WhatsApp',     icon: '📲' },
  { value: 'call',     label: 'Phone Call',   icon: '📞' },
];

const INITIAL = {
  firstName: '', lastName: '', age: '', gender: '',
  phone: '', email: '', address: '', disease: '',
  doctorAssigned: '', appointmentDate: '', preferredLanguage: '',
  notificationMethod: '',
};

const Field = ({ label, required, children }) => (
  <div className="flex flex-col gap-1">
    <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    {children}
  </div>
);

const inputCls = `w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2 text-sm text-slate-800
  placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-all`;

const IconInput = ({ icon: Icon, ...props }) => (
  <div className="relative">
    <Icon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none" />
    <input className={`${inputCls} pl-9`} {...props} />
  </div>
);

const IconSelect = ({ icon: Icon, children, ...props }) => (
  <div className="relative">
    <Icon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none z-10" />
    <RiArrowDownSLine className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
    <select className={`${inputCls} pl-9 pr-8 appearance-none cursor-pointer`} {...props}>
      {children}
    </select>
  </div>
);

const FormSection = ({ icon: Icon, title }) => (
  <div className="flex items-center gap-2 pb-2.5 border-b border-slate-100">
    <Icon className="text-base text-blue-600" />
    <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">{title}</h3>
  </div>
);

const PatientRegistration = () => {
  const [form, setForm] = useState(INITIAL);
  const [toast, setToast] = useState(null);
  const [patients, setPatients] = useState([]);
  const [doctorsList, setDoctorsList] = useState([]);

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchPatients = async () => {
    try {
      const data = await getAllPatients();
      setPatients(data);
    } catch (e) {
      console.error("Failed to load patients list", e);
    }
  };

  const fetchDoctors = async () => {
    try {
      const data = await getAllDoctors();
      setDoctorsList(data);
    } catch (e) {
      console.error("Failed to load doctors list", e);
    }
  };

  useEffect(() => {
    fetchPatients();
    fetchDoctors();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    const required = ['firstName', 'lastName', 'age', 'gender', 'phone', 'disease', 'doctorAssigned', 'appointmentDate'];
    const missing = required.filter(k => !form[k]);
    if (missing.length) {
      showToast('error', 'Please fill in all required fields.');
      return;
    }

    try {
      // 1. Create Patient
      const patientPayload = {
        name: `${form.firstName} ${form.lastName}`,
        email: form.email || `${form.firstName.toLowerCase()}.${form.lastName.toLowerCase()}@mediconnect.com`,
        phone: form.phone,
        preferred_language: form.preferredLanguage || 'English',
        medical_history: form.disease
      };
      
      const patient = await registerPatient(patientPayload);
      const patientId = patient.id;

      // 2. Match Doctor by Name
      const matchedDoctor = doctorsList.find(d => d.name === form.doctorAssigned);
      const doctorId = matchedDoctor ? matchedDoctor.id : 1;

      // 3. Create Appointment (default to 10:00 AM)
      const apptPayload = {
        patient_id: patientId,
        doctor_id: doctorId,
        appointment_time: `${form.appointmentDate}T10:00:00`,
        status: 'Scheduled',
        notes: form.disease
      };
      
      const { bookAppointment } = await import('../services/appointmentService');
      await bookAppointment(apptPayload);

      showToast('success', `Patient ${patientPayload.name} registered and appointment created!`);
      setForm(INITIAL);
      fetchPatients();
    } catch (err) {
      console.error("Failed to save patient:", err);
      showToast('error', err.message || 'Failed to save patient record.');
    }
  };

  const handleReset = () => {
    setForm(INITIAL);
  };

  return (
    <div className="space-y-6">
      
      {/* Title & Stats */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <RiUserAddLine className="text-blue-600" /> Patient Registration
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">Register new patients into the hospital registry system</p>
        </div>
        <div className="flex gap-3">
          {[
            { label: 'Total Registered', value: patients.length + 1040, color: 'text-blue-600' },
            { label: 'Active Today',     value: 38,                      color: 'text-green-600' },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-white border border-slate-200 rounded-lg px-4 py-1.5 text-center shadow-xs">
              <p className={`text-lg font-bold leading-none ${color}`}>{value}</p>
              <p className="text-slate-400 text-[10.5px] mt-1 font-medium">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Form Container */}
      <form onSubmit={handleSave}>
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-6">
          
          {/* Section 1 */}
          <div className="space-y-4">
            <FormSection icon={RiUserLine} title="Personal Information" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Field label="First Name" required>
                <IconInput icon={RiUserLine} placeholder="John" value={form.firstName} onChange={set('firstName')} />
              </Field>
              <Field label="Last Name" required>
                <IconInput icon={RiUserLine} placeholder="Doe" value={form.lastName} onChange={set('lastName')} />
              </Field>
              <Field label="Age" required>
                <IconInput icon={RiHashtag} type="number" min="0" max="120" placeholder="28" value={form.age} onChange={set('age')} />
              </Field>
              <Field label="Gender" required>
                <IconSelect icon={RiUserHeartLine} value={form.gender} onChange={set('gender')}>
                  <option value="">Select gender</option>
                  {GENDERS.map(g => <option key={g} value={g}>{g}</option>)}
                </IconSelect>
              </Field>
            </div>
          </div>

          {/* Section 2 */}
          <div className="space-y-4">
            <FormSection icon={RiPhoneLine} title="Contact Details" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Phone Number" required>
                <IconInput icon={RiPhoneLine} type="tel" placeholder="+91 98765 43210" value={form.phone} onChange={set('phone')} />
              </Field>
              <Field label="Email Address">
                <IconInput icon={RiMailLine} type="email" placeholder="john.doe@email.com" value={form.email} onChange={set('email')} />
              </Field>
            </div>
            <Field label="Address">
              <div className="relative">
                <RiMapPinLine className="absolute left-3 top-3 text-slate-400 text-sm pointer-events-none" />
                <textarea
                  rows={2}
                  placeholder="Street, City, State, PIN Code"
                  value={form.address}
                  onChange={set('address')}
                  className={`${inputCls} pl-9 resize-none`}
                />
              </div>
            </Field>
          </div>

          {/* Section 3 */}
          <div className="space-y-4">
            <FormSection icon={RiVirusLine} title="Medical Information" />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Field label="Disease / Condition" required>
                <IconSelect icon={RiVirusLine} value={form.disease} onChange={set('disease')}>
                  <option value="">Select condition</option>
                  {DISEASES.map(d => <option key={d} value={d}>{d}</option>)}
                </IconSelect>
              </Field>
              <Field label="Doctor Assigned" required>
                <IconSelect icon={RiStethoscopeLine} value={form.doctorAssigned} onChange={set('doctorAssigned')}>
                  <option value="">Select doctor</option>
                  {doctorsList.map(d => <option key={d.name} value={d.name}>{d.name} – {d.department}</option>)}
                </IconSelect>
              </Field>
              <Field label="Appointment Date" required>
                <IconInput icon={RiCalendarLine} type="date" value={form.appointmentDate} onChange={set('appointmentDate')}
                  min={new Date().toISOString().split('T')[0]} />
              </Field>
            </div>
          </div>

          {/* Section 4 */}
          <div className="space-y-4">
            <FormSection icon={RiBellLine} title="Communication Preferences" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Preferred Language">
                <IconSelect icon={RiTranslate2} value={form.preferredLanguage} onChange={set('preferredLanguage')}>
                  <option value="">Select language</option>
                  {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
                </IconSelect>
              </Field>
              <Field label="Preferred Notification Method">
                <div className="grid grid-cols-2 gap-2 mt-0.5">
                  {NOTIF_METHODS.map(({ value, label, icon }) => (
                    <label key={value}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer select-none transition-all
                        ${form.notificationMethod === value
                          ? 'bg-blue-50 border-blue-200 text-blue-600'
                          : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-300'}`}>
                      <input type="radio" name="notif" value={value}
                        checked={form.notificationMethod === value}
                        onChange={set('notificationMethod')}
                        className="sr-only" />
                      <span className="text-sm">{icon}</span>
                      <span className="text-xs font-semibold">{label}</span>
                    </label>
                  ))}
                </div>
              </Field>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button type="button" onClick={handleReset}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold transition-all">
              <RiRefreshLine /> Reset
            </button>
            <button type="submit"
              className="flex items-center gap-2 px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-all">
              <RiSaveLine /> Save Patient
            </button>
          </div>
        </div>
      </form>

      {/* Recent patients registry */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-slate-150">
          <h2 className="text-slate-800 font-semibold text-sm">Recently Registered Patients</h2>
          <p className="text-slate-400 text-xs mt-0.5">{patients.length} records in current session</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 uppercase tracking-wider">
                <th className="px-6 py-3 font-semibold">Patient ID</th>
                <th className="px-6 py-3 font-semibold">Full Name</th>
                <th className="px-6 py-3 font-semibold">Email</th>
                <th className="px-6 py-3 font-semibold">Phone</th>
                <th className="px-6 py-3 font-semibold">Condition</th>
                <th className="px-6 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {patients.map(({ id, name, email, phone, medical_history }) => (
                <tr key={id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-3 font-mono font-bold text-blue-600">P-{id}</td>
                  <td className="px-6 py-3 font-semibold text-slate-800">{name}</td>
                  <td className="px-6 py-3">{email}</td>
                  <td className="px-6 py-3">{phone}</td>
                  <td className="px-6 py-3 font-medium">{medical_history || 'General'}</td>
                  <td className="px-6 py-3">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-50 text-green-700">
                      Active
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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

export default PatientRegistration;
