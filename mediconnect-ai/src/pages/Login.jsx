import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ROUTES } from '../utils/constants';
import {
  RiMailLine, RiLockLine, RiEyeLine, RiEyeOffLine,
  RiHospitalLine, RiShieldCheckLine, RiUserHeartLine,
  RiStethoscopeLine, RiBellLine, RiBarChart2Line,
  RiArrowRightLine, RiCheckLine,
} from 'react-icons/ri';

const MOCK_USERS = [
  { email: 'admin@mediconnect.ai',  password: 'admin123', name: 'Dr. Admin User',    role: 'admin'   },
  { email: 'doctor@mediconnect.ai', password: 'doctor123', name: 'Dr. Emily Chen',   role: 'doctor'  },
  { email: 'nurse@mediconnect.ai',  password: 'nurse123',  name: 'Nurse Sarah Kim',  role: 'nurse'   },
];

const FEATURES = [
  { Icon: RiUserHeartLine,  label: 'Patient Management',     desc: 'Register & track patient records'     },
  { Icon: RiStethoscopeLine,label: 'Doctor Directory',        desc: 'Manage staff & availability'          },
  { Icon: RiBellLine,       label: 'Smart Notifications',     desc: 'SMS, Email & WhatsApp alerts'         },
  { Icon: RiBarChart2Line,  label: 'Analytics & Reports',     desc: 'Real-time hospital insights'          },
];

const STATS = [
  { value: '4,827', label: 'Patients' },
  { value: '30+',   label: 'Doctors'  },
  { value: '99.9%', label: 'Uptime'   },
];

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please enter your email and password.');
      return;
    }

    setLoading(true);
    await new Promise(r => setTimeout(r, 1000));

    const user = MOCK_USERS.find(u => u.email === email && u.password === password);
    if (!user) {
      setError('Invalid email or password. Please try again.');
      setLoading(false);
      return;
    }

    login({ name: user.name, role: user.role, email: user.email }, 'mock-jwt-token-' + Date.now());
    navigate(ROUTES.DASHBOARD);
  };

  const fillDemo = (u) => {
    setEmail(u.email);
    setPassword(u.password);
    setError('');
  };

  return (
    <div className="min-h-screen flex bg-slate-50">
      
      {/* Left Column - Enterprise Info & Features */}
      <div className="hidden lg:flex lg:w-[50%] bg-slate-900 flex-col justify-between p-12 text-slate-300">
        
        {/* Brand Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
            <RiHospitalLine className="text-white text-xl" />
          </div>
          <div>
            <p className="text-white font-bold text-lg leading-tight">MediConnect AI</p>
            <p className="text-slate-400 text-xs tracking-wider">HOSPITAL SYSTEM</p>
          </div>
        </div>

        {/* Center Hero Content */}
        <div className="space-y-8 my-auto">
          <div>
            <h1 className="text-3xl font-bold text-white leading-tight">
              Unified Hospital Portal & Management Platform
            </h1>
            <p className="text-slate-400 text-sm mt-3 leading-relaxed max-w-md">
              A trustworthy, secure system connecting practitioners, receptionists,
              and hospital administrators with real-time operations.
            </p>
          </div>

          {/* Core Feature Grid */}
          <div className="grid grid-cols-2 gap-4">
            {FEATURES.map(({ Icon, label, desc }) => (
              <div key={label} className="p-4 bg-slate-800 border border-slate-700 rounded-xl space-y-1.5">
                <div className="w-8 h-8 rounded-lg bg-slate-700/50 flex items-center justify-center">
                  <Icon className="text-blue-400 text-base" />
                </div>
                <div>
                  <h4 className="text-white text-xs font-semibold">{label}</h4>
                  <p className="text-slate-400 text-[10.5px] leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Stats Bar */}
          <div className="flex items-center justify-between border-t border-slate-800 pt-6 max-w-sm">
            {STATS.map(({ value, label }) => (
              <div key={label}>
                <p className="text-xl font-bold text-white leading-none">{value}</p>
                <p className="text-slate-400 text-[11px] mt-1">{label}</p>
              </div>
            ))}
            <div className="flex items-center gap-2 px-2.5 py-1 bg-green-500/10 border border-green-500/20 rounded-md">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
              <span className="text-green-400 text-[10.5px] font-semibold">Active</span>
            </div>
          </div>
        </div>

        {/* Footer Details */}
        <div className="flex items-center gap-2 text-[11px] text-slate-500">
          <RiShieldCheckLine className="text-slate-400 text-sm" />
          Secure Gateway · HIPAA Compliant · AES-256 Encryption Standard
        </div>
      </div>

      {/* Right Column - Clean Login Card */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 bg-slate-50">
        <div className="w-full max-w-[420px] bg-white border border-slate-200 rounded-xl p-8 shadow-sm space-y-6">
          
          {/* Header */}
          <div>
            <div className="flex items-center gap-2.5 lg:hidden mb-4">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <RiHospitalLine className="text-white text-base" />
              </div>
              <span className="font-bold text-slate-800 text-sm">MediConnect AI</span>
            </div>
            <h2 className="text-xl font-bold text-slate-800">Sign in to your account</h2>
            <p className="text-slate-500 text-xs mt-1">Enter your medical credentials to access the system</p>
          </div>

          {/* Demo Login Quick fill */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-2">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Demo User Roles</p>
            <div className="flex gap-2">
              {MOCK_USERS.map(u => (
                <button
                  key={u.role}
                  onClick={() => fillDemo(u)}
                  className="flex-1 px-3 py-1.5 text-xs font-semibold rounded bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-350 transition-all capitalize"
                >
                  {u.role}
                </button>
              ))}
            </div>
          </div>

          {/* Credentials Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Email Field */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Email Address
              </label>
              <div className="relative">
                <RiMailLine className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-base" />
                <input
                  type="email"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setError(''); }}
                  placeholder="name@mediconnect.ai"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <RiLockLine className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-base" />
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError(''); }}
                  placeholder="••••••••"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-10 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPass ? <RiEyeOffLine /> : <RiEyeLine />}
                </button>
              </div>
            </div>

            {/* Remember Me + Reset */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={e => setRemember(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-slate-355 rounded focus:ring-blue-500"
                />
                <span className="text-slate-600 text-xs select-none">Remember this device</span>
              </label>
              <button type="button" className="text-xs text-blue-600 hover:text-blue-700 font-semibold">
                Forgot password?
              </button>
            </div>

            {/* Form Error Banner */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-xs text-red-700">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-sm transition-all disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Authenticating...
                </>
              ) : (
                <>
                  Sign In <RiArrowRightLine />
                </>
              )}
            </button>
          </form>

          {/* Rights Footer */}
          <p className="text-center text-slate-400 text-[11px] pt-2">
            © 2025 MediConnect AI. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
