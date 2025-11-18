import 'dotenv/config';
import app from './app.js';

const PORT = process.env.BACKEND_PORT || process.env.PORT || process.env.ADMIN_BACKEND_PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Admin API: http://localhost:${PORT}/api`);
});
