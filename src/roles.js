export const ROLES = {
    ADMIN: { level: 100, color: '#ff0000' },
    OPERATOR: { level: 50, color: '#00ff00' },
    USER: { level: 10, color: '#00ccff' },
    GUEST: { level: 0, color: '#aaaaaa' }
};

export function checkPermission(userRole, requiredLevel) {
    return ROLES[userRole].level >= requiredLevel;
}
