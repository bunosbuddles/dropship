import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useImpersonation } from '../context/ImpersonationContext';
import ContentDashboard from './ContentDashboard';
import ContentCalendar from './ContentCalendar';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

const SuperUserDashboard = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const { impersonatedUserId, startImpersonation, stopImpersonation } = useImpersonation();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/api/users/all`);
        setUsers(res.data);
      } catch (err) {
        console.error('Failed to fetch users:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const handleSelectUser = (user) => {
    setSelectedUser(user);
    startImpersonation(user._id);
  };

  const handleBack = () => {
    setSelectedUser(null);
    stopImpersonation();
  };

  if (loading) return <div>Loading users...</div>;

  if (selectedUser && impersonatedUserId) {
    return (
      <div>
        <div style={{ background: '#f5f5f5', padding: 12, marginBottom: 16, borderRadius: 4, color: '#333' }}>
          <button onClick={handleBack} style={{ marginRight: 16 }}>&larr; Back to user list</button>
          <span>Impersonating: <strong>{selectedUser.name}</strong> ({selectedUser.email})</span>
        </div>
        {/* Render the user's dashboard as if you were that user */}
        <ContentDashboard />
        {/* Optionally, add ContentCalendar or other user-specific pages here */}
      </div>
    );
  }

  return (
    <div>
      <h1>Superuser: All Users</h1>
      <ul>
        {users.map(user => (
          <li key={user._id} style={{ margin: '12px 0', cursor: 'pointer' }} onClick={() => handleSelectUser(user)}>
            <strong>{user.name}</strong> ({user.email})
          </li>
        ))}
      </ul>
    </div>
  );
};

export default SuperUserDashboard; 