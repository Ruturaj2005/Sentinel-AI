import api from './api';

export const authService = {
  switchRole: async (role, employeeId = null) => {
    const response = await api.post('/auth/switch-role', { role, employeeId });
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  getCurrentUser: async () => {
    const response = await api.get('/auth/current-user');
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  getStoredUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  getStoredToken: () => {
    return localStorage.getItem('token');
  }
};

export const employeeService = {
  getAll: async (params = {}) => {
    const response = await api.get('/employees', { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/employees/${id}`);
    return response.data;
  },

  getRiskHistory: async (id) => {
    const response = await api.get(`/employees/${id}/risk-history`);
    return response.data;
  },

  getHighRisk: async (threshold = 70) => {
    const response = await api.get('/employees/high-risk', { params: { threshold } });
    return response.data;
  }
};

export const alertService = {
  getAll: async (params = {}) => {
    const response = await api.get('/alerts', { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/alerts/${id}`);
    return response.data;
  },

  getByEmployee: async (employeeId) => {
    const response = await api.get(`/alerts/employee/${employeeId}`);
    return response.data;
  },

  updateStatus: async (id, status, notes = '') => {
    const response = await api.put(`/alerts/${id}/status`, { status, notes });
    return response.data;
  },

  getStatistics: async () => {
    const response = await api.get('/alerts/statistics');
    return response.data;
  }
};

export const ticketService = {
  getAll: async (params = {}) => {
    const response = await api.get('/tickets', { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/tickets/${id}`);
    return response.data;
  },

  create: async (ticketData) => {
    const response = await api.post('/tickets', ticketData);
    return response.data;
  },

  update: async (id, text) => {
    const response = await api.put(`/tickets/${id}`, { text });
    return response.data;
  },

  approve: async (id, notes = '') => {
    const response = await api.post(`/tickets/${id}/approve`, { notes });
    return response.data;
  },

  reject: async (id, notes = '') => {
    const response = await api.post(`/tickets/${id}/reject`, { notes });
    return response.data;
  }
};

export const accessEventService = {
  getAll: async (params = {}) => {
    const response = await api.get('/access-events', { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/access-events/${id}`);
    return response.data;
  },

  getByEmployee: async (employeeId, params = {}) => {
    const response = await api.get(`/access-events/employee/${employeeId}`, { params });
    return response.data;
  },

  getStatsByEmployee: async (employeeId) => {
    const response = await api.get(`/access-events/employee/${employeeId}/stats`);
    return response.data;
  }
};

export const patternService = {
  getAll: async (params = {}) => {
    const response = await api.get('/patterns', { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/patterns/${id}`);
    return response.data;
  },

  getByEmployee: async (employeeId) => {
    const response = await api.get(`/patterns/employee/${employeeId}`);
    return response.data;
  },

  getReconnaissance: async () => {
    const response = await api.get('/patterns/reconnaissance');
    return response.data;
  },

  updateStatus: async (id, status) => {
    const response = await api.put(`/patterns/${id}/status`, { status });
    return response.data;
  }
};

export const dashboardService = {
  getEmployeeDashboard: async () => {
    const response = await api.get('/dashboard/employee');
    return response.data;
  },

  getManagerDashboard: async () => {
    const response = await api.get('/dashboard/manager');
    return response.data;
  },

  getInvestigatorDashboard: async () => {
    const response = await api.get('/dashboard/investigator');
    return response.data;
  }
};
