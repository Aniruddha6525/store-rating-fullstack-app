import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

// Reusable Star Rating Component 
const StarRating = ({ totalStars = 5, rating, onRate, readOnly = false }) => {
    return (
        <div className="flex space-x-1">
            {[...Array(totalStars)].map((_, index) => {
                const starValue = index + 1;
                return (
                    <svg
                        key={starValue}
                        onClick={() => !readOnly && onRate(starValue)}
                        className={`w-6 h-6 ${!readOnly ? 'cursor-pointer' : ''} ${rating >= starValue ? 'text-yellow-400' : 'text-gray-300'}`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                );
            })}
        </div>
    );
};

// Password Update Modal Component 
const PasswordUpdateModal = ({ token, onClose, setAuthError }) => {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (newPassword !== confirmPassword) {
            return setError("New passwords do not match.");
        }

        try {
            const config = { headers: { 'x-auth-token': token } };
            const body = { currentPassword, newPassword };
            const res = await axios.put(`${API_BASE_URL}/users/password`, body, config);
            setSuccess(res.data.msg);
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
            setTimeout(() => {
                onClose();
            }, 2000);
        } catch (err) {
            const errorMsg = err.response?.data?.msg || "Failed to update password.";
            setError(errorMsg);
            if (err.response && err.response.status === 401) {
                 setAuthError("Session expired. Please log in again.");
            }
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white p-8 rounded-lg shadow-2xl w-full max-w-md">
                <h2 className="text-2xl font-bold mb-6 text-gray-800">Change Your Password</h2>
                {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}
                {success && <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">{success}</div>}
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2">Current Password</label>
                        <input
                            type="password"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2">New Password</label>
                        <input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
                    </div>
                    <div className="mb-6">
                        <label className="block text-gray-700 text-sm font-bold mb-2">Confirm New Password</label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
                    </div>
                    <div className="flex items-center justify-between">
                        <button type="button" onClick={onClose} className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">
                            Cancel
                        </button>
                        <button type="submit" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">
                            Update Password
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};


// Normal User Dashboard 
const NormalUserDashboard = ({ user, token, onLogout, setAuthError }) => {
    const [stores, setStores] = useState([]);
    const [error, setError] = useState('');
    const [searchName, setSearchName] = useState('');
    const [searchAddress, setSearchAddress] = useState('');
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

    const fetchStores = useCallback(async () => {
        try {
            const config = {
                headers: { 'x-auth-token': token },
                params: { name: searchName, address: searchAddress }
            };
            const res = await axios.get(`${API_BASE_URL}/stores`, config);
            setStores(res.data);
            setError('');
        } catch (err) {
            setError("Failed to fetch stores. Please try again later.");
             if (err.response && err.response.status === 401) {
                 setAuthError("Session expired. Please log in again.");
            }
        }
    }, [token, searchName, searchAddress, setAuthError]);

    useEffect(() => {
        const debounceFetch = setTimeout(() => {
            fetchStores();
        }, 500);
        return () => clearTimeout(debounceFetch);
    }, [fetchStores]);

    const handleRateStore = async (storeId, rating) => {
        try {
            const config = { headers: { 'x-auth-token': token } };
            await axios.post(`${API_BASE_URL}/ratings`, { storeId, rating }, config);
            fetchStores();
        } catch (err) {
            setError("Failed to submit rating.");
            if (err.response && err.response.status === 401) {
                setAuthError("Session expired. Please log in again.");
            }
        }
    };

    return (
        <div className="container mx-auto p-4 md:p-8">
             <header className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-gray-800">Welcome, {user.name}!</h1>
                <div>
                    <button onClick={() => setIsPasswordModalOpen(true)} className="bg-gray-600 hover:bg-gray-800 text-white font-bold py-2 px-4 rounded mr-4">Change Password</button>
                    <button onClick={onLogout} className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded">Logout</button>
                </div>
            </header>

            {isPasswordModalOpen && <PasswordUpdateModal token={token} onClose={() => setIsPasswordModalOpen(false)} setAuthError={setAuthError} />}

            <div className="bg-white p-6 rounded-lg shadow-md mb-8">
                <h2 className="text-2xl font-semibold text-gray-700 mb-4">Search Stores</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                        type="text"
                        placeholder="Search by store name..."
                        value={searchName}
                        onChange={(e) => setSearchName(e.target.value)}
                        className="shadow-sm appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                        type="text"
                        placeholder="Search by address..."
                        value={searchAddress}
                        onChange={(e) => setSearchAddress(e.target.value)}
                        className="shadow-sm appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
            </div>

            {error && <p className="text-red-500 mb-4">{error}</p>}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {stores.map(store => (
                    <div key={store.id} className="bg-white rounded-lg shadow-lg p-6 transition-transform transform hover:-translate-y-1">
                        <h3 className="text-xl font-bold text-gray-800 mb-2">{store.name}</h3>
                        <p className="text-gray-600 mb-4">{store.address}</p>
                        <div className="flex items-center mb-4">
                            <span className="text-gray-700 font-semibold mr-2">Avg. Rating:</span>
                            <StarRating rating={store.average_rating} readOnly={true} />
                            <span className="ml-2 text-gray-500">({store.average_rating})</span>
                        </div>
                        <div className="border-t pt-4">
                            <p className="text-gray-700 font-semibold mb-2">Your Rating:</p>
                            <StarRating rating={store.user_rating} onRate={(rating) => handleRateStore(store.id, rating)} />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

// Store Owner Dashboard 
const StoreOwnerDashboard = ({ user, token, onLogout, setAuthError }) => {
    const [dashboardData, setDashboardData] = useState(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const config = { headers: { 'x-auth-token': token } };
                const res = await axios.get(`${API_BASE_URL}/stores/owner-dashboard`, config);
                setDashboardData(res.data);
            } catch (err) {
                setError(err.response?.data?.msg || "Failed to fetch dashboard data.");
                if (err.response && err.response.status === 401) {
                    setAuthError("Session expired. Please log in again.");
                }
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, [token, setAuthError]);

    if (loading) return <div className="text-center p-10">Loading your dashboard...</div>;
    if (error) return <div className="text-center p-10 text-red-500">{error}</div>;

    return (
        <div className="container mx-auto p-4 md:p-8">
            <header className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Store Owner Dashboard</h1>
                    {dashboardData && <h2 className="text-xl text-gray-600 mt-1">{dashboardData.storeName}</h2>}
                </div>
                <div>
                    <button onClick={() => setIsPasswordModalOpen(true)} className="bg-gray-600 hover:bg-gray-800 text-white font-bold py-2 px-4 rounded mr-4">Change Password</button>
                    <button onClick={onLogout} className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded">Logout</button>
                </div>
            </header>

            {isPasswordModalOpen && <PasswordUpdateModal token={token} onClose={() => setIsPasswordModalOpen(false)} setAuthError={setAuthError} />}

            {dashboardData && (
                 <div className="bg-white p-6 rounded-lg shadow-md mb-8">
                    <h2 className="text-2xl font-semibold text-gray-700 mb-4">Your Store's Performance</h2>
                     <div className="flex items-center mb-4 text-xl">
                        <span className="text-gray-700 font-semibold mr-2">Average Rating:</span>
                        <StarRating rating={dashboardData.averageRating} readOnly={true} />
                        <span className="ml-2 font-bold text-gray-800">({dashboardData.averageRating})</span>
                    </div>
                 </div>
            )}
            
            {dashboardData && (
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h3 className="text-2xl font-semibold text-gray-700 mb-4">Users Who Rated Your Store</h3>
                    <div className="overflow-x-auto">
                        <table className="min-w-full bg-white">
                            <thead className="bg-gray-200">
                                <tr>
                                    <th className="text-left py-3 px-4 uppercase font-semibold text-sm">User Name</th>
                                    <th className="text-left py-3 px-4 uppercase font-semibold text-sm">User Email</th>
                                    <th className="text-center py-3 px-4 uppercase font-semibold text-sm">Rating Given</th>
                                </tr>
                            </thead>
                            <tbody className="text-gray-700">
                                {dashboardData.raters.map((rater, index) => (
                                    <tr key={index} className="border-b hover:bg-gray-100">
                                        <td className="py-3 px-4">{rater.name}</td>
                                        <td className="py-3 px-4">{rater.email}</td>
                                        <td className="py-3 px-4 text-center">
                                            <StarRating rating={rater.rating} readOnly={true} />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                     {dashboardData.raters.length === 0 && (
                        <p className="text-center text-gray-500 py-4">No ratings have been submitted for your store yet.</p>
                     )}
                </div>
            )}
        </div>
    );
};

// Add User Modal 
const AddUserModal = ({ token, onClose, onUserAdded, setAuthError }) => {
    const [formData, setFormData] = useState({ name: '', email: '', password: '', address: '', role: 'Normal User', store_id: '' });
    const [unassignedStores, setUnassignedStores] = useState([]);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        const fetchUnassignedStores = async () => {
            if (formData.role === 'Store Owner') {
                try {
                    const config = { headers: { 'x-auth-token': token } };
                    const res = await axios.get(`${API_BASE_URL}/admin/stores`, config);
                    setUnassignedStores(res.data.filter(store => !store.owner_id));
                } catch (err) {
                     setError("Could not load stores list.");
                }
            }
        };
        fetchUnassignedStores();
    }, [formData.role, token]);

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        try {
            const config = { headers: { 'x-auth-token': token } };
            const res = await axios.post(`${API_BASE_URL}/admin/users`, formData, config);
            setSuccess(`User "${res.data.name}" created successfully!`);
            onUserAdded();
            setTimeout(() => onClose(), 2000);
        } catch (err) {
            setError(err.response?.data?.msg || "Failed to create user.");
            if (err.response?.status === 401) setAuthError("Session expired.");
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white p-8 rounded-lg shadow-2xl w-full max-w-lg">
                <h2 className="text-2xl font-bold mb-6 text-gray-800">Add New User</h2>
                {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>}
                {success && <div className="bg-green-100 text-green-700 p-3 rounded mb-4">{success}</div>}
                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <input name="name" value={formData.name} onChange={handleChange} placeholder="Full Name" required className="w-full px-3 py-2 border rounded-lg"/>
                        <input name="email" type="email" value={formData.email} onChange={handleChange} placeholder="Email Address" required className="w-full px-3 py-2 border rounded-lg"/>
                    </div>
                     <div className="mb-4">
                        <input name="password" type="password" value={formData.password} onChange={handleChange} placeholder="Password" required className="w-full px-3 py-2 border rounded-lg"/>
                    </div>
                     <div className="mb-4">
                        <input name="address" value={formData.address} onChange={handleChange} placeholder="Address" required className="w-full px-3 py-2 border rounded-lg"/>
                    </div>
                    <div className="mb-4">
                         <label className="block text-gray-700 text-sm font-bold mb-2">Role</label>
                        <select name="role" value={formData.role} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg bg-white">
                            <option>Normal User</option>
                            <option>Store Owner</option>
                            <option>System Administrator</option>
                        </select>
                    </div>

                    {formData.role === 'Store Owner' && (
                        <div className="mb-6">
                            <label className="block text-gray-700 text-sm font-bold mb-2">Assign to Store</label>
                            <select name="store_id" value={formData.store_id} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg bg-white">
                                <option value="">Select a store...</option>
                                {unassignedStores.map(store => (
                                    <option key={store.id} value={store.id}>{store.name}</option>
                                ))}
                            </select>
                            {unassignedStores.length === 0 && <p className="text-xs text-gray-500 mt-1">No unassigned stores available.</p>}
                        </div>
                    )}

                    <div className="flex items-center justify-end space-x-4">
                        <button type="button" onClick={onClose} className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded">Cancel</button>
                        <button type="submit" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">Create User</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// Add Store Modal 
const AddStoreModal = ({ token, onClose, onStoreAdded, setAuthError }) => {
    const [formData, setFormData] = useState({ name: '', email: '', address: '', owner_id: '' });
    const [potentialOwners, setPotentialOwners] = useState([]);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    
    useEffect(() => {
        const fetchPotentialOwners = async () => {
             try {
                const config = { headers: { 'x-auth-token': token } };
                const res = await axios.get(`${API_BASE_URL}/admin/users`, config);
                 const unassignedUsers = res.data.filter(user => !user.store_name);
                setPotentialOwners(unassignedUsers);
            } catch (err) {
                 setError("Could not load users list.");
            }
        };
        fetchPotentialOwners();
    }, [token]);

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        try {
            const config = { headers: { 'x-auth-token': token } };
            const res = await axios.post(`${API_BASE_URL}/admin/stores`, formData, config);
            setSuccess(`Store "${res.data.name}" created successfully!`);
            onStoreAdded();
            setTimeout(() => onClose(), 2000);
        } catch (err) {
            setError(err.response?.data?.msg || "Failed to create store.");
             if (err.response?.status === 401) setAuthError("Session expired.");
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white p-8 rounded-lg shadow-2xl w-full max-w-lg">
                <h2 className="text-2xl font-bold mb-6 text-gray-800">Add New Store</h2>
                {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>}
                {success && <div className="bg-green-100 text-green-700 p-3 rounded mb-4">{success}</div>}
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <input name="name" value={formData.name} onChange={handleChange} placeholder="Store Name" required className="w-full px-3 py-2 border rounded-lg"/>
                    </div>
                    <div className="mb-4">
                        <input name="email" type="email" value={formData.email} onChange={handleChange} placeholder="Store Email" required className="w-full px-3 py-2 border rounded-lg"/>
                    </div>
                    <div className="mb-4">
                        <input name="address" value={formData.address} onChange={handleChange} placeholder="Store Address" required className="w-full px-3 py-2 border rounded-lg"/>
                    </div>
                     <div className="mb-6">
                         <label className="block text-gray-700 text-sm font-bold mb-2">Assign Owner (Optional)</label>
                        <select name="owner_id" value={formData.owner_id} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg bg-white">
                            <option value="">No Owner</option>
                            {potentialOwners.map(user => (
                                <option key={user.id} value={user.id}>{user.name} ({user.email})</option>
                            ))}
                        </select>
                         <p className="text-xs text-gray-500 mt-1">Assigning a user will automatically set their role to 'Store Owner'.</p>
                    </div>
                    <div className="flex items-center justify-end space-x-4">
                        <button type="button" onClick={onClose} className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded">Cancel</button>
                        <button type="submit" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">Create Store</button>
                    </div>
                </form>
            </div>
        </div>
    );
};


// Admin Dashboard Component 
const AdminDashboard = ({ user, token, onLogout, setAuthError }) => {
    const [view, setView] = useState('stats');
    const [stats, setStats] = useState({ users: 0, stores: 0, ratings: 0 });
    const [users, setUsers] = useState([]);
    const [stores, setStores] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
    const [isAddStoreModalOpen, setIsAddStoreModalOpen] = useState(false);
    
    const [userFilters, setUserFilters] = useState({ name: '', email: '', role: '' });
    const [storeFilters, setStoreFilters] = useState({ name: '', email: '', address: '' });

    const fetchData = useCallback(async (endpoint, params = {}) => {
        setError('');
        try {
            const config = { headers: { 'x-auth-token': token }, params };
            const res = await axios.get(`${API_BASE_URL}/admin/${endpoint}`, config);
            return res.data;
        } catch (err) {
            setError(`Failed to fetch ${endpoint}.`);
            if (err.response && err.response.status === 401) {
                setAuthError("Session expired. Please log in again.");
            }
            return null;
        }
    }, [token, setAuthError]);

    const loadData = useCallback(async (filters) => {
        setLoading(true);
        
        const endpoint = view === 'users' ? 'users' : view === 'stores' ? 'stores' : null;
        const currentFilters = view === 'users' ? userFilters : storeFilters;

        const statsPromise = fetchData('stats');
        const listPromise = endpoint ? fetchData(endpoint, currentFilters) : Promise.resolve(null);
        
        const [statsData, listData] = await Promise.all([statsPromise, listPromise]);

        if (statsData) setStats(statsData);
        if(listData) {
            if(view === 'users') setUsers(listData);
            if(view === 'stores') setStores(listData);
        }
        
        setLoading(false);
    }, [fetchData, view, userFilters, storeFilters]);

    useEffect(() => {
        const debouncedLoad = setTimeout(() => {
            loadData();
        }, 500); // Debounce requests by 500ms
    
        return () => clearTimeout(debouncedLoad);
    }, [loadData, userFilters, storeFilters, view]);


    const handleUserFilterChange = (e) => {
        setUserFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleStoreFilterChange = (e) => {
        setStoreFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const StatCard = ({ title, value }) => (
        <div className="bg-white p-6 rounded-lg shadow-lg">
            <h3 className="text-lg font-semibold text-gray-500">{title}</h3>
            <p className="text-4xl font-bold text-gray-800 mt-2">{value}</p>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50">
            {isAddUserModalOpen && <AddUserModal token={token} onClose={() => setIsAddUserModalOpen(false)} onUserAdded={loadData} setAuthError={setAuthError} />}
            {isAddStoreModalOpen && <AddStoreModal token={token} onClose={() => setIsAddStoreModalOpen(false)} onStoreAdded={loadData} setAuthError={setAuthError} />}
            
            <header className="bg-white shadow-md">
                <div className="container mx-auto px-8 py-4 flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-gray-800">Admin Panel</h1>
                    <button onClick={onLogout} className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded">Logout</button>
                </div>
            </header>

            <nav className="bg-gray-800 text-white">
                <div className="container mx-auto px-8 flex">
                    <button onClick={() => setView('stats')} className={`py-4 px-6 font-semibold ${view === 'stats' ? 'bg-gray-900' : 'hover:bg-gray-700'}`}>Dashboard Stats</button>
                    <button onClick={() => setView('users')} className={`py-4 px-6 font-semibold ${view === 'users' ? 'bg-gray-900' : 'hover:bg-gray-700'}`}>Manage Users</button>
                    <button onClick={() => setView('stores')} className={`py-4 px-6 font-semibold ${view === 'stores' ? 'bg-gray-900' : 'hover:bg-gray-700'}`}>Manage Stores</button>
                </div>
            </nav>

            <main className="container mx-auto p-8">
                {error && <p className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</p>}
                {loading && <p>Loading...</p>}

                {view === 'stats' && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <StatCard title="Total Users" value={stats.users} />
                        <StatCard title="Total Stores" value={stats.stores} />
                        <StatCard title="Total Ratings" value={stats.ratings} />
                    </div>
                )}

                {view === 'users' && (
                    <div className="bg-white p-6 rounded-lg shadow-md">
                         <div className="flex justify-between items-center mb-4">
                            <h2 className="text-2xl font-semibold text-gray-700">All Users</h2>
                            <button onClick={() => setIsAddUserModalOpen(true)} className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded">Add New User</button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 p-4 border rounded-lg bg-gray-50">
                            <input name="name" value={userFilters.name} onChange={handleUserFilterChange} placeholder="Filter by Name..." className="w-full px-3 py-2 border rounded-lg"/>
                            <input name="email" value={userFilters.email} onChange={handleUserFilterChange} placeholder="Filter by Email..." className="w-full px-3 py-2 border rounded-lg"/>
                            <select name="role" value={userFilters.role} onChange={handleUserFilterChange} className="w-full px-3 py-2 border rounded-lg bg-white">
                                <option value="">All Roles</option>
                                <option>Normal User</option>
                                <option>Store Owner</option>
                                <option>System Administrator</option>
                            </select>
                        </div>

                        <table className="min-w-full bg-white">
                             <thead className="bg-gray-200">
                                <tr>
                                    <th className="text-left py-3 px-4 uppercase font-semibold text-sm">Name & Address</th>
                                    <th className="text-left py-3 px-4 uppercase font-semibold text-sm">Email</th>
                                    <th className="text-left py-3 px-4 uppercase font-semibold text-sm">Role & Store Info</th>
                                </tr>
                            </thead>
                            <tbody className="text-gray-700">
                                {users.map(u => (
                                    <tr key={u.id} className="border-b hover:bg-gray-100">
                                        <td className="py-3 px-4">{u.name}<p className="text-xs text-gray-500">{u.address}</p></td>
                                        <td className="py-3 px-4">{u.email}</td>
                                        <td className="py-3 px-4">
                                            {u.role}
                                            {u.role === 'Store Owner' && (
                                                <div className="mt-1 text-xs font-semibold text-blue-600">
                                                    <span>Owns: {u.store_name || 'Unassigned'}</span>
                                                    <span className="ml-2">({u.store_rating} ★)</span>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
                
                {view === 'stores' && (
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-2xl font-semibold text-gray-700">All Stores</h2>
                            <button onClick={() => setIsAddStoreModalOpen(true)} className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded">Add New Store</button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 p-4 border rounded-lg bg-gray-50">
                            <input name="name" value={storeFilters.name} onChange={handleStoreFilterChange} placeholder="Filter by Name..." className="w-full px-3 py-2 border rounded-lg"/>
                            <input name="email" value={storeFilters.email} onChange={handleStoreFilterChange} placeholder="Filter by Email..." className="w-full px-3 py-2 border rounded-lg"/>
                            <input name="address" value={storeFilters.address} onChange={handleStoreFilterChange} placeholder="Filter by Address..." className="w-full px-3 py-2 border rounded-lg"/>
                        </div>

                        <table className="min-w-full bg-white">
                            <thead className="bg-gray-200">
                                <tr>
                                    <th className="text-left py-3 px-4 uppercase font-semibold text-sm">Name & Address</th>
                                    <th className="text-left py-3 px-4 uppercase font-semibold text-sm">Owner</th>
                                    <th className="text-center py-3 px-4 uppercase font-semibold text-sm">Avg. Rating</th>
                                </tr>
                            </thead>
                            <tbody className="text-gray-700">
                                {stores.map(s => (
                                     <tr key={s.id} className="border-b hover:bg-gray-100">
                                        <td className="py-3 px-4">{s.name}<p className="text-xs text-gray-500">{s.address}</p></td>
                                        <td className="py-3 px-4">{s.owner_name || <span className="text-xs text-gray-400">Unassigned</span>}</td>
                                        <td className="py-3 px-4 text-center">{s.average_rating}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

            </main>
        </div>
    );
};


// Login Page 
const LoginPage = ({ setToken, setUser, setView }) => {
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [error, setError] = useState('');

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.post(`${API_BASE_URL}/auth/login`, formData);
            setToken(res.data.token);
            setUser(res.data.user);
        } catch (err) {
            setError(err.response?.data?.msg || 'Login failed.');
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen">
            <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8">
                <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">Login to Your Account</h2>
                {error && <p className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</p>}
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2">Email Address</label>
                        <input type="email" name="email" value={formData.email} onChange={handleChange} required className="w-full px-3 py-2 border rounded-lg"/>
                    </div>
                    <div className="mb-6">
                        <label className="block text-gray-700 text-sm font-bold mb-2">Password</label>
                        <input type="password" name="password" value={formData.password} onChange={handleChange} required className="w-full px-3 py-2 border rounded-lg"/>
                    </div>
                    <button type="submit" className="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg">Login</button>
                </form>
                <p className="text-center text-gray-600 mt-6">
                    Don't have an account? <button onClick={() => setView('register')} className="text-blue-500 hover:underline">Sign up here</button>
                </p>
            </div>
        </div>
    );
};

// Register Page 
const RegisterPage = ({ setView }) => {
    const [formData, setFormData] = useState({ name: '', email: '', password: '', address: '' });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        try {
            const res = await axios.post(`${API_BASE_URL}/auth/register`, formData);
            setSuccess(res.data.msg);
            setTimeout(() => setView('login'), 2000);
        } catch (err) {
            setError(err.response?.data?.msg || 'Registration failed.');
        }
    };
    
    return (
        <div className="flex flex-col items-center justify-center min-h-screen">
            <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8">
                <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">Create an Account</h2>
                {error && <p className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</p>}
                {success && <p className="bg-green-100 text-green-700 p-3 rounded mb-4">{success}</p>}
                <form onSubmit={handleSubmit}>
                     <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2">Full Name</label>
                        <input type="text" name="name" value={formData.name} onChange={handleChange} required className="w-full px-3 py-2 border rounded-lg"/>
                    </div>
                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2">Email Address</label>
                        <input type="email" name="email" value={formData.email} onChange={handleChange} required className="w-full px-3 py-2 border rounded-lg"/>
                    </div>
                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2">Password</label>
                        <input type="password" name="password" value={formData.password} onChange={handleChange} required className="w-full px-3 py-2 border rounded-lg"/>
                    </div>
                     <div className="mb-6">
                        <label className="block text-gray-700 text-sm font-bold mb-2">Address</label>
                        <input type="text" name="address" value={formData.address} onChange={handleChange} required className="w-full px-3 py-2 border rounded-lg"/>
                    </div>
                    <button type="submit" className="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg">Register</button>
                </form>
                 <p className="text-center text-gray-600 mt-6">
                    Already have an account? <button onClick={() => setView('login')} className="text-blue-500 hover:underline">Login here</button>
                </p>
            </div>
        </div>
    );
};

// Main App Component
function App() {
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')));
    const [view, setView] = useState('login');
    const [authError, setAuthError] = useState('');

    useEffect(() => {
        if (token && user) {
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));
        } else {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
        }
    }, [token, user]);

    useEffect(() => {
        if (authError) {
            handleLogout();
        }
    }, [authError]);

    const handleLogout = () => {
        setToken(null);
        setUser(null);
        setView('login');
        setAuthError('');
    };

    const renderView = () => {
        if (token && user) {
            const standardizedRole = (user.role || '').trim().toLowerCase().replace(/ /g, '_');
            switch (standardizedRole) {
                case 'normal_user':
                    return <NormalUserDashboard user={user} token={token} onLogout={handleLogout} setAuthError={setAuthError} />;
                case 'store_owner':
                     return <StoreOwnerDashboard user={user} token={token} onLogout={handleLogout} setAuthError={setAuthError} />;
                case 'system_administrator':
                    return <AdminDashboard user={user} token={token} onLogout={handleLogout} setAuthError={setAuthError} />;
                default:
                    return (
                        <div className="text-center p-10">
                            <p className="text-red-500">Unknown role: '{user.role}'. Please contact support.</p>
                            <button onClick={handleLogout} className="mt-4 text-blue-500 hover:underline">Logout</button>
                        </div>
                    );
            }
        } else {
            if (view === 'register') {
                return <RegisterPage setView={setView} />;
            }
            return <LoginPage setToken={setToken} setUser={setUser} setView={setView} />;
        }
    };

    return <div className="bg-gray-100 min-h-screen">{renderView()}</div>;
}

export default App;

