import { useState } from 'react';
import {
  RiSettings3Line, RiHospitalLine, RiNotification3Line, RiLockPasswordLine,
  RiDatabaseLine, RiCheckboxCircleLine, RiErrorWarningLine, RiSaveLine,
} from 'react-icons/ri';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('general');
  const [toast, setToast] = useState(null);

  // Form states
  const [generalForm, setGeneralForm] = useState({
    hospitalName: 'MediConnect AI General Hospital',
    timezone: 'Asia/Kolkata (GMT+05:30)',
    contactEmail: 'admin@mediconnect.ai',
    contactPhone: '+91 98000 11000',
    address: '100 Medical Plaza, Sector 4, New Delhi',
  });

  const [notificationConfig, setNotificationConfig] = useState({
    enableSms: true,
    enableEmail: true,
    enableWhatsapp: false,
    enableVoiceCall: false,
    apiKey: 'mc_live_9f0a2d38e718b2c9a',
  });

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSave = (section) => {
    showToast('success', `${section} settings saved successfully.`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <RiSettings3Line className="text-blue-600" /> Settings
        </h1>
        <p className="text-slate-500 text-sm mt-0.5">
          Configure global system settings, integration endpoints, and parameters
        </p>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        
        {/* Navigation Tabs */}
        <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm h-fit space-y-1">
          {[
            { id: 'general', label: 'Hospital General', Icon: RiHospitalLine },
            { id: 'notifications', label: 'Notifications API', Icon: RiNotification3Line },
            { id: 'security', label: 'Security & Auth', Icon: RiLockPasswordLine },
            { id: 'integrations', label: 'Integrations', Icon: RiDatabaseLine },
          ].map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all text-left
                ${activeTab === id
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'}`}
            >
              <Icon className="text-base" /> {label}
            </button>
          ))}
        </div>

        {/* Tab Contents */}
        <div className="md:col-span-3">
          
          {/* General Tab */}
          {activeTab === 'general' && (
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-5">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-slate-800 font-semibold text-sm">General Hospital Details</h3>
                <p className="text-slate-400 text-xs mt-0.5">Primary organization settings used for letterheads and communications.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5 md:col-span-2">
                  <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Hospital Name</label>
                  <input
                    type="text"
                    value={generalForm.hospitalName}
                    onChange={(e) => setGeneralForm(prev => ({ ...prev, hospitalName: e.target.value }))}
                    className="bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2 text-sm text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">System Timezone</label>
                  <select
                    value={generalForm.timezone}
                    onChange={(e) => setGeneralForm(prev => ({ ...prev, timezone: e.target.value }))}
                    className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
                  >
                    <option>Asia/Kolkata (GMT+05:30)</option>
                    <option>Europe/London (GMT+00:00)</option>
                    <option>America/New_York (GMT-05:00)</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Support Contact Number</label>
                  <input
                    type="text"
                    value={generalForm.contactPhone}
                    onChange={(e) => setGeneralForm(prev => ({ ...prev, contactPhone: e.target.value }))}
                    className="bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2 text-sm text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
                  />
                </div>

                <div className="flex flex-col gap-1.5 md:col-span-2">
                  <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">System Support Email</label>
                  <input
                    type="email"
                    value={generalForm.contactEmail}
                    onChange={(e) => setGeneralForm(prev => ({ ...prev, contactEmail: e.target.value }))}
                    className="bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2 text-sm text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
                  />
                </div>

                <div className="flex flex-col gap-1.5 md:col-span-2">
                  <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Physical Address</label>
                  <textarea
                    rows={2}
                    value={generalForm.address}
                    onChange={(e) => setGeneralForm(prev => ({ ...prev, address: e.target.value }))}
                    className="bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2 text-sm text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 resize-none"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end">
                <button
                  onClick={() => handleSave('Hospital General')}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-sm transition-all"
                >
                  <RiSaveLine /> Save General Details
                </button>
              </div>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-5">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-slate-800 font-semibold text-sm">Notifications API Configuration</h3>
                <p className="text-slate-400 text-xs mt-0.5">Control SMS, Email, and WhatsApp dispatch services.</p>
              </div>

              <div className="space-y-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Gateway API Access Key</label>
                  <input
                    type="password"
                    value={notificationConfig.apiKey}
                    onChange={(e) => setNotificationConfig(prev => ({ ...prev, apiKey: e.target.value }))}
                    className="bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2 text-sm text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
                  />
                </div>

                <div className="space-y-3 pt-2">
                  <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider block">Enabled Dispatch Channels</label>
                  
                  {[
                    { key: 'enableSms', label: 'SMS Notification Dispatch' },
                    { key: 'enableEmail', label: 'Email Notification Dispatch' },
                    { key: 'enableWhatsapp', label: 'WhatsApp Notification Dispatch' },
                    { key: 'enableVoiceCall', label: 'Voice Call Notification Dispatch' },
                  ].map(({ key, label }) => (
                    <label key={key} className="flex items-center gap-3 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={notificationConfig[key]}
                        onChange={(e) => setNotificationConfig(prev => ({ ...prev, [key]: e.target.checked }))}
                        className="w-4.5 h-4.5 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm text-slate-700">{label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end">
                <button
                  onClick={() => handleSave('Notification API')}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-sm transition-all"
                >
                  <RiSaveLine /> Save API Config
                </button>
              </div>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-5">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-slate-800 font-semibold text-sm">Security & Password</h3>
                <p className="text-slate-400 text-xs mt-0.5">Manage session durations, security audits, and change credentials.</p>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Current Password</label>
                  <input
                    type="password"
                    className="bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2 text-sm text-slate-800 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">New Password</label>
                    <input
                      type="password"
                      className="bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2 text-sm text-slate-800 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Confirm New Password</label>
                    <input
                      type="password"
                      className="bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2 text-sm text-slate-800 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end">
                <button
                  onClick={() => handleSave('Security')}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-sm transition-all"
                >
                  <RiSaveLine /> Change Password
                </button>
              </div>
            </div>
          )}

          {/* Integrations Tab */}
          {activeTab === 'integrations' && (
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-5">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-slate-800 font-semibold text-sm">System Database & Integrations</h3>
                <p className="text-slate-400 text-xs mt-0.5">Control endpoints for diagnostic labs, pharmacies, and external portals.</p>
              </div>

              <div className="space-y-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Diagnostic Lab Portal URL</label>
                  <input
                    type="text"
                    defaultValue="https://lab.mediconnect.ai/api/v1"
                    className="bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2 text-sm text-slate-800 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">E-Pharmacy Dispatch Endpoints</label>
                  <input
                    type="text"
                    defaultValue="https://pharmacy.mediconnect.ai/api/orders"
                    className="bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2 text-sm text-slate-800 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end">
                <button
                  onClick={() => handleSave('Integrations')}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-sm transition-all"
                >
                  <RiSaveLine /> Save Integration Endpoints
                </button>
              </div>
            </div>
          )}
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

export default Settings;
