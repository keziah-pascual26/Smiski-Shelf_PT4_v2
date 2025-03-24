// Profile Section Component
document.addEventListener('DOMContentLoaded', function() {
    initializeProfileSection();
});

async function initializeProfileSection() {
    const profileSection = document.getElementById('profileSection');
    
    if (!profileSection) {
        console.error('Profile section element not found');
        return;
    }
    
    // Get the token from localStorage
    const token = localStorage.getItem('token');
    if (!token) {
        console.error('No authentication token found');
        return;
    }
    
    try {
        // Fetch user profile data
        const response = await fetch('http://localhost:3000/api/user/profile', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch profile data');
        }
        
        const userData = await response.json();
        
        // Get user stats - this would be a separate endpoint in a real app
        const statsResponse = await fetch('http://localhost:3000/api/user/stats', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        }).catch(() => {
            // If the endpoint doesn't exist yet, we'll use dummy data
            return { 
                ok: false
            };
        });
        
        let stats = {
            posts: 0,
            friends: 0,
            stories: 0
        };
        
        if (statsResponse && statsResponse.ok) {
            stats = await statsResponse.json();
        }
        
        // Create profile section HTML with enhanced link styling
        const username = userData.username || localStorage.getItem('username') || 'User';
        
        // Detect current page to highlight active link
        const currentPath = window.location.pathname;
        const isDashboard = currentPath.includes('/dashboard');
        const isSettings = currentPath.includes('/settings');
        const isSecurity = currentPath.includes('/settings') && window.location.hash === '#security';
        
        const profileHtml = `
            <div class="profile-card">
                <img src="${userData.profilePicture || '/public/no-profile.png'}" alt="Profile Picture" class="profile-picture">
                <h3 class="profile-username">${username}</h3>
                <p class="profile-bio">${userData.bio || 'Welcome to my Smiski Shelf profile!'}</p>
                
                <div class="profile-stats">
                    <div class="stat-item">
                        <span class="stat-value">${stats.posts}</span>
                        <span class="stat-label">Posts</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-value">${stats.friends}</span>
                        <span class="stat-label">Friends</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-value">${stats.stories}</span>
                        <span class="stat-label">Stories</span>
                    </div>
                </div>
                
                <div class="profile-actions">
                    <button class="profile-edit-btn" id="editProfileBtn">Edit Profile</button>
                </div>
            </div>
            
            <div class="profile-links">
                <ul>
                    <li>
                        <a href="/pages/dashboard/dashboard.html" class="${isDashboard ? 'active' : ''}">
                            <i class="fas fa-home"></i>
                            <span>Home</span>
                        </a>
                    </li>
                    <li>
                        <a href="/pages/settings/settings.html" class="${isSettings && !isSecurity ? 'active' : ''}">
                            <i class="fas fa-cog"></i>
                            <span>Settings</span>
                        </a>
                    </li>
                    <li>
                        <a href="/pages/settings/settings.html#security" class="${isSecurity ? 'active' : ''}">
                            <i class="fas fa-shield-alt"></i>
                            <span>Security</span>
                            ${userData.twoFactorEnabled ? '' : '<span class="count-badge">!</span>'}
                        </a>
                    </li>
                </ul>
            </div>
        `;
        
        profileSection.innerHTML = profileHtml;
        
        // Add event listener for the edit profile button
        document.getElementById('editProfileBtn').addEventListener('click', function() {
            window.location.href = '/pages/userprofile/userprofile.html';
        });
        
    } catch (error) {
        console.error('Error loading profile:', error);
        
        // Fallback with basic information if API fails
        const username = localStorage.getItem('username') || 'User';
        
        // Detect current page to highlight active link
        const currentPath = window.location.pathname;
        const isDashboard = currentPath.includes('/dashboard');
        const isSettings = currentPath.includes('/settings');
        const isSecurity = currentPath.includes('/settings') && window.location.hash === '#security';
        
        profileSection.innerHTML = `
            <div class="profile-card">
                <img src="/public/no-profile.png" alt="Profile Picture" class="profile-picture">
                <h3 class="profile-username">${username}</h3>
                <p class="profile-bio">Welcome to my Smiski Shelf profile!</p>
                
                <div class="profile-stats">
                    <div class="stat-item">
                        <span class="stat-value">0</span>
                        <span class="stat-label">Posts</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-value">0</span>
                        <span class="stat-label">Friends</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-value">0</span>
                        <span class="stat-label">Stories</span>
                    </div>
                </div>
                
                <div class="profile-actions">
                    <button class="profile-edit-btn" id="editProfileBtn">Edit Profile</button>
                </div>
            </div>
            
            <div class="profile-links">
                <ul>
                    <li>
                        <a href="/pages/dashboard/dashboard.html" class="${isDashboard ? 'active' : ''}">
                            <i class="fas fa-home"></i>
                            <span>Home</span>
                        </a>
                    </li>
                    <li>
                        <a href="/pages/settings/settings.html" class="${isSettings && !isSecurity ? 'active' : ''}">
                            <i class="fas fa-cog"></i>
                            <span>Settings</span>
                        </a>
                    </li>
                    <li>
                        <a href="/pages/settings/settings.html#security" class="${isSecurity ? 'active' : ''}">
                            <i class="fas fa-shield-alt"></i>
                            <span>Security</span>
                            <span class="count-badge">!</span>
                        </a>
                    </li>
                </ul>
            </div>
        `;
        
        // Add event listener for the edit profile button
        document.getElementById('editProfileBtn').addEventListener('click', function() {
            window.location.href = '/pages/settings/settings.html#profile';
        });
    }
}
