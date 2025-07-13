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

// Components
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
    <nav className="bg-white shadow-lg border-b">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-blue-600">1957 Procurement Portal</h1>
          </div>
          
          {user && (
            <div className="flex items-center space-x-6">
              {getNavItems().map(item => (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    currentView === item.id 
                      ? 'bg-blue-600 text-white' 
                      : 'text-gray-600 hover:bg-blue-50'
                  }`}
                >
                  {item.label}
                </button>
              ))}
              
              <div className="flex items-center space-x-3">
                <span className="text-sm text-gray-600">
                  {user.company_name || user.email}
                </span>
                <button
                  onClick={logout}
                  className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600"
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

const LoginForm = () => {
  const [isSignup, setIsSignup] = useState(false);
  const [userType, setUserType] = useState('vendor');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    company_name: '',
    username: '',
    cr_number: '',
    country: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, signup } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isSignup) {
        const result = await signup({ ...formData, user_type: userType });
        if (!result.success) {
          setError(result.error);
        }
      } else {
        const result = await login(formData.email, formData.password);
        if (!result.success) {
          setError(result.error);
        }
      }
    } catch (err) {
      setError('An unexpected error occurred');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              1957 Procurement Portal
            </h1>
            <p className="text-gray-600">
              {isSignup ? 'Create your account' : 'Sign in to your account'}
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {isSignup && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Account Type
                  </label>
                  <div className="flex space-x-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="vendor"
                        checked={userType === 'vendor'}
                        onChange={(e) => setUserType(e.target.value)}
                        className="mr-2"
                      />
                      Vendor
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="admin"
                        checked={userType === 'admin'}
                        onChange={(e) => setUserType(e.target.value)}
                        className="mr-2"
                      />
                      1957 Team
                    </label>
                  </div>
                </div>

                {userType === 'vendor' && (
                  <>
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
                    />
                  </>
                )}

                <input
                  type="text"
                  placeholder="Username"
                  value={formData.username}
                  onChange={(e) => setFormData({...formData, username: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            )}

            <input
              type="email"
              placeholder="Email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
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

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 transition-colors font-medium disabled:opacity-50"
            >
              {loading ? 'Please wait...' : (isSignup ? 'Sign Up' : 'Sign In')}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => setIsSignup(!isSignup)}
              className="text-blue-600 hover:underline"
            >
              {isSignup ? 'Already have an account? Sign in' : 'Need an account? Sign up'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API}/dashboard/stats`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
    setLoading(false);
  };

  if (loading) return <div className="p-6">Loading...</div>;

  const getStatsCards = () => {
    if (user.user_type === 'vendor') {
      return [
        { title: 'Total Proposals', value: stats?.total_proposals || 0, icon: '📤' },
        { title: 'Awarded Contracts', value: stats?.awarded_contracts || 0, icon: '✅' },
        { title: 'Active RFPs', value: stats?.active_rfps || 0, icon: '📁' }
      ];
    } else {
      return [
        { title: 'Total RFPs', value: stats?.total_rfps || 0, icon: '🔁' },
        { title: 'Total Proposals', value: stats?.total_proposals || 0, icon: '📥' },
        { title: 'Pending Vendors', value: stats?.pending_vendors || 0, icon: '⏳' }
      ];
    }
  };

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome, {user.company_name || user.email}
        </h1>
        <p className="text-gray-600">
          {user.user_type === 'vendor' ? 'Vendor Dashboard' : 'Admin Dashboard'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {getStatsCards().map((card, index) => (
          <div key={index} className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">{card.title}</p>
                <p className="text-3xl font-bold text-gray-900">{card.value}</p>
              </div>
              <div className="text-4xl">{card.icon}</div>
            </div>
          </div>
        ))}
      </div>

      {!user.is_approved && user.user_type === 'vendor' && (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded-lg mb-6">
          <strong>Account Pending Approval:</strong> Your vendor account is under review. 
          You'll be able to submit proposals once approved.
        </div>
      )}
    </div>
  );
};

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
      const response = await axios.get(`${API}/rfps`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setRfps(response.data);
    } catch (error) {
      console.error('Error fetching RFPs:', error);
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
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">
          {user.user_type === 'vendor' ? 'Available RFPs' : 'Manage RFPs'}
        </h1>
        {user.user_type === 'admin' && (
          <button
            onClick={() => setShowCreateForm(true)}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            + Create New RFP
          </button>
        )}
      </div>

      {showCreateForm && (
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
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
          <div key={rfp.id} className="bg-white rounded-xl shadow-md p-6">
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
          </div>
        ))}
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
      const response = await axios.get(`${API}/proposals`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setProposals(response.data);
    } catch (error) {
      console.error('Error fetching proposals:', error);
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
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">
          {user.user_type === 'vendor' ? 'My Proposals' : 'Proposals Inbox'}
        </h1>
        {user.user_type === 'vendor' && user.is_approved && (
          <button
            onClick={() => setShowSubmitForm(true)}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            + Submit New Proposal
          </button>
        )}
      </div>

      {showSubmitForm && (
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
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
          <div key={proposal.id} className="bg-white rounded-xl shadow-md p-6">
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
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-bold mb-2">🧠 AI Evaluation</h4>
                <div className="grid grid-cols-3 gap-4 mb-3">
                  <div>
                    <p className="text-sm text-gray-600">Commercial Score</p>
                    <p className="font-bold">{proposal.ai_evaluation.commercial_score}/100</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Technical Score</p>
                    <p className="font-bold">{proposal.ai_evaluation.technical_score}/100</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Recommendation</p>
                    <p className="font-bold">{proposal.ai_evaluation.recommendation}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-green-700 mb-1">Strengths:</p>
                    <ul className="text-sm text-gray-700">
                      {proposal.ai_evaluation.strengths?.map((strength, idx) => (
                        <li key={idx}>• {strength}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-red-700 mb-1">Areas for Improvement:</p>
                    <ul className="text-sm text-gray-700">
                      {proposal.ai_evaluation.weaknesses?.map((weakness, idx) => (
                        <li key={idx}>• {weakness}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
            
            {user.user_type === 'admin' && proposal.status === 'submitted' && (
              <button
                onClick={() => evaluateProposal(proposal.id)}
                className="mt-4 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
              >
                🧠 Evaluate with AI
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

const MainApp = () => {
  const { user, loading } = useAuth();
  const [currentView, setCurrentView] = useState('dashboard');

  const renderView = () => {
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginForm />;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar onNavigate={setCurrentView} currentView={currentView} />
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