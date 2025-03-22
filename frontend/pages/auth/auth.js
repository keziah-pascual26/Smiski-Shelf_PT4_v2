export function getUsername() {
    return localStorage.getItem('username') || 'Guest'; // Default to 'Guest' if no username is found
}