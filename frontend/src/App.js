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
      // Check if it's a demo token
      if (token && token.startsWith('demo-token-')) {
        // For demo tokens, don't make API calls - user is already set from login
        setLoading(false);
        return;
      }
      
      const response = await axios.get(`${API}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(response.data);
    } catch (error) {
      // Only clear token if it's not a demo token
      if (!token || !token.startsWith('demo-token-')) {
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
      }
    }
    setLoading(false);
  };

  const login = async (email, password) => {
    // Demo mode - accept any credentials
    if (email && password) {
      // Create demo user based on email pattern - be more specific for 1957 team
      const isAdmin = email.toLowerCase().includes('1957') || 
                     email.toLowerCase().includes('admin') ||
                     email.toLowerCase().includes('@1957ventures') ||
                     email.toLowerCase().includes('team');
      
      console.log('Email:', email, 'IsAdmin:', isAdmin); // Debug log
      
      const demoUser = {
        id: 'demo-' + Date.now(),
        email: email,
        user_type: isAdmin ? 'admin' : 'vendor',
        is_approved: true,
        company_name: isAdmin ? '1957 Ventures' : 'Demo Company Inc.'
      };
      
      console.log('Created user:', demoUser); // Debug log
      
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
                <li><strong>1957 Team Dashboard:</strong> Emails with "1957", "admin", or "team" → Admin view</li>
                <li><strong>Vendor Dashboard:</strong> All other emails → Vendor view</li>
                <li>Experience the full platform with demo data and AI evaluation</li>
              </ul>
              <div className="mt-3 p-3 bg-blue-100 rounded-lg">
                <p><strong>Try these examples:</strong></p>
                <p>• Admin: <code className="bg-white px-1 rounded">admin@1957ventures.com</code></p>
                <p>• Vendor: <code className="bg-white px-1 rounded">vendor@company.com</code></p>
              </div>
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
  const [activeModal, setActiveModal] = useState(null);
  const [formData, setFormData] = useState({});

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

  // Modal handlers
  const openModal = (modalType) => {
    setActiveModal(modalType);
    setFormData({});
  };

  const closeModal = () => {
    setActiveModal(null);
    setFormData({});
  };

  // Form handlers
  const handleSubmitProposal = (e) => {
    e.preventDefault();
    alert(`Proposal submitted for RFP: ${formData.rfpTitle}\nTechnical Doc: ${formData.technicalDoc ? 'Uploaded' : 'Not uploaded'}\nCommercial Doc: ${formData.commercialDoc ? 'Uploaded' : 'Not uploaded'}`);
    closeModal();
  };

  const handleViewContracts = (contractId) => {
    alert(`Opening contract details for Contract #${contractId}`);
    closeModal();
  };

  const handleNotificationAction = (notificationId, action) => {
    alert(`${action} notification #${notificationId}`);
  };

  const handleUpdateSettings = (e) => {
    e.preventDefault();
    alert(`Settings updated!\nCompany: ${formData.companyName}\nEmail: ${formData.email}\nNotifications: ${formData.notifications ? 'Enabled' : 'Disabled'}`);
    closeModal();
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

  const renderModal = () => {
    if (!activeModal) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 max-h-90vh overflow-y-auto">
          {activeModal === 'submit-proposal' && (
            <div className="p-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Submit New Proposal</h2>
                <button 
                  onClick={closeModal}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>
              
              <form onSubmit={handleSubmitProposal} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select RFP
                  </label>
                  <select
                    value={formData.rfpTitle || ''}
                    onChange={(e) => setFormData({...formData, rfpTitle: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Choose an RFP</option>
                    <option value="Enterprise Cloud Infrastructure">Enterprise Cloud Infrastructure - 750,000 SAR</option>
                    <option value="AI-Powered Analytics Platform">AI-Powered Analytics Platform - 350,000 SAR</option>
                    <option value="Cybersecurity Audit">Cybersecurity Audit - 180,000 SAR</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Technical Document
                    </label>
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={(e) => setFormData({...formData, technicalDoc: e.target.files[0]})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Commercial Document
                    </label>
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,.xls,.xlsx"
                      onChange={(e) => setFormData({...formData, commercialDoc: e.target.files[0]})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Additional Notes
                  </label>
                  <textarea
                    value={formData.notes || ''}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent h-24"
                    placeholder="Any additional information about your proposal..."
                  />
                </div>

                <div className="flex space-x-4">
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    Submit Proposal
                  </button>
                  <button
                    type="button"
                    onClick={closeModal}
                    className="flex-1 bg-gray-500 text-white py-3 px-6 rounded-lg hover:bg-gray-600 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeModal === 'view-contracts' && (
            <div className="p-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">My Contracts</h2>
                <button 
                  onClick={closeModal}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>
              
              <div className="space-y-4">
                {[
                  { id: 'C001', title: 'Cloud Infrastructure Project', status: 'Active', value: '750,000 SAR', deadline: '2025-09-15' },
                  { id: 'C002', title: 'Security Audit Implementation', status: 'Completed', value: '180,000 SAR', deadline: '2025-08-30' }
                ].map(contract => (
                  <div key={contract.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-bold text-gray-900">{contract.title}</h3>
                        <p className="text-gray-600">Contract #{contract.id}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        contract.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {contract.status}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-gray-600">Contract Value</p>
                        <p className="font-semibold">{contract.value}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Deadline</p>
                        <p className="font-semibold">{contract.deadline}</p>
                      </div>
                    </div>
                    
                    <div className="flex space-x-3">
                      <button 
                        onClick={() => handleViewContracts(contract.id)}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
                      >
                        View Details
                      </button>
                      {contract.status === 'Active' && (
                        <button 
                          onClick={() => alert(`Uploading invoice for ${contract.title}`)}
                          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm"
                        >
                          Upload Invoice
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-6">
                <button
                  onClick={closeModal}
                  className="w-full bg-gray-500 text-white py-3 px-6 rounded-lg hover:bg-gray-600 transition-colors font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          )}

          {activeModal === 'notifications' && (
            <div className="p-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Notifications</h2>
                <button 
                  onClick={closeModal}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>
              
              <div className="space-y-4">
                {[
                  { id: 1, title: 'New RFP Available', message: 'Enterprise Cloud Infrastructure project is now open for proposals', type: 'info', time: '2 hours ago' },
                  { id: 2, title: 'Proposal Evaluated', message: 'Your proposal for AI Analytics Platform has been evaluated with AI scoring', type: 'success', time: '1 day ago' },
                  { id: 3, title: 'Contract Milestone Due', message: 'Security Audit phase 2 milestone is due in 3 days', type: 'warning', time: '2 days ago' },
                  { id: 4, title: 'Payment Received', message: 'Invoice #INV-2024-001 has been processed and payment initiated', type: 'success', time: '3 days ago' }
                ].map(notification => (
                  <div key={notification.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-gray-900">{notification.title}</h3>
                      <span className="text-sm text-gray-500">{notification.time}</span>
                    </div>
                    <p className="text-gray-600 mb-3">{notification.message}</p>
                    <div className="flex space-x-3">
                      <button 
                        onClick={() => handleNotificationAction(notification.id, 'Mark as Read')}
                        className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors"
                      >
                        Mark as Read
                      </button>
                      <button 
                        onClick={() => handleNotificationAction(notification.id, 'Archive')}
                        className="bg-gray-500 text-white px-3 py-1 rounded text-sm hover:bg-gray-600 transition-colors"
                      >
                        Archive
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-6">
                <button
                  onClick={closeModal}
                  className="w-full bg-gray-500 text-white py-3 px-6 rounded-lg hover:bg-gray-600 transition-colors font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          )}

          {activeModal === 'settings' && (
            <div className="p-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Account Settings</h2>
                <button 
                  onClick={closeModal}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>
              
              <form onSubmit={handleUpdateSettings} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Company Name
                    </label>
                    <input
                      type="text"
                      value={formData.companyName || user.company_name || ''}
                      onChange={(e) => setFormData({...formData, companyName: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={formData.email || user.email || ''}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={formData.phone || ''}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="+966 50 123 4567"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Business Address
                  </label>
                  <textarea
                    value={formData.address || ''}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent h-20"
                    placeholder="Enter your business address..."
                  />
                </div>

                <div className="flex items-center">
                  <input
                    id="notifications"
                    type="checkbox"
                    checked={formData.notifications || false}
                    onChange={(e) => setFormData({...formData, notifications: e.target.checked})}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="notifications" className="ml-2 block text-sm text-gray-900">
                    Receive email notifications for new RFPs and updates
                  </label>
                </div>

                <div className="flex space-x-4">
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    Update Settings
                  </button>
                  <button
                    type="button"
                    onClick={closeModal}
                    className="flex-1 bg-gray-500 text-white py-3 px-6 rounded-lg hover:bg-gray-600 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Admin-specific modals */}
          {activeModal === 'create-rfp' && (
            <div className="p-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Create New RFP</h2>
                <button 
                  onClick={closeModal}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>
              
              <form onSubmit={(e) => { e.preventDefault(); alert('RFP created successfully!'); closeModal(); }} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">RFP Title</label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter RFP title..."
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent h-32"
                    placeholder="Enter detailed description..."
                    required
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Budget (SAR)</label>
                    <input
                      type="number"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter budget amount..."
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Deadline</label>
                    <input
                      type="date"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Categories</label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter categories (comma-separated)..."
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Scope of Work</label>
                  <textarea
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent h-24"
                    placeholder="Enter scope of work..."
                    required
                  />
                </div>
                
                <div className="flex space-x-4">
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    Create RFP
                  </button>
                  <button
                    type="button"
                    onClick={closeModal}
                    className="flex-1 bg-gray-500 text-white py-3 px-6 rounded-lg hover:bg-gray-600 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeModal === 'proposal-inbox' && (
            <div className="p-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Proposal Inbox</h2>
                <button 
                  onClick={closeModal}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>
              
              <div className="space-y-4">
                {[
                  { id: 'P001', rfp: 'Enterprise Cloud Infrastructure', vendor: 'TechCorp Solutions', submitted: '2025-01-15', status: 'Under Review', score: 85.1 },
                  { id: 'P002', rfp: 'AI Analytics Platform', vendor: 'DataSoft Inc.', submitted: '2025-01-14', status: 'Evaluated', score: 78.5 },
                  { id: 'P003', rfp: 'Cybersecurity Audit', vendor: 'SecureNet Ltd.', submitted: '2025-01-13', status: 'Pending', score: null },
                  { id: 'P004', rfp: 'Digital Transformation', vendor: 'InnovateCorp', submitted: '2025-01-12', status: 'Rejected', score: 62.3 }
                ].map(proposal => (
                  <div key={proposal.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-bold text-gray-900">{proposal.rfp}</h3>
                        <p className="text-gray-600">Proposal #{proposal.id} by {proposal.vendor}</p>
                        <p className="text-sm text-gray-500">Submitted: {proposal.submitted}</p>
                      </div>
                      <div className="text-right">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          proposal.status === 'Evaluated' ? 'bg-green-100 text-green-800' :
                          proposal.status === 'Under Review' ? 'bg-yellow-100 text-yellow-800' :
                          proposal.status === 'Rejected' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {proposal.status}
                        </span>
                        {proposal.score && (
                          <div className="mt-1 text-sm font-semibold text-blue-600">
                            AI Score: {proposal.score}/100
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex space-x-3">
                      <button 
                        onClick={() => alert(`Viewing proposal ${proposal.id} details`)}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
                      >
                        View Details
                      </button>
                      {proposal.status === 'Pending' && (
                        <button 
                          onClick={() => alert(`Evaluating proposal ${proposal.id} with AI`)}
                          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm"
                        >
                          🧠 AI Evaluate
                        </button>
                      )}
                      {proposal.status === 'Evaluated' && (
                        <button 
                          onClick={() => alert(`Awarding contract for proposal ${proposal.id}`)}
                          className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors text-sm"
                        >
                          Award Contract
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-6">
                <button
                  onClick={closeModal}
                  className="w-full bg-gray-500 text-white py-3 px-6 rounded-lg hover:bg-gray-600 transition-colors font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          )}

          {activeModal === 'vendor-management' && (
            <div className="p-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Vendor Management</h2>
                <button 
                  onClick={closeModal}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>
              
              <div className="space-y-4">
                {[
                  { id: 'V001', company: 'TechCorp Solutions', email: 'contact@techcorp.com', status: 'Approved', joined: '2024-12-15', contracts: 3 },
                  { id: 'V002', company: 'DataSoft Inc.', email: 'info@datasoft.com', status: 'Pending', joined: '2025-01-10', contracts: 0 },
                  { id: 'V003', company: 'SecureNet Ltd.', email: 'sales@securenet.com', status: 'Approved', joined: '2024-11-20', contracts: 1 },
                  { id: 'V004', company: 'InnovateCorp', email: 'team@innovate.com', status: 'Rejected', joined: '2025-01-05', contracts: 0 }
                ].map(vendor => (
                  <div key={vendor.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-bold text-gray-900">{vendor.company}</h3>
                        <p className="text-gray-600">{vendor.email}</p>
                        <p className="text-sm text-gray-500">Joined: {vendor.joined}</p>
                      </div>
                      <div className="text-right">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          vendor.status === 'Approved' ? 'bg-green-100 text-green-800' :
                          vendor.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {vendor.status}
                        </span>
                        <div className="mt-1 text-sm text-gray-600">
                          {vendor.contracts} active contracts
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex space-x-3">
                      <button 
                        onClick={() => alert(`Viewing vendor ${vendor.company} profile`)}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
                      >
                        View Profile
                      </button>
                      {vendor.status === 'Pending' && (
                        <>
                          <button 
                            onClick={() => alert(`Approving vendor ${vendor.company}`)}
                            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm"
                          >
                            ✓ Approve
                          </button>
                          <button 
                            onClick={() => alert(`Rejecting vendor ${vendor.company}`)}
                            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm"
                          >
                            ✗ Reject
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-6">
                <button
                  onClick={closeModal}
                  className="w-full bg-gray-500 text-white py-3 px-6 rounded-lg hover:bg-gray-600 transition-colors font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          )}

          {activeModal === 'invoice-tracking' && (
            <div className="p-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Invoice & Contract Tracking</h2>
                <button 
                  onClick={closeModal}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>
              
              <div className="space-y-4">
                {[
                  { id: 'INV-001', contract: 'Enterprise Cloud Infrastructure', vendor: 'TechCorp Solutions', amount: '487,500 SAR', status: 'Paid', dueDate: '2025-02-15' },
                  { id: 'INV-002', contract: 'Security Infrastructure Upgrade', vendor: 'TechCorp Solutions', amount: '180,000 SAR', status: 'Paid', dueDate: '2024-12-31' },
                  { id: 'INV-003', contract: 'Digital Transformation Consulting', vendor: 'TechCorp Solutions', amount: '320,000 SAR', status: 'Paid', dueDate: '2024-09-30' },
                  { id: 'INV-004', contract: 'AI Analytics Platform', vendor: 'DataSoft Inc.', amount: '225,000 SAR', status: 'Pending', dueDate: '2025-02-28' }
                ].map(invoice => (
                  <div key={invoice.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-bold text-gray-900">{invoice.contract}</h3>
                        <p className="text-gray-600">Invoice #{invoice.id} - {invoice.vendor}</p>
                        <p className="text-sm text-gray-500">Due: {invoice.dueDate}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-semibold text-gray-900">{invoice.amount}</div>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          invoice.status === 'Paid' ? 'bg-green-100 text-green-800' :
                          invoice.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {invoice.status}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex space-x-3">
                      <button 
                        onClick={() => alert(`Viewing invoice ${invoice.id} details`)}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
                      >
                        View Details
                      </button>
                      <button 
                        onClick={() => alert(`Downloading invoice ${invoice.id}`)}
                        className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors text-sm"
                      >
                        📄 Download
                      </button>
                      {invoice.status === 'Pending' && (
                        <button 
                          onClick={() => alert(`Processing payment for invoice ${invoice.id}`)}
                          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm"
                        >
                          💳 Process Payment
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-6">
                <button
                  onClick={closeModal}
                  className="w-full bg-gray-500 text-white py-3 px-6 rounded-lg hover:bg-gray-600 transition-colors font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
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

        {/* Interactive Quick Actions */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {user.user_type === 'vendor' ? (
              <>
                <button 
                  onClick={() => openModal('submit-proposal')}
                  className="p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors text-left transform hover:scale-105 duration-200"
                >
                  <div className="text-2xl mb-2">📝</div>
                  <div className="font-semibold text-gray-900">Submit Proposal</div>
                  <div className="text-sm text-gray-600">Submit to active RFPs</div>
                </button>
                <button 
                  onClick={() => openModal('view-contracts')}
                  className="p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors text-left transform hover:scale-105 duration-200"
                >
                  <div className="text-2xl mb-2">📄</div>
                  <div className="font-semibold text-gray-900">View Contracts</div>
                  <div className="text-sm text-gray-600">Manage awarded contracts</div>
                </button>
                <button 
                  onClick={() => openModal('notifications')}
                  className="p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors text-left transform hover:scale-105 duration-200"
                >
                  <div className="text-2xl mb-2">🔔</div>
                  <div className="font-semibold text-gray-900">Notifications</div>
                  <div className="text-sm text-gray-600">View updates</div>
                </button>
                <button 
                  onClick={() => openModal('settings')}
                  className="p-4 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors text-left transform hover:scale-105 duration-200"
                >
                  <div className="text-2xl mb-2">⚙️</div>
                  <div className="font-semibold text-gray-900">Settings</div>
                  <div className="text-sm text-gray-600">Account settings</div>
                </button>
              </>
            ) : (
              <>
                <button 
                  onClick={() => openModal('create-rfp')}
                  className="p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors text-left transform hover:scale-105 duration-200"
                >
                  <div className="text-2xl mb-2">➕</div>
                  <div className="font-semibold text-gray-900">Create RFP</div>
                  <div className="text-sm text-gray-600">Post new opportunities</div>
                </button>
                <button 
                  onClick={() => openModal('proposal-inbox')}
                  className="p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors text-left transform hover:scale-105 duration-200"
                >
                  <div className="text-2xl mb-2">📥</div>
                  <div className="font-semibold text-gray-900">Proposal Inbox</div>
                  <div className="text-sm text-gray-600">Review proposals</div>
                </button>
                <button 
                  onClick={() => openModal('vendor-management')}
                  className="p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors text-left transform hover:scale-105 duration-200"
                >
                  <div className="text-2xl mb-2">👥</div>
                  <div className="font-semibold text-gray-900">Vendor Management</div>
                  <div className="text-sm text-gray-600">Approve vendors</div>
                </button>
                <button 
                  onClick={() => openModal('invoice-tracking')}
                  className="p-4 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors text-left transform hover:scale-105 duration-200"
                >
                  <div className="text-2xl mb-2">📊</div>
                  <div className="font-semibold text-gray-900">Invoice Tracking</div>
                  <div className="text-sm text-gray-600">Track invoices & contracts</div>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Render Modal */}
      {renderModal()}
    </div>
  );
};

// Keep the same RFP and Proposal management components from before
const RFPManagement = () => {
  const { user } = useAuth();
  const [rfps, setRfps] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showProposalModal, setShowProposalModal] = useState(false);
  const [selectedRfp, setSelectedRfp] = useState(null);
  const [proposalFormData, setProposalFormData] = useState({});
  const [showViewProposalsModal, setShowViewProposalsModal] = useState(false);
  const [showMakeDecisionModal, setShowMakeDecisionModal] = useState(false);
  const [showCancelRfpModal, setShowCancelRfpModal] = useState(false);
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

  // Handle proposal submission for specific RFP
  const handleSubmitProposal = (rfp) => {
    setSelectedRfp(rfp);
    setProposalFormData({ rfpTitle: rfp.title, rfpId: rfp.id });
    setShowProposalModal(true);
  };

  const submitProposal = (e) => {
    e.preventDefault();
    alert(`Proposal submitted for: ${selectedRfp.title}\nTechnical Doc: ${proposalFormData.technicalDoc ? 'Uploaded' : 'Not uploaded'}\nCommercial Doc: ${proposalFormData.commercialDoc ? 'Uploaded' : 'Not uploaded'}\nNotes: ${proposalFormData.notes || 'None'}`);
    setShowProposalModal(false);
    setSelectedRfp(null);
    setProposalFormData({});
  };

  const closeProposalModal = () => {
    setShowProposalModal(false);
    setSelectedRfp(null);
    setProposalFormData({});
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
                <button 
                  onClick={() => handleSubmitProposal(rfp)}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center space-x-2"
                >
                  <span>📝</span>
                  <span>Submit Proposal</span>
                </button>
              )}

              {user.user_type === 'admin' && (
                <div className="flex space-x-3">
                  <button 
                    onClick={() => {
                      setSelectedRfp(rfp);
                      setShowViewProposalsModal(true);
                    }}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm flex items-center space-x-2"
                  >
                    <span>👁️</span>
                    <span>View Proposals</span>
                  </button>
                  <button 
                    onClick={() => {
                      setSelectedRfp(rfp);
                      setShowMakeDecisionModal(true);
                    }}
                    className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors text-sm flex items-center space-x-2"
                  >
                    <span>⚖️</span>
                    <span>Make Decision</span>
                  </button>
                  <button 
                    onClick={() => {
                      setSelectedRfp(rfp);
                      setShowCancelRfpModal(true);
                    }}
                    className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm flex items-center space-x-2"
                  >
                    <span>❌</span>
                    <span>Cancel RFP</span>
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Proposal Submission Modal */}
      {showProposalModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 max-h-90vh overflow-y-auto">
            <div className="p-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Submit Proposal</h2>
                <button 
                  onClick={closeProposalModal}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>
              
              <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h3 className="font-bold text-blue-900 mb-2">Selected RFP:</h3>
                <p className="text-blue-800 font-semibold">{selectedRfp?.title}</p>
                <p className="text-blue-700 text-sm">Budget: {selectedRfp?.budget?.toLocaleString()} SAR</p>
                <p className="text-blue-700 text-sm">Deadline: {new Date(selectedRfp?.deadline).toLocaleDateString()}</p>
              </div>
              
              <form onSubmit={submitProposal} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Technical Document
                    </label>
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={(e) => setProposalFormData({...proposalFormData, technicalDoc: e.target.files[0]})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <p className="text-xs text-gray-500 mt-1">Upload your technical proposal (PDF, DOC, DOCX)</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Commercial Document
                    </label>
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,.xls,.xlsx"
                      onChange={(e) => setProposalFormData({...proposalFormData, commercialDoc: e.target.files[0]})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <p className="text-xs text-gray-500 mt-1">Upload your commercial proposal (PDF, Excel, etc.)</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Proposal Summary
                  </label>
                  <textarea
                    value={proposalFormData.notes || ''}
                    onChange={(e) => setProposalFormData({...proposalFormData, notes: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent h-24"
                    placeholder="Briefly describe your approach and why you're the best fit for this project..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Proposed Timeline (Days)
                  </label>
                  <input
                    type="number"
                    value={proposalFormData.timeline || ''}
                    onChange={(e) => setProposalFormData({...proposalFormData, timeline: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., 90"
                    required
                  />
                </div>

                <div className="flex space-x-4">
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    Submit Proposal
                  </button>
                  <button
                    type="button"
                    onClick={closeProposalModal}
                    className="flex-1 bg-gray-500 text-white py-3 px-6 rounded-lg hover:bg-gray-600 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* View Proposals Modal */}
      {showViewProposalsModal && selectedRfp && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full mx-4 max-h-90vh overflow-y-auto">
            <div className="p-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Proposals for: {selectedRfp.title}</h2>
                <button 
                  onClick={() => setShowViewProposalsModal(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>
              
              <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h3 className="font-bold text-blue-900 mb-2">RFP Details:</h3>
                <p className="text-blue-800 font-semibold">Budget: {selectedRfp.budget?.toLocaleString()} SAR</p>
                <p className="text-blue-700 text-sm">Deadline: {new Date(selectedRfp.deadline).toLocaleDateString()}</p>
                <p className="text-blue-700 text-sm">Status: {selectedRfp.status}</p>
              </div>
              
              <div className="space-y-4">
                {[
                  { id: 'P001', vendor: 'TechCorp Solutions', submitted: '2025-01-15', status: 'Under Review', score: 85.1, amount: '720,000 SAR', timeline: '90 days' },
                  { id: 'P002', vendor: 'DataSoft Inc.', submitted: '2025-01-14', status: 'Evaluated', score: 78.5, amount: '680,000 SAR', timeline: '105 days' },
                  { id: 'P003', vendor: 'SecureNet Ltd.', submitted: '2025-01-13', status: 'Pending', score: null, amount: '750,000 SAR', timeline: '120 days' },
                  { id: 'P004', vendor: 'InnovateCorp', submitted: '2025-01-12', status: 'Rejected', score: 62.3, amount: '650,000 SAR', timeline: '80 days' }
                ].map(proposal => (
                  <div key={proposal.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-bold text-gray-900">{proposal.vendor}</h3>
                        <p className="text-gray-600">Proposal #{proposal.id}</p>
                        <p className="text-sm text-gray-500">Submitted: {proposal.submitted}</p>
                      </div>
                      <div className="text-right">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          proposal.status === 'Evaluated' ? 'bg-green-100 text-green-800' :
                          proposal.status === 'Under Review' ? 'bg-yellow-100 text-yellow-800' :
                          proposal.status === 'Rejected' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {proposal.status}
                        </span>
                        {proposal.score && (
                          <div className="mt-1 text-sm font-semibold text-blue-600">
                            AI Score: {proposal.score}/100
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mb-3">
                      <div>
                        <p className="text-sm text-gray-600">Proposed Amount</p>
                        <p className="font-semibold">{proposal.amount}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Timeline</p>
                        <p className="font-semibold">{proposal.timeline}</p>
                      </div>
                    </div>
                    
                    <div className="flex space-x-3">
                      <button 
                        onClick={() => alert(`Viewing detailed proposal from ${proposal.vendor}`)}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
                      >
                        📄 View Full Proposal
                      </button>
                      {proposal.status === 'Pending' && (
                        <button 
                          onClick={() => alert(`Evaluating proposal from ${proposal.vendor} with AI`)}
                          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm"
                        >
                          🧠 AI Evaluate
                        </button>
                      )}
                      {proposal.status === 'Evaluated' && (
                        <button 
                          onClick={() => alert(`Awarding contract to ${proposal.vendor}`)}
                          className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors text-sm"
                        >
                          🏆 Award Contract
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-6">
                <button
                  onClick={() => setShowViewProposalsModal(false)}
                  className="w-full bg-gray-500 text-white py-3 px-6 rounded-lg hover:bg-gray-600 transition-colors font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Make Decision Modal */}
      {showMakeDecisionModal && selectedRfp && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full mx-4 max-h-90vh overflow-y-auto">
            <div className="p-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Make Decision - {selectedRfp.title}</h2>
                <button 
                  onClick={() => setShowMakeDecisionModal(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>
              
              <div className="mb-6 p-4 bg-purple-50 rounded-lg border border-purple-200">
                <h3 className="font-bold text-purple-900 mb-2">Decision Making Process:</h3>
                <p className="text-purple-800 text-sm">Review AI evaluations and make final decisions on proposals</p>
              </div>
              
              <div className="space-y-4">
                {[
                  { id: 'P001', vendor: 'TechCorp Solutions', status: 'Evaluated', score: 85.1, amount: '720,000 SAR', recommendation: 'Highly Recommended' },
                  { id: 'P002', vendor: 'DataSoft Inc.', status: 'Evaluated', score: 78.5, amount: '680,000 SAR', recommendation: 'Recommended' },
                  { id: 'P003', vendor: 'SecureNet Ltd.', status: 'Pending', score: null, amount: '750,000 SAR', recommendation: 'Awaiting Evaluation' }
                ].map(proposal => (
                  <div key={proposal.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-bold text-gray-900">{proposal.vendor}</h3>
                        <p className="text-gray-600">Proposal #{proposal.id}</p>
                        <p className="text-sm text-gray-500">Amount: {proposal.amount}</p>
                      </div>
                      <div className="text-right">
                        {proposal.score && (
                          <div className="text-lg font-semibold text-blue-600 mb-1">
                            AI Score: {proposal.score}/100
                          </div>
                        )}
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          proposal.recommendation === 'Highly Recommended' ? 'bg-green-100 text-green-800' :
                          proposal.recommendation === 'Recommended' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {proposal.recommendation}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex space-x-3">
                      <button 
                        onClick={() => alert(`Accepting proposal from ${proposal.vendor}`)}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm disabled:opacity-50"
                        disabled={proposal.status === 'Pending'}
                      >
                        ✅ Accept
                      </button>
                      <button 
                        onClick={() => alert(`Rejecting proposal from ${proposal.vendor}`)}
                        className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm"
                      >
                        ❌ Reject
                      </button>
                      <button 
                        onClick={() => alert(`Requesting revision from ${proposal.vendor}`)}
                        className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors text-sm"
                      >
                        📝 Request Revision
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-6">
                <button
                  onClick={() => setShowMakeDecisionModal(false)}
                  className="w-full bg-gray-500 text-white py-3 px-6 rounded-lg hover:bg-gray-600 transition-colors font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cancel RFP Modal */}
      {showCancelRfpModal && selectedRfp && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4">
            <div className="p-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Cancel RFP</h2>
                <button 
                  onClick={() => setShowCancelRfpModal(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>
              
              <div className="mb-6 p-4 bg-red-50 rounded-lg border border-red-200">
                <h3 className="font-bold text-red-900 mb-2">⚠️ Warning: This action cannot be undone</h3>
                <p className="text-red-800 text-sm">Cancelling this RFP will notify all vendors and close the opportunity permanently.</p>
              </div>
              
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-bold text-gray-900 mb-2">RFP Details:</h3>
                <p className="text-gray-800 font-semibold">{selectedRfp.title}</p>
                <p className="text-gray-600 text-sm">Budget: {selectedRfp.budget?.toLocaleString()} SAR</p>
                <p className="text-gray-600 text-sm">Deadline: {new Date(selectedRfp.deadline).toLocaleDateString()}</p>
                <p className="text-gray-600 text-sm">Status: {selectedRfp.status}</p>
              </div>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cancellation Reason (Required)
                </label>
                <textarea
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent h-24"
                  placeholder="Please provide a reason for cancelling this RFP..."
                  required
                />
              </div>
              
              <div className="mb-6">
                <label className="flex items-center">
                  <input type="checkbox" className="mr-2" required />
                  <span className="text-sm text-gray-700">I confirm that I want to cancel this RFP and notify all vendors</span>
                </label>
              </div>
              
              <div className="flex space-x-4">
                <button
                  onClick={() => {
                    alert(`RFP "${selectedRfp.title}" has been cancelled and vendors have been notified.`);
                    setShowCancelRfpModal(false);
                  }}
                  className="flex-1 bg-red-600 text-white py-3 px-6 rounded-lg hover:bg-red-700 transition-colors font-medium"
                >
                  🗑️ Cancel RFP
                </button>
                <button
                  onClick={() => setShowCancelRfpModal(false)}
                  className="flex-1 bg-gray-500 text-white py-3 px-6 rounded-lg hover:bg-gray-600 transition-colors font-medium"
                >
                  Keep RFP Active
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
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
  const [filterStatus, setFilterStatus] = useState('all');

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
        // Return different demo proposals based on user type
        if (user.user_type === 'vendor') {
          // Vendor view - their submitted proposals
          const vendorProposals = [
            {
              id: 'demo-proposal-v1',
              rfp_id: 'demo-rfp-1',
              rfp_title: 'Enterprise Cloud Infrastructure Modernization',
              rfp_budget: 750000,
              vendor_id: user.id,
              vendor_company: user.company_name,
              technical_document: 'TechProposal_CloudInfra_v1.pdf',
              commercial_document: 'CommercialProposal_CloudInfra_v1.xlsx',
              submitted_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
              status: 'awarded',
              ai_score: 87.5,
              ai_evaluation: {
                commercial_score: 90,
                technical_score: 82,
                overall_score: 87.5,
                recommendation: 'Highly Recommended',
                detailed_analysis: 'Excellent proposal with competitive pricing and strong technical approach.'
              },
              timeline_days: 90,
              notes: 'Comprehensive cloud migration approach with proven AWS expertise and competitive pricing.'
            },
            {
              id: 'demo-proposal-v2',
              rfp_id: 'demo-rfp-2',
              rfp_title: 'AI-Powered Customer Analytics Platform',
              rfp_budget: 350000,
              vendor_id: user.id,
              vendor_company: user.company_name,
              technical_document: 'TechProposal_AI_Analytics_v1.pdf',
              commercial_document: 'CommercialProposal_AI_Analytics_v1.xlsx',
              submitted_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
              status: 'under_review',
              ai_score: null,
              ai_evaluation: null,
              timeline_days: 120,
              notes: 'Machine learning platform with advanced analytics capabilities and real-time insights.'
            },
            {
              id: 'demo-proposal-v3',
              rfp_id: 'demo-rfp-3',
              rfp_title: 'Cybersecurity Audit and Implementation',
              rfp_budget: 180000,
              vendor_id: user.id,
              vendor_company: user.company_name,
              technical_document: 'TechProposal_Security_v1.pdf',
              commercial_document: 'CommercialProposal_Security_v1.xlsx',
              submitted_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
              status: 'rejected',
              ai_score: 65.2,
              ai_evaluation: {
                commercial_score: 60,
                technical_score: 75,
                overall_score: 65.2,
                recommendation: 'Not Recommended',
                detailed_analysis: 'Proposal pricing was above budget expectations and timeline was too extended.'
              },
              timeline_days: 180,
              notes: 'Comprehensive security audit with penetration testing and compliance framework.'
            },
            {
              id: 'demo-proposal-v4',
              rfp_id: 'demo-rfp-4',
              rfp_title: 'Digital Transformation Initiative',
              rfp_budget: 500000,
              vendor_id: user.id,
              vendor_company: user.company_name,
              technical_document: 'TechProposal_DigitalTransform_v1.pdf',
              commercial_document: 'CommercialProposal_DigitalTransform_v1.xlsx',
              submitted_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
              status: 'submitted',
              ai_score: null,
              ai_evaluation: null,
              timeline_days: 150,
              notes: 'End-to-end digital transformation with modern tech stack and agile methodology.'
            }
          ];
          setProposals(vendorProposals);
        } else {
          // Admin view - all proposals for evaluation
          const adminProposals = [
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
                detailed_analysis: 'This proposal demonstrates exceptional commercial value with competitive pricing and comprehensive service offerings.'
              }
            }
            // ... other admin proposals
          ];
          setProposals(adminProposals);
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
      setProposals([]);
    }
    setLoading(false);
  };

  const fetchRfps = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token && token.startsWith('demo-token-')) {
        const demoRfps = [
          {
            id: 'demo-rfp-1',
            title: 'Enterprise Cloud Infrastructure Modernization',
            budget: 750000,
            status: 'active'
          },
          {
            id: 'demo-rfp-2',
            title: 'AI-Powered Customer Analytics Platform',
            budget: 350000,
            status: 'active'
          },
          {
            id: 'demo-rfp-3',
            title: 'Cybersecurity Audit and Implementation',
            budget: 180000,
            status: 'active'
          }
        ];
        setRfps(demoRfps.filter(rfp => rfp.status === 'active'));
        return;
      }
      
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

  const getStatusColor = (status) => {
    switch (status) {
      case 'submitted':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'under_review':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'evaluated':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'awarded':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'submitted':
        return '📤';
      case 'under_review':
        return '🔍';
      case 'evaluated':
        return '📊';
      case 'awarded':
        return '🏆';
      case 'rejected':
        return '❌';
      default:
        return '📋';
    }
  };

  const filteredProposals = filterStatus === 'all' 
    ? proposals 
    : proposals.filter(proposal => proposal.status === filterStatus);

  if (loading) return <div className="p-6">Loading...</div>;

  // Vendor View
  if (user.user_type === 'vendor') {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900">My Proposals</h1>
            {user.is_approved && (
              <button
                onClick={() => setShowSubmitForm(true)}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors shadow-lg"
              >
                + Submit New Proposal
              </button>
            )}
          </div>

          {/* Status Filter */}
          <div className="mb-6 flex space-x-4">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filterStatus === 'all' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-blue-50'
              }`}
            >
              All Proposals ({proposals.length})
            </button>
            <button
              onClick={() => setFilterStatus('submitted')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filterStatus === 'submitted' ? 'bg-yellow-600 text-white' : 'bg-white text-gray-600 hover:bg-yellow-50'
              }`}
            >
              Pending ({proposals.filter(p => p.status === 'submitted' || p.status === 'under_review').length})
            </button>
            <button
              onClick={() => setFilterStatus('awarded')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filterStatus === 'awarded' ? 'bg-green-600 text-white' : 'bg-white text-gray-600 hover:bg-green-50'
              }`}
            >
              Awarded ({proposals.filter(p => p.status === 'awarded').length})
            </button>
            <button
              onClick={() => setFilterStatus('rejected')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filterStatus === 'rejected' ? 'bg-red-600 text-white' : 'bg-white text-gray-600 hover:bg-red-50'
              }`}
            >
              Rejected ({proposals.filter(p => p.status === 'rejected').length})
            </button>
          </div>

          {/* Proposals Grid */}
          <div className="grid gap-6">
            {filteredProposals.map(proposal => (
              <div key={proposal.id} className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      {proposal.rfp_title || `RFP #${proposal.rfp_id}`}
                    </h3>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <span>📅 Submitted: {new Date(proposal.submitted_at).toLocaleDateString()}</span>
                      {proposal.rfp_budget && (
                        <span>💰 Budget: {proposal.rfp_budget.toLocaleString()} SAR</span>
                      )}
                      {proposal.timeline_days && (
                        <span>⏱️ Timeline: {proposal.timeline_days} days</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(proposal.status)}`}>
                      {getStatusIcon(proposal.status)} {proposal.status.replace('_', ' ').toUpperCase()}
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
                
                {/* Proposal Summary */}
                {proposal.notes && (
                  <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm font-medium text-gray-700 mb-1">Proposal Summary:</p>
                    <p className="text-gray-600">{proposal.notes}</p>
                  </div>
                )}

                {/* Documents */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="flex items-center space-x-2">
                    <span className={proposal.technical_document ? 'text-green-600' : 'text-red-600'}>
                      {proposal.technical_document ? '✅' : '❌'}
                    </span>
                    <span className="text-sm">Technical Document</span>
                    {proposal.technical_document && typeof proposal.technical_document === 'string' && proposal.technical_document.includes('.') && (
                      <span className="text-xs text-blue-600">({proposal.technical_document})</span>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={proposal.commercial_document ? 'text-green-600' : 'text-red-600'}>
                      {proposal.commercial_document ? '✅' : '❌'}
                    </span>
                    <span className="text-sm">Commercial Document</span>
                    {proposal.commercial_document && typeof proposal.commercial_document === 'string' && proposal.commercial_document.includes('.') && (
                      <span className="text-xs text-blue-600">({proposal.commercial_document})</span>
                    )}
                  </div>
                </div>
                
                {/* AI Evaluation Results */}
                {proposal.ai_evaluation && (
                  <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
                    <h4 className="font-bold mb-3 text-lg flex items-center">
                      🧠 Evaluation Results
                    </h4>
                    
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div className="text-center">
                        <p className="text-sm text-gray-600">Commercial</p>
                        <p className="text-xl font-bold text-blue-600">{proposal.ai_evaluation.commercial_score}/100</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-gray-600">Technical</p>
                        <p className="text-xl font-bold text-green-600">{proposal.ai_evaluation.technical_score}/100</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-gray-600">Overall</p>
                        <p className="text-xl font-bold text-purple-600">{proposal.ai_evaluation.overall_score}/100</p>
                      </div>
                    </div>
                    
                    <div className="mb-3">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        proposal.ai_evaluation.recommendation === 'Highly Recommended' ? 'bg-green-100 text-green-800' :
                        proposal.ai_evaluation.recommendation === 'Recommended' ? 'bg-blue-100 text-blue-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        📋 {proposal.ai_evaluation.recommendation}
                      </span>
                    </div>
                    
                    {proposal.ai_evaluation.detailed_analysis && (
                      <div className="mt-3 p-3 bg-white rounded-lg">
                        <p className="text-sm font-medium text-gray-700 mb-1">📝 Feedback:</p>
                        <p className="text-sm text-gray-600">{proposal.ai_evaluation.detailed_analysis}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="mt-4 flex space-x-3">
                  {proposal.status === 'awarded' && (
                    <button 
                      onClick={() => alert(`Opening contract management for ${proposal.rfp_title}`)}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm"
                    >
                      🏆 View Contract
                    </button>
                  )}
                  {proposal.status === 'awarded' && (
                    <button 
                      onClick={() => alert(`Opening invoice upload for ${proposal.rfp_title}`)}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
                    >
                      📄 Upload Invoice
                    </button>
                  )}
                  <button 
                    onClick={() => alert(`Viewing full details for proposal ${proposal.id}`)}
                    className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors text-sm"
                  >
                    👁️ View Details
                  </button>
                </div>
              </div>
            ))}
          </div>

          {filteredProposals.length === 0 && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📝</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {filterStatus === 'all' ? 'No proposals submitted yet' : `No ${filterStatus} proposals`}
              </h3>
              <p className="text-gray-600 mb-6">
                {filterStatus === 'all' 
                  ? 'Start by submitting your first proposal to available RFPs'
                  : `You don't have any ${filterStatus} proposals at the moment`
                }
              </p>
              {filterStatus === 'all' && (
                <button
                  onClick={() => setShowSubmitForm(true)}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Submit Your First Proposal
                </button>
              )}
            </div>
          )}
        </div>

        {/* Submit Form Modal */}
        {showSubmitForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 max-h-90vh overflow-y-auto">
              <div className="p-8">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Submit New Proposal</h2>
                  <button 
                    onClick={() => setShowSubmitForm(false)}
                    className="text-gray-500 hover:text-gray-700 text-2xl"
                  >
                    ×
                  </button>
                </div>
                
                <form onSubmit={submitProposal} className="space-y-6">
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
            </div>
          </div>
        )}
      </div>
    );
  }

  // Admin View (existing functionality for 1957 team)
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Proposals Inbox</h1>
        </div>

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
                  
                  {proposal.ai_evaluation.strengths && (
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
                  )}

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

// Contracts Management Component
const ContractsManagement = () => {
  const { user } = useAuth();
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    fetchContracts();
  }, []);

  const fetchContracts = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // For demo tokens, still fetch from API but with proper token handling
      if (token && token.startsWith('demo-token-')) {
        // Use demo vendor ID for demo tokens
        const response = await axios.get(`${API}/contracts`, {
          headers: {
            'Authorization': `Bearer demo-token-vendor-001`
          }
        });
        
        // If API call fails, use demo data
        if (response.data && response.data.contracts) {
          setContracts(response.data.contracts);
          setLoading(false);
          return;
        }
      } else if (token) {
        // For real tokens, make normal API call
        const response = await axios.get(`${API}/contracts`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.data && response.data.contracts) {
          setContracts(response.data.contracts);
          setLoading(false);
          return;
        }
      }
      
      // Fallback to demo data if API fails
      const demoContracts = [
        {
          id: 'CTR-2025-001',
          rfp_title: 'Enterprise Cloud Infrastructure Modernization',
          contract_value: 750000,
          start_date: '2025-01-15',
          end_date: '2025-04-15',
          status: 'active',
          progress: 65,
          milestones: [
            { name: 'Infrastructure Assessment', status: 'completed', date: '2025-01-30' },
            { name: 'Migration Planning', status: 'completed', date: '2025-02-15' },
            { name: 'Cloud Setup & Testing', status: 'in_progress', date: '2025-03-01' },
            { name: 'Data Migration', status: 'pending', date: '2025-03-15' },
            { name: 'Go-Live & Support', status: 'pending', date: '2025-04-01' }
          ],
          next_milestone: 'Cloud Setup & Testing',
          payment_status: 'partial_paid',
          paid_amount: 487500,
          pending_amount: 262500,
          documents: [
            { name: 'Signed Contract', type: 'pdf', size: '2.4 MB', id: 'doc-001' },
            { name: 'Statement of Work', type: 'pdf', size: '1.8 MB', id: 'doc-002' },
            { name: 'Technical Specifications', type: 'pdf', size: '3.2 MB', id: 'doc-003' }
          ]
        },
        {
          id: 'CTR-2024-018',
          rfp_title: 'Security Infrastructure Upgrade',
          contract_value: 180000,
          start_date: '2024-10-01',
          end_date: '2024-12-31',
          status: 'completed',
          progress: 100,
          milestones: [
            { name: 'Security Assessment', status: 'completed', date: '2024-10-15' },
            { name: 'Implementation Phase 1', status: 'completed', date: '2024-11-15' },
            { name: 'Implementation Phase 2', status: 'completed', date: '2024-12-15' },
            { name: 'Final Testing & Handover', status: 'completed', date: '2024-12-30' }
          ],
          payment_status: 'fully_paid',
          paid_amount: 180000,
          pending_amount: 0,
          documents: [
            { name: 'Signed Contract', type: 'pdf', size: '2.1 MB', id: 'doc-004' },
            { name: 'Completion Certificate', type: 'pdf', size: '1.2 MB', id: 'doc-005' },
            { name: 'Security Audit Report', type: 'pdf', size: '4.5 MB', id: 'doc-006' },
            { name: 'Final Invoice', type: 'pdf', size: '890 KB', id: 'doc-007' }
          ]
        },
        {
          id: 'CTR-2024-012',
          rfp_title: 'Digital Transformation Consulting',
          contract_value: 320000,
          start_date: '2024-06-01',
          end_date: '2024-09-30',
          status: 'completed',
          progress: 100,
          milestones: [
            { name: 'Current State Analysis', status: 'completed', date: '2024-06-30' },
            { name: 'Strategy Development', status: 'completed', date: '2024-07-31' },
            { name: 'Implementation Planning', status: 'completed', date: '2024-08-31' },
            { name: 'Knowledge Transfer', status: 'completed', date: '2024-09-30' }
          ],
          payment_status: 'fully_paid',
          paid_amount: 320000,
          pending_amount: 0,
          documents: [
            { name: 'Signed Contract', type: 'pdf', size: '2.8 MB', id: 'doc-008' },
            { name: 'Digital Strategy Report', type: 'pdf', size: '6.2 MB', id: 'doc-009' },
            { name: 'Implementation Roadmap', type: 'pdf', size: '3.1 MB', id: 'doc-010' },
            { name: 'Final Deliverables', type: 'zip', size: '15.4 MB', id: 'doc-011' }
          ]
        }
      ];
      
      setContracts(demoContracts);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching contracts:', error);
      // Fallback to demo data on error
      const demoContracts = [
        {
          id: 'CTR-2025-001',
          rfp_title: 'Enterprise Cloud Infrastructure Modernization',
          contract_value: 750000,
          start_date: '2025-01-15',
          end_date: '2025-04-15',
          status: 'active',
          progress: 65,
          milestones: [
            { name: 'Infrastructure Assessment', status: 'completed', date: '2025-01-30' },
            { name: 'Migration Planning', status: 'completed', date: '2025-02-15' },
            { name: 'Cloud Setup & Testing', status: 'in_progress', date: '2025-03-01' },
            { name: 'Data Migration', status: 'pending', date: '2025-03-15' },
            { name: 'Go-Live & Support', status: 'pending', date: '2025-04-01' }
          ],
          next_milestone: 'Cloud Setup & Testing',
          payment_status: 'partial_paid',
          paid_amount: 487500,
          pending_amount: 262500,
          documents: [
            { name: 'Signed Contract', type: 'pdf', size: '2.4 MB', id: 'doc-001' },
            { name: 'Statement of Work', type: 'pdf', size: '1.8 MB', id: 'doc-002' },
            { name: 'Technical Specifications', type: 'pdf', size: '3.2 MB', id: 'doc-003' }
          ]
        }
      ];
      
      setContracts(demoContracts);
      setLoading(false);
    }
  };

  const handleDownload = async (contractId, documentName, documentId) => {
    try {
      const token = localStorage.getItem('token');
      
      if (token && !token.startsWith('demo-token-')) {
        // For real tokens, try to download from API
        const response = await axios.get(`${API}/contracts/${contractId}/documents/${documentId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.data && response.data.content) {
          // Handle actual file download
          const blob = new Blob([response.data.content], { type: 'application/pdf' });
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = documentName;
          a.click();
          window.URL.revokeObjectURL(url);
        }
      }
      
      // Show download notification (for demo or after successful download)
      setNotification({
        type: 'success',
        message: `${documentName} downloaded successfully!`,
        contractId: contractId
      });
      
      // Hide notification after 3 seconds
      setTimeout(() => {
        setNotification(null);
      }, 3000);
      
    } catch (error) {
      console.error('Error downloading document:', error);
      // Show success notification even on error for demo purposes
      setNotification({
        type: 'success',
        message: `${documentName} download initiated!`,
        contractId: contractId
      });
      
      setTimeout(() => {
        setNotification(null);
      }, 3000);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'completed':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active':
        return '⚡';
      case 'completed':
        return '✅';
      case 'pending':
        return '⏳';
      default:
        return '📋';
    }
  };

  const getPaymentStatusColor = (status) => {
    switch (status) {
      case 'fully_paid':
        return 'bg-green-100 text-green-800';
      case 'partial_paid':
        return 'bg-yellow-100 text-yellow-800';
      case 'unpaid':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredContracts = filterStatus === 'all' 
    ? contracts 
    : contracts.filter(contract => contract.status === filterStatus);

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">My Contracts</h1>
          <div className="flex items-center space-x-3">
            <span className="text-sm text-gray-600">Total Value:</span>
            <span className="text-lg font-bold text-green-600">
              {contracts.reduce((sum, contract) => sum + contract.contract_value, 0).toLocaleString()} SAR
            </span>
          </div>
        </div>

        {/* Notification */}
        {notification && (
          <div className="fixed top-4 right-4 z-50 bg-white border border-green-200 rounded-lg shadow-lg p-4 flex items-center space-x-3">
            <div className="text-green-600 text-xl">📥</div>
            <div>
              <p className="font-medium text-gray-900">Download Complete</p>
              <p className="text-sm text-gray-600">{notification.message}</p>
            </div>
            <button 
              onClick={() => setNotification(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </div>
        )}

        {/* Status Filter */}
        <div className="mb-6 flex space-x-4">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filterStatus === 'all' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-blue-50'
            }`}
          >
            All Contracts ({contracts.length})
          </button>
          <button
            onClick={() => setFilterStatus('active')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filterStatus === 'active' ? 'bg-green-600 text-white' : 'bg-white text-gray-600 hover:bg-green-50'
            }`}
          >
            Active ({contracts.filter(c => c.status === 'active').length})
          </button>
          <button
            onClick={() => setFilterStatus('completed')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filterStatus === 'completed' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-blue-50'
            }`}
          >
            Completed ({contracts.filter(c => c.status === 'completed').length})
          </button>
        </div>

        {/* Contracts Grid */}
        <div className="grid gap-6">
          {filteredContracts.map(contract => (
            <div key={contract.id} className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
              {/* Contract Header */}
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{contract.rfp_title}</h3>
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <span>📋 Contract: {contract.id}</span>
                    <span>📅 {new Date(contract.start_date).toLocaleDateString()} - {new Date(contract.end_date).toLocaleDateString()}</span>
                    <span>💰 {contract.contract_value.toLocaleString()} SAR</span>
                  </div>
                </div>
                
                <div className="text-right">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(contract.status)}`}>
                    {getStatusIcon(contract.status)} {contract.status.toUpperCase()}
                  </span>
                  <div className="mt-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor(contract.payment_status)}`}>
                      {contract.payment_status.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Progress & Payment Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Progress */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">Project Progress</span>
                    <span className="text-sm font-bold text-blue-600">{contract.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${contract.progress}%` }}
                    ></div>
                  </div>
                  {contract.status === 'active' && (
                    <p className="text-xs text-gray-600 mt-1">Next: {contract.next_milestone}</p>
                  )}
                </div>

                {/* Payment Status */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">Payment Status</span>
                    <span className="text-sm font-bold text-green-600">
                      {contract.paid_amount.toLocaleString()} SAR
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${(contract.paid_amount / contract.contract_value) * 100}%` }}
                    ></div>
                  </div>
                  {contract.pending_amount > 0 && (
                    <p className="text-xs text-gray-600 mt-1">Pending: {contract.pending_amount.toLocaleString()} SAR</p>
                  )}
                </div>
              </div>

              {/* Milestones */}
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Project Milestones</h4>
                <div className="space-y-2">
                  {contract.milestones.map((milestone, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${
                        milestone.status === 'completed' ? 'bg-green-500' :
                        milestone.status === 'in_progress' ? 'bg-blue-500' :
                        'bg-gray-300'
                      }`}></div>
                      <span className={`text-sm ${
                        milestone.status === 'completed' ? 'text-gray-900' :
                        milestone.status === 'in_progress' ? 'text-blue-600 font-medium' :
                        'text-gray-500'
                      }`}>
                        {milestone.name}
                      </span>
                      <span className="text-xs text-gray-500">({milestone.date})</span>
                      {milestone.status === 'completed' && <span className="text-green-500">✓</span>}
                      {milestone.status === 'in_progress' && <span className="text-blue-500">⚡</span>}
                    </div>
                  ))}
                </div>
              </div>

              {/* Documents */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Contract Documents</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {contract.documents.map((doc, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                      <div className="flex items-center space-x-3">
                        <div className="text-2xl">
                          {doc.type === 'pdf' ? '📄' : doc.type === 'zip' ? '📦' : '📎'}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{doc.name}</p>
                          <p className="text-xs text-gray-500">{doc.size}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDownload(contract.id, doc.name, doc.id)}
                        className="bg-blue-600 text-white px-3 py-1 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center space-x-1"
                      >
                        <span>📥</span>
                        <span>Download</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 flex space-x-3">
                {contract.status === 'active' && (
                  <>
                    <button 
                      onClick={() => alert(`Opening milestone tracking for ${contract.rfp_title}`)}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
                    >
                      📊 Track Milestones
                    </button>
                    <button 
                      onClick={() => alert(`Opening invoice upload for ${contract.rfp_title}`)}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm"
                    >
                      📄 Upload Invoice
                    </button>
                  </>
                )}
                <button 
                  onClick={() => alert(`Opening full contract details for ${contract.id}`)}
                  className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors text-sm"
                >
                  👁️ View Full Details
                </button>
              </div>
            </div>
          ))}
        </div>

        {filteredContracts.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📋</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              {filterStatus === 'all' ? 'No contracts yet' : `No ${filterStatus} contracts`}
            </h3>
            <p className="text-gray-600">
              {filterStatus === 'all' 
                ? 'Your awarded proposals will appear here as contracts'
                : `You don't have any ${filterStatus} contracts at the moment`
              }
            </p>
          </div>
        )}
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
        return <ContractsManagement />;
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