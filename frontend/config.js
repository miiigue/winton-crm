const CONFIG = {
    // Si estás en localhost o 127.0.0.1, usa el backend local
    // Si estás en producción (Hostinger), usa el backend de Render
    API_URL: (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
        ? 'http://localhost:4000/api'
        : 'https://winton-crm-backend.onrender.com/api'
};

console.log('Environment:', window.location.hostname === 'localhost' ? 'DEV' : 'PROD');
console.log('API URL:', CONFIG.API_URL);
