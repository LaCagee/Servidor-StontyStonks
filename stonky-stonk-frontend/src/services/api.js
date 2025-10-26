// src/services/api.js
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const api = {
  async login(email, password) {
  // Simular una llamada a la API con un retraso
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Datos de mock para probar
  const mockUser = {
    user: {
      id: 1,
      email: email,
      name: 'Usuario Demo'
    },
    token: 'mock-jwt-token-12345'
  };

  // Simular una respuesta exitosa
  return { data: mockUser };
  
  // Si quieres probar un error, descomenta lo siguiente:
  // throw new Error('Credenciales incorrectas');
},

  async register(email, password, confirmPassword) {
    const response = await fetch(`${API_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, confirmPassword }),
    });
    
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Error al registrar usuario');
    return data;
  },

  async logout() {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/api/auth/logout`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
    });
    
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    return await response.json();
  },

  async getCurrentUser() {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/api/auth/me`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Error al obtener usuario');
    return data;
  }
};

export default api; // Cambia a export default