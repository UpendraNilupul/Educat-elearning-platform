// backend/middleware/auth.js

// Checks if ANY user is logged in
export const requireAuth = (req, res, next) => {
    if (!req.session || !req.session.userId) {
        return res.status(401).json({ success: false, message: 'Unauthorized. Please log in.' });
    }
    next();
};

// Checks if the logged-in user is a specific role
export const requireRole = (allowedRoles) => {
    return (req, res, next) => {
        if (!req.session || !req.session.userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized.' });
        }
        
        const userRole = String(req.session.userRole || '').toLowerCase().trim();
        const hasRole = allowedRoles.map(role => String(role || '').toLowerCase().trim()).includes(userRole);
        
        console.log(`[AUTH DEBUG] URL: ${req.originalUrl}, Method: ${req.method}, userId: ${req.session.userId}, userRole: "${userRole}", allowedRoles: ${JSON.stringify(allowedRoles)}, hasRole: ${hasRole}`);
        
        if (!hasRole) {
            return res.status(403).json({ success: false, message: 'Forbidden. You do not have permission to perform this action.' });
        }
        next();
    };
};