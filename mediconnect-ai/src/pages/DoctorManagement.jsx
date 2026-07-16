import { useState, useMemo, useEffect } from 'react';
import { getAllDoctors, addDoctor, updateDoctor, deleteDoctor } from '../services/doctorService';
import {
  RiStethoscopeLine, RiUserAddLine, RiSearchLine, RiEditLine,
  RiDeleteBinLine, RiCloseLine, RiSaveLine, RiPhoneLine,
  RiMailLine, RiHospitalLine, RiArrowDownSLine, RiFilterLine,
  RiCheckboxCircleLine, RiErrorWarningLine,
} from 'react-icons/ri';

const DEPARTMENTS = ['All', 'Cardiology', 'Orthopedics', 'Neurology', 'General', 'Pediatrics', 'Pulmonology', 'Dermatology', 'Psychiatry', 'Endocrinology', 'Radiology'];
const AVAILABILITY = ['On Duty', 'Off Duty', 'On Leave'];
const SPECIALIZATIONS = ['Cardiologist', 'Orthopedic Surgeon', 'Neurologist', 'General Physician', 'Pediatrician', 'Pulmonologist', 'Dermatologist', 'Psychiatrist', 'Endocrinologist', 'Radiologist'];

const EMPTY_FORM = { name: '', spec: '', dept: '', phone: '', email: '', avail: 'On Duty' };

const availBadge = (avail) => ({
  'On Duty':  'bg-green-50 text-green-700 border-green-200',
  'Off Duty': 'bg-slate-100 text-slate-600 border-slate-200',
  'On Leave': 'bg-amber-50 text-amber-700 border-amber-200',
}[avail] ?? '');

const initials = (name) => name.replace('Dr. ', '').split(' ').map(w => w[0]).join('').slice(0, 2);

const StatChip = ({ label, value, color }) => (
  <div className="bg-white border border-slate-200 rounded-lg px-4 py-1.5 text-center min-w-[70px] shadow-xs">
    <p className={`text-lg font-bold leading-none ${color}`}>{value}</p>
    <p className="text-slate-400 text-[10.5px] mt-1 font-medium">{label}</p>
  </div>
);

const inputCls = `w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800
  placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-all`;

const FieldLabel = ({ children, required }) => (
  <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
    {children} {required && <span className="text-red-500">*</span>}
  </label>
);

const DoctorModal = ({ mode, form, onChange, onSave, onClose }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
    <div className="w-full max-w-lg bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
      
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-150">
        <h2 className="text-slate-800 font-bold text-base">{mode === 'add' ? 'Add New Doctor' : 'Edit Doctor Details'}</h2>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-50">
          <RiCloseLine className="text-xl" />
        </button>
      </div>

      {/* Body */}
      <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2 flex flex-col gap-1">
            <FieldLabel required>Full Name</FieldLabel>
            <input className={inputCls} placeholder="Dr. Full Name" value={form.name} onChange={e => onChange('name', e.target.value)} />
          </div>
          <div className="flex flex-col gap-1">
            <FieldLabel required>Specialization</FieldLabel>
            <div className="relative">
              <RiArrowDownSLine className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <select className={`${inputCls} appearance-none cursor-pointer`} value={form.spec} onChange={e => onChange('spec', e.target.value)}>
                <option value="" disabled>Select specialization</option>
                {SPECIALIZATIONS.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <FieldLabel required>Department</FieldLabel>
            <div className="relative">
              <RiArrowDownSLine className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <select className={`${inputCls} appearance-none cursor-pointer`} value={form.dept} onChange={e => onChange('dept', e.target.value)}>
                <option value="" disabled>Select department</option>
                {DEPARTMENTS.filter(d => d !== 'All').map(d => <option key={d}>{d}</option>)}
              </select>
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <FieldLabel>Phone Number</FieldLabel>
            <input className={inputCls} placeholder="+91 98000 00000" value={form.phone} onChange={e => onChange('phone', e.target.value)} />
          </div>
          <div className="flex flex-col gap-1">
            <FieldLabel>Email Address</FieldLabel>
            <input className={inputCls} type="email" placeholder="doctor@mediconnect.ai" value={form.email} onChange={e => onChange('email', e.target.value)} />
          </div>
          
          <div className="sm:col-span-2 flex flex-col gap-2 pt-1">
            <FieldLabel>Availability Status</FieldLabel>
            <div className="flex gap-2 flex-wrap">
              {AVAILABILITY.map(a => (
                <label key={a} className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer select-none transition-all text-xs font-semibold
                  ${form.avail === a ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-350'}`}>
                  <input type="radio" className="sr-only" name="avail" value={a} checked={form.avail === a} onChange={() => onChange('avail', a)} />
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${a === 'On Duty' ? 'bg-green-500' : a === 'Off Duty' ? 'bg-slate-450' : 'bg-amber-500'}`} />
                  {a}
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-150 bg-slate-50">
        <button onClick={onClose} className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-semibold transition-all">
          Cancel
        </button>
        <button onClick={onSave} className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-all">
          <RiSaveLine /> {mode === 'add' ? 'Add Doctor' : 'Save Changes'}
        </button>
      </div>
    </div>
  </div>
);

const DeleteConfirm = ({ doctor, onConfirm, onCancel }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
    <div className="w-full max-w-sm bg-white border border-slate-200 rounded-xl shadow-lg p-6 text-center space-y-4">
      <div className="w-12 h-12 bg-red-50 border border-red-100 rounded-full flex items-center justify-center mx-auto">
        <RiDeleteBinLine className="text-red-600 text-xl" />
      </div>
      <div>
        <h3 className="text-slate-800 font-bold text-base">Remove Doctor?</h3>
        <p className="text-slate-500 text-xs mt-1">
          Are you sure you want to permanently remove <span className="text-slate-800 font-semibold">{doctor?.name}</span>?
        </p>
      </div>
      <div className="flex gap-2 justify-center pt-2">
        <button onClick={onCancel} className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold">
          Cancel
        </button>
        <button onClick={onConfirm} className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold">
          Delete Doctor
        </button>
      </div>
    </div>
  </div>
);

const DoctorManagement = () => {
  const [doctors, setDoctors] = useState([]);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('All');
  const [modalMode, setModalMode] = useState(null); 
  const [form, setForm] = useState(EMPTY_FORM);
  const [editId, setEditId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchDoctors = async () => {
    try {
      const data = await getAllDoctors();
      const mapped = data.map(d => ({
        id: d.id,
        name: d.name,
        spec: d.specialization,
        dept: d.department,
        phone: d.phone,
        email: d.email,
        avail: d.availability || 'On Duty'
      }));
      setDoctors(mapped);
    } catch (e) {
      console.error("Failed to load doctor database", e);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  const filtered = useMemo(() =>
    doctors.filter(d =>
      (deptFilter === 'All' || d.dept === deptFilter) &&
      (d.name.toLowerCase().includes(search.toLowerCase()) ||
       d.spec.toLowerCase().includes(search.toLowerCase()) ||
       d.dept.toLowerCase().includes(search.toLowerCase()))
    ), [doctors, search, deptFilter]
  );

  const openAdd = () => { setForm(EMPTY_FORM); setModalMode('add'); };
  
  const openEdit = (doc) => {
    setForm({ name: doc.name, spec: doc.spec, dept: doc.dept, phone: doc.phone, email: doc.email, avail: doc.avail });
    setEditId(doc.id);
    setModalMode('edit');
  };
  
  const closeModal = () => {
    setModalMode(null);
    setEditId(null);
    setForm(EMPTY_FORM);
  };
  
  const handleChange = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.name || !form.spec || !form.dept) {
      showToast('error', 'Name, Specialization and Department fields are required.');
      return;
    }
    const payload = {
      name: form.name,
      specialization: form.spec,
      department: form.dept,
      phone: form.phone,
      email: form.email,
      availability: form.avail
    };

    try {
      if (modalMode === 'add') {
        await addDoctor(payload);
        showToast('success', `${form.name} successfully registered.`);
      } else {
        await updateDoctor(editId, payload);
        showToast('success', `${form.name} successfully updated.`);
      }
      fetchDoctors();
      closeModal();
    } catch (err) {
      showToast('error', 'Failed to save doctor details.');
    }
  };

  const handleDelete = async () => {
    try {
      await deleteDoctor(deleteTarget.id);
      showToast('success', `${deleteTarget.name} has been removed.`);
      setDeleteTarget(null);
      fetchDoctors();
    } catch (err) {
      showToast('error', 'Failed to delete doctor.');
    }
  };

  const onDuty = doctors.filter(d => d.avail === 'On Duty').length;
  const offDuty = doctors.filter(d => d.avail === 'Off Duty').length;
  const onLeave = doctors.filter(d => d.avail === 'On Leave').length;

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <RiStethoscopeLine className="text-blue-600" /> Doctor Management
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">Maintain professional rosters, specialization info, and availability</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <StatChip label="Total Registered" value={doctors.length} color="text-slate-800" />
          <StatChip label="On Duty"         value={onDuty}         color="text-green-600" />
          <StatChip label="Off Duty"        value={offDuty}        color="text-slate-600" />
          <StatChip label="On Leave"        value={onLeave}        color="text-amber-600" />
          
          <button onClick={openAdd}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-all">
            <RiUserAddLine className="text-sm" /> Add Doctor
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, specialization, or department..."
            className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-700 focus:outline-none focus:border-blue-500 transition-all shadow-xs"
          />
        </div>
        <div className="relative">
          <RiFilterLine className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none" />
          <RiArrowDownSLine className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <select
            value={deptFilter}
            onChange={e => setDeptFilter(e.target.value)}
            className="bg-white border border-slate-200 rounded-lg pl-8 pr-8 py-2 text-xs text-slate-700 appearance-none cursor-pointer focus:outline-none focus:border-blue-500 transition-all shadow-xs"
          >
            {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
          </select>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left min-w-[800px]">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 uppercase tracking-wider">
                <th className="px-6 py-3 font-semibold">Doctor</th>
                <th className="px-6 py-3 font-semibold">Specialization</th>
                <th className="px-6 py-3 font-semibold">Department</th>
                <th className="px-6 py-3 font-semibold">Availability</th>
                <th className="px-6 py-3 font-semibold">Phone</th>
                <th className="px-6 py-3 font-semibold">Email</th>
                <th className="px-6 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    No doctor records match the criteria.
                  </td>
                </tr>
              ) : (
                filtered.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-3 font-bold text-slate-800">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-md bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-[10px]">
                          {initials(doc.name)}
                        </div>
                        <span>{doc.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-3 font-medium">{doc.spec}</td>
                    <td className="px-6 py-3 text-slate-500">{doc.dept}</td>
                    <td className="px-6 py-3">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[10px] font-bold ${availBadge(doc.avail)}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${doc.avail === 'On Duty' ? 'bg-green-500' : doc.avail === 'Off Duty' ? 'bg-slate-400' : 'bg-amber-500'}`} />
                        {doc.avail}
                      </span>
                    </td>
                    <td className="px-6 py-3 font-medium text-slate-500">{doc.phone}</td>
                    <td className="px-6 py-3 text-slate-500">{doc.email}</td>
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openEdit(doc)}
                          className="p-1.5 rounded-md text-slate-400 hover:text-blue-600 hover:bg-slate-100 transition-colors"
                          title="Edit"
                        >
                          <RiEditLine className="text-sm" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(doc)}
                          className="p-1.5 rounded-md text-slate-400 hover:text-red-600 hover:bg-slate-100 transition-colors"
                          title="Delete"
                        >
                          <RiDeleteBinLine className="text-sm" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-3 border-t border-slate-150 bg-slate-50 text-[11px] text-slate-500">
          Showing {filtered.length} of {doctors.length} registered practitioners
        </div>
      </div>

      {/* Modals */}
      {modalMode && (
        <DoctorModal mode={modalMode} form={form} onChange={handleChange} onSave={handleSave} onClose={closeModal} />
      )}
      {deleteTarget && (
        <DeleteConfirm doctor={deleteTarget} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />
      )}

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

export default DoctorManagement;
