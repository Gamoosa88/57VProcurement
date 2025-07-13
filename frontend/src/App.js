import React, { useState, useEffect, createContext, useContext } from "react";
import "./App.css";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Auth Context
const AuthContext = createContext();

const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      checkAuth();
    } else {
      setLoading(false);
    }
  }, [token]);

  const checkAuth = async () => {
    try {
      const response = await axios.get(`${API}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(response.data);
    } catch (error) {
      localStorage.removeItem('token');
      setToken(null);
      setUser(null);
    }
    setLoading(false);
  };

  const login = async (email, password) => {
    // Demo mode - accept any credentials
    if (email && password) {
      // Create demo user based on email pattern
      const isAdmin = email.includes('1957') || email.includes('admin');
      const demoUser = {
        id: 'demo-' + Date.now(),
        email: email,
        user_type: isAdmin ? 'admin' : 'vendor',
        is_approved: true,
        company_name: isAdmin ? '1957 Ventures' : 'Demo Company Inc.'
      };
      
      const demoToken = 'demo-token-' + Date.now();
      localStorage.setItem('token', demoToken);
      setToken(demoToken);
      setUser(demoUser);
      return { success: true };
    }
    
    // Fallback to real authentication if needed
    try {
      const response = await axios.post(`${API}/auth/login`, { email, password });
      const { token: newToken, user: userData } = response.data;
      localStorage.setItem('token', newToken);
      setToken(newToken);
      setUser(userData);
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.detail || 'Login failed' 
      };
    }
  };

  const signup = async (userData) => {
    // Demo mode - accept any signup
    if (userData.email && userData.password) {
      const demoUser = {
        id: 'demo-' + Date.now(),
        email: userData.email,
        user_type: userData.user_type,
        is_approved: userData.user_type === 'admin' ? true : true, // Auto-approve for demo
        company_name: userData.company_name || (userData.user_type === 'admin' ? '1957 Ventures' : 'Demo Company Inc.')
      };
      
      const demoToken = 'demo-token-' + Date.now();
      localStorage.setItem('token', demoToken);
      setToken(demoToken);
      setUser(demoUser);
      return { success: true };
    }
    
    // Fallback to real signup if needed
    try {
      const response = await axios.post(`${API}/auth/signup`, userData);
      const { token: newToken, user: userInfo } = response.data;
      localStorage.setItem('token', newToken);
      setToken(newToken);
      setUser(userInfo);
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.detail || 'Signup failed' 
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      token, 
      loading, 
      login, 
      signup, 
      logout 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

// Landing Page Component
const LandingPage = ({ onNavigate }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">1957</span>
              </div>
              <span className="text-xl font-bold text-gray-900">Procurement Portal</span>
            </div>
            <div className="hidden md:flex items-center space-x-6">
              <a href="#features" className="text-gray-600 hover:text-blue-600 transition-colors">Features</a>
              <a href="#about" className="text-gray-600 hover:text-blue-600 transition-colors">About</a>
              <a href="#contact" className="text-gray-600 hover:text-blue-600 transition-colors">Contact</a>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-20 text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-8 leading-tight">
            Welcome to the
            <span className="block text-blue-600">1957 Ventures</span>
            <span className="block">Procurement Portal</span>
          </h1>
          
          <p className="text-xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed">
            A seamless platform for vendor collaboration, RFP management, and contract transparency. 
            Streamline your procurement process with AI-powered evaluation and real-time tracking.
          </p>

          {/* Demo Information */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8 max-w-2xl mx-auto">
            <h3 className="text-lg font-semibold text-blue-900 mb-3">🚀 Demo Mode</h3>
            <p className="text-blue-800 mb-3">
              You can use any email and password to sign in and explore the platform!
            </p>
            <div className="text-sm text-blue-700">
              <p><strong>Quick Demo Tips:</strong></p>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>Use any email/password combination to sign in</li>
                <li>Emails containing "1957" or "admin" will create admin accounts</li>
                <li>All other emails will create vendor accounts</li>
                <li>Experience the full platform with demo data</li>
              </ul>
            </div>
          </div>

          {/* Call-to-Action Buttons */}
          <div className="flex flex-col md:flex-row justify-center items-center space-y-4 md:space-y-0 md:space-x-6 mb-16">
            {/* Vendor Sign Up */}
            <button
              onClick={() => onNavigate('vendor-signup')}
              className="group w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 transform hover:scale-105 hover:shadow-lg flex items-center justify-center space-x-3"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span>Vendor Sign Up</span>
            </button>

            {/* Vendor Sign In */}
            <button
              onClick={() => onNavigate('vendor-signin')}
              className="group w-full md:w-auto bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 transform hover:scale-105 hover:shadow-lg flex items-center justify-center space-x-3"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
              </svg>
              <span>Vendor Sign In</span>
            </button>

            {/* 1957 Team Login */}
            <button
              onClick={() => onNavigate('team-login')}
              className="group w-full md:w-auto bg-gray-800 hover:bg-gray-900 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 transform hover:scale-105 hover:shadow-lg flex items-center justify-center space-x-3"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <span>1957 Team Login</span>
            </button>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-8 mt-20">
            <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">AI-Powered Evaluation</h3>
              <p className="text-gray-600">Advanced AI scoring system evaluates proposals with 70% commercial and 30% technical weighting for optimal vendor selection.</p>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className="w-16 h-16 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Real-Time Updates</h3>
              <p className="text-gray-600">Live synchronization ensures all stakeholders see proposal submissions, evaluations, and contract updates instantly.</p>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className="w-16 h-16 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Smart Approval Workflows</h3>
              <p className="text-gray-600">Automated routing based on contract value ensures proper governance and accelerated decision-making processes.</p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-gray-400">&copy; 2025 1957 Ventures. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

// Vendor Signup Flow
const VendorSignupFlow = ({ onNavigate }) => {
  const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: Profile
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [formData, setFormData] = useState({
    company_name: '',
    cr_number: '',
    country: '',
    username: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();

  const handleEmailSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    // Simulate OTP sending
    setTimeout(() => {
      setLoading(false);
      setStep(2);
    }, 1000);
  };

  const handleOtpSubmit = (e) => {
    e.preventDefault();
    if (otp === '123456') { // Mock OTP validation
      setStep(3);
    } else {
      setError('Invalid OTP. Use 123456 for demo.');
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      const result = await signup({
        email,
        password: formData.password,
        user_type: 'vendor',
        company_name: formData.company_name,
        username: formData.username,
        cr_number: formData.cr_number,
        country: formData.country
      });

      if (!result.success) {
        setError(result.error);
      }
    } catch (err) {
      setError('An unexpected error occurred');
    }
    setLoading(false);
  };

  const renderStep = () => {
    if (step === 1) {
      return (
        <form onSubmit={handleEmailSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Business Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter your business email"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
          >
            {loading ? 'Sending OTP...' : 'Send Verification Code'}
          </button>
        </form>
      );
    }

    if (step === 2) {
      return (
        <form onSubmit={handleOtpSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Verification Code
            </label>
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-2xl tracking-widest"
              placeholder="000000"
              maxLength={6}
              required
            />
            <p className="text-sm text-gray-600 mt-2">
              We sent a verification code to {email}. Use <strong>123456</strong> for demo.
            </p>
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Verify Code
          </button>
        </form>
      );
    }

    return (
      <form onSubmit={handleProfileSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="Company Name"
            value={formData.company_name}
            onChange={(e) => setFormData({...formData, company_name: e.target.value})}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
          <input
            type="text"
            placeholder="CR Number"
            value={formData.cr_number}
            onChange={(e) => setFormData({...formData, cr_number: e.target.value})}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <input
            type="text"
            placeholder="Country"
            value={formData.country}
            onChange={(e) => setFormData({...formData, country: e.target.value})}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
          <input
            type="text"
            placeholder="Username"
            value={formData.username}
            onChange={(e) => setFormData({...formData, username: e.target.value})}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={formData.password}
            onChange={(e) => setFormData({...formData, password: e.target.value})}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
          <input
            type="password"
            placeholder="Confirm Password"
            value={formData.confirmPassword}
            onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>

        {/* Document Upload Section */}
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
          <div className="text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 48 48">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" />
            </svg>
            <div className="mt-4">
              <label htmlFor="file-upload" className="cursor-pointer">
                <span className="mt-2 block text-sm font-medium text-gray-900">
                  Upload Required Documents
                </span>
                <span className="mt-1 block text-sm text-gray-600">
                  CR Copy, VAT Certificate, Bank IBAN, National IDs
                </span>
              </label>
              <input id="file-upload" name="file-upload" type="file" className="sr-only" multiple />
            </div>
          </div>
        </div>

        <div className="flex items-center">
          <input
            id="agree"
            name="agree"
            type="checkbox"
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            required
          />
          <label htmlFor="agree" className="ml-2 block text-sm text-gray-900">
            I agree to the <a href="#" className="text-blue-600 hover:underline">Terms of Service</a> and <a href="#" className="text-blue-600 hover:underline">Privacy Policy</a>
          </label>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
        >
          {loading ? 'Creating Account...' : 'Submit for Review'}
        </button>
      </form>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <button
              onClick={() => onNavigate('landing')}
              className="text-blue-600 hover:underline mb-4 flex items-center"
            >
              ← Back to Home
            </button>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Vendor Registration
            </h1>
            <p className="text-gray-600">
              Step {step} of 3 - {step === 1 ? 'Email Verification' : step === 2 ? 'OTP Verification' : 'Company Profile'}
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          {renderStep()}
        </div>
      </div>
    </div>
  );
};

// Vendor Signin Component
const VendorSignin = ({ onNavigate }) => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await login(formData.email, formData.password);
    if (result.success) {
      // Successful login - will be handled by MainApp useEffect
      // No need to manually navigate as the user state change will trigger dashboard view
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <button
              onClick={() => onNavigate('landing')}
              className="text-green-600 hover:underline mb-4 flex items-center"
            >
              ← Back to Home
            </button>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Vendor Sign In
            </h1>
            <p className="text-gray-600">
              Access your vendor dashboard
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <input
              type="email"
              placeholder="Email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              required
            />

            <input
              type="password"
              placeholder="Password"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              required
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50"
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => onNavigate('vendor-signup')}
              className="text-green-600 hover:underline"
            >
              Don't have an account? Sign up
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Team Login Component
const TeamLogin = ({ onNavigate }) => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await login(formData.email, formData.password);
    if (result.success) {
      // Successful login - will be handled by MainApp useEffect
      // No need to manually navigate as the user state change will trigger dashboard view
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-slate-100 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <button
              onClick={() => onNavigate('landing')}
              className="text-gray-600 hover:underline mb-4 flex items-center"
            >
              ← Back to Home
            </button>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              1957 Team Login
            </h1>
            <p className="text-gray-600">
              Access the procurement dashboard
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <input
              type="email"
              placeholder="Email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
              required
            />

            <input
              type="password"
              placeholder="Password"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
              required
            />

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember"
                  name="remember"
                  type="checkbox"
                  className="h-4 w-4 text-gray-600 focus:ring-gray-500 border-gray-300 rounded"
                />
                <label htmlFor="remember" className="ml-2 block text-sm text-gray-900">
                  Remember me
                </label>
              </div>
              <div className="text-sm">
                <a href="#" className="font-medium text-gray-600 hover:text-gray-500">
                  Forgot password?
                </a>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gray-800 text-white py-3 px-4 rounded-lg hover:bg-gray-900 transition-colors font-medium disabled:opacity-50"
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

// Navbar Component for Dashboard
const Navbar = ({ onNavigate, currentView }) => {
  const { user, logout } = useAuth();

  const getNavItems = () => {
    if (!user) return [];
    
    if (user.user_type === 'vendor') {
      return [
        { id: 'dashboard', label: '📊 Dashboard', icon: '📊' },
        { id: 'rfps', label: '📁 Available RFPs', icon: '📁' },
        { id: 'proposals', label: '📤 My Proposals', icon: '📤' },
        { id: 'contracts', label: '✅ Contracts', icon: '✅' }
      ];
    } else {
      return [
        { id: 'dashboard', label: '📊 Dashboard', icon: '📊' },
        { id: 'rfps', label: '🔁 Manage RFPs', icon: '🔁' },
        { id: 'proposals', label: '📥 Proposals Inbox', icon: '📥' },
        { id: 'evaluation', label: '🧠 AI Evaluation', icon: '🧠' },
        { id: 'vendors', label: '🧑‍💼 Vendor Directory', icon: '🧑‍💼' }
      ];
    }
  };

  return (
    <nav className="bg-white shadow-lg border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">1957</span>
            </div>
            <h1 className="text-xl font-bold text-blue-600">Procurement Portal</h1>
          </div>
          
          {user && (
            <div className="flex items-center space-x-6">
              {getNavItems().map(item => (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                    currentView === item.id 
                      ? 'bg-blue-600 text-white shadow-lg' 
                      : 'text-gray-600 hover:bg-blue-50 hover:text-blue-600'
                  }`}
                >
                  {item.label}
                </button>
              ))}
              
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {user.company_name || user.email}
                  </p>
                  <p className="text-xs text-gray-500 capitalize">
                    {user.user_type} {!user.is_approved && user.user_type === 'vendor' ? '(Pending)' : ''}
                  </p>
                </div>
                <button
                  onClick={logout}
                  className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
                >
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

// Awaiting Approval Component
const AwaitingApproval = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-100 flex items-center justify-center py-12 px-4">
      <div className="max-w-2xl w-full">
        <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
          <div className="w-24 h-24 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-8">
            <svg className="w-12 h-12 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Account Under Review
          </h1>
          
          <p className="text-lg text-gray-600 mb-8 leading-relaxed">
            Thank you for your registration! We're currently reviewing your submission. 
            You'll be notified via email once your vendor account is approved and you can access the portal.
          </p>
          
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-8">
            <h3 className="font-semibold text-yellow-800 mb-2">What happens next?</h3>
            <ul className="text-yellow-700 text-left space-y-2">
              <li>• Our team will verify your company documents</li>
              <li>• Background check and compliance verification</li>
              <li>• Email notification upon approval (usually 2-3 business days)</li>
              <li>• Full access to RFPs and proposal submission</li>
            </ul>
          </div>
          
          <p className="text-sm text-gray-500">
            Questions? Contact us at <a href="mailto:procurement@1957ventures.com" className="text-blue-600 hover:underline">procurement@1957ventures.com</a>
          </p>
        </div>
      </div>
    </div>
  );
};

// Dashboard Component (keeping the same from before)
const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // Check if using demo token
      const token = localStorage.getItem('token');
      if (token && token.startsWith('demo-token-')) {
        // Return demo stats
        const demoStats = user.user_type === 'vendor' 
          ? { total_proposals: 5, awarded_contracts: 2, active_rfps: 8 }
          : { total_rfps: 12, total_proposals: 25, pending_vendors: 3 };
        setStats(demoStats);
        setLoading(false);
        return;
      }
      
      const response = await axios.get(`${API}/dashboard/stats`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
      // Fallback to demo stats on error
      const demoStats = user.user_type === 'vendor' 
        ? { total_proposals: 5, awarded_contracts: 2, active_rfps: 8 }
        : { total_rfps: 12, total_proposals: 25, pending_vendors: 3 };
      setStats(demoStats);
    }
    setLoading(false);
  };

  if (loading) return <div className="p-6">Loading...</div>;

  // Show waiting approval for unapproved vendors
  if (user.user_type === 'vendor' && !user.is_approved) {
    return <AwaitingApproval />;
  }

  const getStatsCards = () => {
    if (user.user_type === 'vendor') {
      return [
        { title: 'Total Proposals', value: stats?.total_proposals || 0, icon: '📤', color: 'blue' },
        { title: 'Awarded Contracts', value: stats?.awarded_contracts || 0, icon: '✅', color: 'green' },
        { title: 'Active RFPs', value: stats?.active_rfps || 0, icon: '📁', color: 'purple' }
      ];
    } else {
      return [
        { title: 'Total RFPs', value: stats?.total_rfps || 0, icon: '🔁', color: 'blue' },
        { title: 'Total Proposals', value: stats?.total_proposals || 0, icon: '📥', color: 'green' },
        { title: 'Pending Vendors', value: stats?.pending_vendors || 0, icon: '⏳', color: 'orange' }
      ];
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-6">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Welcome back, {user.company_name || user.email}
          </h1>
          <p className="text-gray-600 text-lg">
            {user.user_type === 'vendor' ? 'Vendor Dashboard' : '1957 Ventures Admin Dashboard'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {getStatsCards().map((card, index) => (
            <div key={index} className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium mb-1">{card.title}</p>
                  <p className="text-3xl font-bold text-gray-900">{card.value}</p>
                </div>
                <div className="text-4xl">{card.icon}</div>
              </div>
              <div className={`mt-4 h-1 bg-${card.color}-200 rounded-full`}>
                <div className={`h-1 bg-${card.color}-500 rounded-full w-3/4`}></div>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {user.user_type === 'vendor' ? (
              <>
                <button className="p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors text-left">
                  <div className="text-2xl mb-2">📝</div>
                  <div className="font-semibold text-gray-900">Submit Proposal</div>
                  <div className="text-sm text-gray-600">Submit to active RFPs</div>
                </button>
                <button className="p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors text-left">
                  <div className="text-2xl mb-2">📄</div>
                  <div className="font-semibold text-gray-900">View Contracts</div>
                  <div className="text-sm text-gray-600">Manage awarded contracts</div>
                </button>
                <button className="p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors text-left">
                  <div className="text-2xl mb-2">🔔</div>
                  <div className="font-semibold text-gray-900">Notifications</div>
                  <div className="text-sm text-gray-600">View updates</div>
                </button>
                <button className="p-4 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors text-left">
                  <div className="text-2xl mb-2">⚙️</div>
                  <div className="font-semibold text-gray-900">Settings</div>
                  <div className="text-sm text-gray-600">Account settings</div>
                </button>
              </>
            ) : (
              <>
                <button className="p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors text-left">
                  <div className="text-2xl mb-2">➕</div>
                  <div className="font-semibold text-gray-900">Create RFP</div>
                  <div className="text-sm text-gray-600">Post new opportunities</div>
                </button>
                <button className="p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors text-left">
                  <div className="text-2xl mb-2">🧠</div>
                  <div className="font-semibold text-gray-900">AI Evaluation</div>
                  <div className="text-sm text-gray-600">Review proposals</div>
                </button>
                <button className="p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors text-left">
                  <div className="text-2xl mb-2">👥</div>
                  <div className="font-semibold text-gray-900">Vendor Management</div>
                  <div className="text-sm text-gray-600">Approve vendors</div>
                </button>
                <button className="p-4 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors text-left">
                  <div className="text-2xl mb-2">📊</div>
                  <div className="font-semibold text-gray-900">Reports</div>
                  <div className="text-sm text-gray-600">Analytics dashboard</div>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Keep the same RFP and Proposal management components from before
const RFPManagement = () => {
  const { user } = useAuth();
  const [rfps, setRfps] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newRfp, setNewRfp] = useState({
    title: '',
    description: '',
    budget: '',
    deadline: '',
    categories: '',
    scope_of_work: ''
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRfps();
  }, []);

  const fetchRfps = async () => {
    try {
      // Check if using demo token
      const token = localStorage.getItem('token');
      if (token && token.startsWith('demo-token-')) {
        // Return demo RFPs
        const demoRfps = [
          {
            id: 'demo-rfp-1',
            title: 'Enterprise Cloud Infrastructure Modernization',
            description: 'Comprehensive cloud migration and infrastructure modernization project for portfolio companies.',
            budget: 750000,
            deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            categories: ['Cloud Infrastructure', 'DevOps', 'Security'],
            scope_of_work: 'Complete migration to AWS/Azure with security implementation and DevOps automation.',
            status: 'active',
            approval_level: 'cfo',
            created_at: new Date().toISOString()
          },
          {
            id: 'demo-rfp-2',
            title: 'AI-Powered Customer Analytics Platform',
            description: 'Development of machine learning platform for customer behavior analysis.',
            budget: 350000,
            deadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(),
            categories: ['AI/ML', 'Analytics', 'Software Development'],
            scope_of_work: 'Build comprehensive analytics platform with ML capabilities for customer insights.',
            status: 'active',
            approval_level: 'manager',
            created_at: new Date().toISOString()
          },
          {
            id: 'demo-rfp-3',
            title: 'Cybersecurity Audit and Implementation',
            description: 'Complete security assessment and implementation of enterprise security measures.',
            budget: 180000,
            deadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
            categories: ['Cybersecurity', 'Compliance', 'Risk Management'],
            scope_of_work: 'Full security audit, penetration testing, and implementation of security protocols.',
            status: 'active',
            approval_level: 'manager',
            created_at: new Date().toISOString()
          }
        ];
        setRfps(demoRfps);
        setLoading(false);
        return;
      }
      
      const response = await axios.get(`${API}/rfps`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setRfps(response.data);
    } catch (error) {
      console.error('Error fetching RFPs:', error);
      // Fallback to demo data
      setRfps([]);
    }
    setLoading(false);
  };

  const createRfp = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/rfps`, {
        ...newRfp,
        budget: parseFloat(newRfp.budget),
        deadline: new Date(newRfp.deadline).toISOString(),
        categories: newRfp.categories.split(',').map(c => c.trim())
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      setShowCreateForm(false);
      setNewRfp({
        title: '',
        description: '',
        budget: '',
        deadline: '',
        categories: '',
        scope_of_work: ''
      });
      fetchRfps();
    } catch (error) {
      console.error('Error creating RFP:', error);
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">
            {user.user_type === 'vendor' ? 'Available RFPs' : 'Manage RFPs'}
          </h1>
          {user.user_type === 'admin' && (
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors shadow-lg"
            >
              + Create New RFP
            </button>
          )}
        </div>

        {showCreateForm && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <h2 className="text-xl font-bold mb-4">Create New RFP</h2>
            <form onSubmit={createRfp} className="space-y-4">
              <input
                type="text"
                placeholder="RFP Title"
                value={newRfp.title}
                onChange={(e) => setNewRfp({...newRfp, title: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
              <textarea
                placeholder="Description"
                value={newRfp.description}
                onChange={(e) => setNewRfp({...newRfp, description: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 h-24"
                required
              />
              <input
                type="number"
                placeholder="Budget (SAR)"
                value={newRfp.budget}
                onChange={(e) => setNewRfp({...newRfp, budget: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
              <input
                type="datetime-local"
                value={newRfp.deadline}
                onChange={(e) => setNewRfp({...newRfp, deadline: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
              <input
                type="text"
                placeholder="Categories (comma-separated)"
                value={newRfp.categories}
                onChange={(e) => setNewRfp({...newRfp, categories: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <textarea
                placeholder="Scope of Work"
                value={newRfp.scope_of_work}
                onChange={(e) => setNewRfp({...newRfp, scope_of_work: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 h-32"
                required
              />
              <div className="flex space-x-4">
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
                >
                  Create RFP
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="grid gap-6">
          {rfps.map(rfp => (
            <div key={rfp.id} className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{rfp.title}</h3>
                  <p className="text-gray-600 mt-1">{rfp.description}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  rfp.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {rfp.status}
                </span>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <p className="text-sm text-gray-600">Budget</p>
                  <p className="font-semibold">{rfp.budget?.toLocaleString()} SAR</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Deadline</p>
                  <p className="font-semibold">{new Date(rfp.deadline).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Approval Level</p>
                  <p className="font-semibold capitalize">{rfp.approval_level?.replace('_', ' ')}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Categories</p>
                  <p className="font-semibold">{rfp.categories?.join(', ')}</p>
                </div>
              </div>
              
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">Scope of Work</p>
                <p className="text-gray-800">{rfp.scope_of_work}</p>
              </div>

              {user.user_type === 'vendor' && user.is_approved && (
                <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                  Submit Proposal
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const ProposalManagement = () => {
  const { user } = useAuth();
  const [proposals, setProposals] = useState([]);
  const [rfps, setRfps] = useState([]);
  const [showSubmitForm, setShowSubmitForm] = useState(false);
  const [selectedRfp, setSelectedRfp] = useState('');
  const [technicalFile, setTechnicalFile] = useState(null);
  const [commercialFile, setCommercialFile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProposals();
    if (user.user_type === 'vendor') {
      fetchRfps();
    }
  }, []);

  const fetchProposals = async () => {
    try {
      // Check if using demo token
      const token = localStorage.getItem('token');
      if (token && token.startsWith('demo-token-')) {
        // Return demo proposals
        const demoProposals = [
          {
            id: 'demo-proposal-1',
            rfp_id: 'demo-rfp-1',
            vendor_id: 'demo-vendor-1',
            vendor_company: 'TechSolutions Saudi Arabia',
            technical_document: 'demo-tech-doc',
            commercial_document: 'demo-commercial-doc',
            submitted_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            status: 'evaluated',
            ai_score: 87.5,
            ai_evaluation: {
              commercial_score: 90,
              technical_score: 82,
              overall_score: 87.5,
              strengths: [
                'Competitive pricing with excellent value proposition',
                'Strong technical expertise in cloud infrastructure',
                'Proven track record with similar enterprise projects'
              ],
              weaknesses: [
                'Limited experience with specific AWS advanced services',
                'Timeline could be more aggressive',
                'Documentation could be more detailed'
              ],
              recommendation: 'Highly Recommended',
              detailed_analysis: 'This proposal demonstrates exceptional commercial value with competitive pricing and comprehensive service offerings. The technical approach is solid with clear migration strategies and security considerations. The vendor shows strong capability in enterprise cloud transformations.'
            }
          },
          {
            id: 'demo-proposal-2',
            rfp_id: 'demo-rfp-2',
            vendor_id: 'demo-vendor-2',
            vendor_company: 'AI Innovations Inc.',
            technical_document: 'demo-tech-doc-2',
            commercial_document: 'demo-commercial-doc-2',
            submitted_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
            status: 'submitted',
            ai_score: null,
            ai_evaluation: null
          },
          {
            id: 'demo-proposal-3',
            rfp_id: 'demo-rfp-3',
            vendor_id: 'demo-vendor-3',
            vendor_company: 'SecureGuard Solutions',
            technical_document: 'demo-tech-doc-3',
            commercial_document: 'demo-commercial-doc-3',
            submitted_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
            status: 'evaluated',
            ai_score: 76.2,
            ai_evaluation: {
              commercial_score: 75,
              technical_score: 78,
              overall_score: 76.2,
              strengths: [
                'Comprehensive security audit methodology',
                'Strong compliance expertise',
                'Good value for comprehensive services'
              ],
              weaknesses: [
                'Higher pricing compared to competitors',
                'Limited automation tools mentioned',
                'Implementation timeline seems extended'
              ],
              recommendation: 'Recommended',
              detailed_analysis: 'Solid proposal with good technical approach to cybersecurity. The vendor demonstrates strong compliance knowledge and audit capabilities. Pricing is on the higher side but justified by comprehensive service offerings.'
            }
          }
        ];
        
        // Filter based on user type
        if (user.user_type === 'vendor') {
          setProposals(demoProposals.slice(0, 2)); // Show fewer for vendor view
        } else {
          setProposals(demoProposals);
        }
        setLoading(false);
        return;
      }
      
      const response = await axios.get(`${API}/proposals`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setProposals(response.data);
    } catch (error) {
      console.error('Error fetching proposals:', error);
      // Fallback to demo data
      setProposals([]);
    }
    setLoading(false);
  };

  const fetchRfps = async () => {
    try {
      const response = await axios.get(`${API}/rfps`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setRfps(response.data.filter(rfp => rfp.status === 'active'));
    } catch (error) {
      console.error('Error fetching RFPs:', error);
    }
  };

  const submitProposal = async (e) => {
    e.preventDefault();
    if (!user.is_approved) {
      alert('Your account is not yet approved');
      return;
    }

    const formData = new FormData();
    formData.append('rfp_id', selectedRfp);
    if (technicalFile) formData.append('technical_file', technicalFile);
    if (commercialFile) formData.append('commercial_file', commercialFile);

    try {
      await axios.post(`${API}/proposals`, formData, {
        headers: { 
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      
      setShowSubmitForm(false);
      setSelectedRfp('');
      setTechnicalFile(null);
      setCommercialFile(null);
      fetchProposals();
    } catch (error) {
      console.error('Error submitting proposal:', error);
      alert('Error submitting proposal');
    }
  };

  const evaluateProposal = async (proposalId) => {
    try {
      await axios.post(`${API}/proposals/${proposalId}/evaluate`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      fetchProposals();
      alert('Proposal evaluated successfully!');
    } catch (error) {
      console.error('Error evaluating proposal:', error);
      alert('Error evaluating proposal');
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">
            {user.user_type === 'vendor' ? 'My Proposals' : 'Proposals Inbox'}
          </h1>
          {user.user_type === 'vendor' && user.is_approved && (
            <button
              onClick={() => setShowSubmitForm(true)}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors shadow-lg"
            >
              + Submit New Proposal
            </button>
          )}
        </div>

        {showSubmitForm && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <h2 className="text-xl font-bold mb-4">Submit New Proposal</h2>
            <form onSubmit={submitProposal} className="space-y-4">
              <select
                value={selectedRfp}
                onChange={(e) => setSelectedRfp(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select RFP</option>
                {rfps.map(rfp => (
                  <option key={rfp.id} value={rfp.id}>
                    {rfp.title} - {rfp.budget?.toLocaleString()} SAR
                  </option>
                ))}
              </select>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Technical Document (Optional)
                </label>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => setTechnicalFile(e.target.files[0])}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Commercial Document (Optional)
                </label>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.xls,.xlsx"
                  onChange={(e) => setCommercialFile(e.target.files[0])}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div className="flex space-x-4">
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
                >
                  Submit Proposal
                </button>
                <button
                  type="button"
                  onClick={() => setShowSubmitForm(false)}
                  className="bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="grid gap-6">
          {proposals.map(proposal => (
            <div key={proposal.id} className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    Proposal for RFP: {proposal.rfp_id}
                  </h3>
                  <p className="text-gray-600">Company: {proposal.vendor_company}</p>
                  <p className="text-gray-600">
                    Submitted: {new Date(proposal.submitted_at).toLocaleDateString()}
                  </p>
                </div>
                
                <div className="text-right">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    proposal.status === 'submitted' ? 'bg-yellow-100 text-yellow-800' :
                    proposal.status === 'evaluated' ? 'bg-blue-100 text-blue-800' :
                    proposal.status === 'awarded' ? 'bg-green-100 text-green-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {proposal.status}
                  </span>
                  
                  {proposal.ai_score && (
                    <div className="mt-2">
                      <p className="text-sm text-gray-600">AI Score</p>
                      <p className="text-lg font-bold text-blue-600">
                        {proposal.ai_score.toFixed(1)}/100
                      </p>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm text-gray-600">Technical Document</p>
                  <p className="font-medium">
                    {proposal.technical_document ? '✅ Uploaded' : '❌ Not uploaded'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Commercial Document</p>
                  <p className="font-medium">
                    {proposal.commercial_document ? '✅ Uploaded' : '❌ Not uploaded'}
                  </p>
                </div>
              </div>
              
              {proposal.ai_evaluation && (
                <div className="mt-4 p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
                  <h4 className="font-bold mb-3 text-lg flex items-center">
                    🧠 AI Evaluation Results
                  </h4>
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Commercial Score</p>
                      <p className="text-2xl font-bold text-blue-600">{proposal.ai_evaluation.commercial_score}/100</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Technical Score</p>
                      <p className="text-2xl font-bold text-green-600">{proposal.ai_evaluation.technical_score}/100</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Recommendation</p>
                      <p className="font-bold text-purple-600">{proposal.ai_evaluation.recommendation}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <p className="text-sm font-medium text-green-700 mb-2">✅ Strengths:</p>
                      <ul className="text-sm text-gray-700 space-y-1">
                        {proposal.ai_evaluation.strengths?.map((strength, idx) => (
                          <li key={idx} className="flex items-start">
                            <span className="text-green-500 mr-2">•</span>
                            {strength}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-red-700 mb-2">⚠️ Areas for Improvement:</p>
                      <ul className="text-sm text-gray-700 space-y-1">
                        {proposal.ai_evaluation.weaknesses?.map((weakness, idx) => (
                          <li key={idx} className="flex items-start">
                            <span className="text-red-500 mr-2">•</span>
                            {weakness}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {proposal.ai_evaluation.detailed_analysis && (
                    <div className="mt-4 p-4 bg-white rounded-lg">
                      <p className="text-sm font-medium text-gray-700 mb-2">📋 Detailed Analysis:</p>
                      <p className="text-sm text-gray-600">{proposal.ai_evaluation.detailed_analysis}</p>
                    </div>
                  )}
                </div>
              )}
              
              {user.user_type === 'admin' && proposal.status === 'submitted' && (
                <button
                  onClick={() => evaluateProposal(proposal.id)}
                  className="mt-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-300 shadow-lg flex items-center space-x-2"
                >
                  <span>🧠</span>
                  <span>Evaluate with AI</span>
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Main App Component
const MainApp = () => {
  const { user, loading } = useAuth();
  const [currentView, setCurrentView] = useState('landing');

  const renderView = () => {
    // If user is not logged in, show auth flows
    if (!user) {
      switch (currentView) {
        case 'vendor-signup':
          return <VendorSignupFlow onNavigate={setCurrentView} />;
        case 'vendor-signin':
          return <VendorSignin onNavigate={setCurrentView} />;
        case 'team-login':
          return <TeamLogin onNavigate={setCurrentView} />;
        default:
          return <LandingPage onNavigate={setCurrentView} />;
      }
    }

    // If user is logged in, show dashboard views
    switch (currentView) {
      case 'dashboard':
        return <Dashboard />;
      case 'rfps':
        return <RFPManagement />;
      case 'proposals':
        return <ProposalManagement />;
      case 'evaluation':
        return <ProposalManagement />;
      case 'contracts':
        return <div className="p-6"><h1 className="text-2xl font-bold">Contracts - Coming Soon</h1></div>;
      case 'vendors':
        return <div className="p-6"><h1 className="text-2xl font-bold">Vendor Directory - Coming Soon</h1></div>;
      default:
        return <Dashboard />;
    }
  };

  useEffect(() => {
    if (user) {
      setCurrentView('dashboard');
    } else {
      setCurrentView('landing');
    }
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {user && <Navbar onNavigate={setCurrentView} currentView={currentView} />}
      <main>
        {renderView()}
      </main>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}

export default App;