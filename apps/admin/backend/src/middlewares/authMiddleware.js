// JWT authentication middleware
import { verifyToken, extractTokenFromHeader } from '../utils/auth.js';
import { unauthorizedResponse } from '../utils/response.js';

const authMiddleware = (req, res, next) => {
    try {
        let token = req.cookies?.auth_token;

        if (!token) {
            token = extractTokenFromHeader(req.headers.authorization);
        }

        if (!token) {
            return unauthorizedResponse(res, 'Access token required');
        }

        const decoded = verifyToken(token);
        req.user = decoded;
        next();
    } catch (error) {
        return unauthorizedResponse(res, 'Invalid or expired token');
    }
};

export default authMiddleware;
