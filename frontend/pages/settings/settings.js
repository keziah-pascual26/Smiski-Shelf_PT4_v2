document.addEventListener('DOMContentLoaded', function() {
    // Check authentication
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/pages/login/login.html';
        return;
    }

    /*
    // Add logout functionality
    document.getElementById('logout-btn').addEventListener('click', function(e) {
        e.preventDefault();
        localStorage.removeItem('token');
        localStorage.removeItem('username');
        window.location.href = '/pages/login/login.html';
    });
    */
    // Check 2FA status
    checkTwoFactorStatus();
});

// Function to check if 2FA is enabled
async function checkTwoFactorStatus() {
    const token = localStorage.getItem('token');
    const statusElement = document.getElementById('twoFactorStatus');
    
    try {
        const response = await fetch('http://localhost:3000/2fa/status', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch 2FA status');
        }
        
        const data = await response.json();
        
        if (data.twoFactorEnabled) {
            // 2FA is enabled
            statusElement.innerHTML = `
                <div class="status-indicator">
                    <span class="status-dot enabled"></span>
                    <span>Two-factor authentication is enabled</span>
                </div>
                <button id="disableBtn" class="btn-danger">Disable Two-Factor Authentication</button>
            `;
            
            // Add event listener to disable button
            document.getElementById('disableBtn').addEventListener('click', disableTwoFactor);
        } else {
            // 2FA is disabled
            statusElement.innerHTML = `
                <div class="status-indicator">
                    <span class="status-dot disabled"></span>
                    <span>Two-factor authentication is disabled</span>
                </div>
                <button id="setupBtn" class="btn-primary">Set Up Two-Factor Authentication</button>
            `;
            
            // Add event listener to setup button
            document.getElementById('setupBtn').addEventListener('click', setupTwoFactor);
        }
    } catch (error) {
        console.error('Error checking 2FA status:', error);
        statusElement.innerHTML = `
            <div class="error">Failed to load two-factor authentication status: ${error.message}</div>
        `;
    }
}
// Function to set up 2FA
async function setupTwoFactor() {
    const token = localStorage.getItem('token');
    
    try {
        const response = await fetch('http://localhost:3000/2fa/setup', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to set up 2FA');
        }
        
        const data = await response.json();
        
        // Display QR code
        const qrCodeContainer = document.getElementById('qrCodeContainer');
        qrCodeContainer.innerHTML = `<img src="${data.qrCodeUrl}" alt="QR Code">`;
        
        // Show setup section
        document.getElementById('twoFactorSetup').style.display = 'block';
        
        // Add event listener to verify button
        document.getElementById('verifyBtn').addEventListener('click', verifyAndEnableTwoFactor);
    } catch (error) {
        console.error('Error setting up 2FA:', error);
        alert('Failed to set up two-factor authentication: ' + error.message);
    }
}

// Function to verify and enable 2FA
async function verifyAndEnableTwoFactor() {
    const token = localStorage.getItem('token');
    const verificationCode = document.getElementById('verificationCode').value;
    
    if (!verificationCode) {
        alert('Please enter the verification code from your authenticator app.');
        return;
    }
    
    try {
        const response = await fetch('http://localhost:3000/2fa/verify', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ token: verificationCode })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Verification failed');
        }
        
        alert('Two-factor authentication has been enabled successfully!');
        
        // Reset and update UI
        document.getElementById('twoFactorSetup').style.display = 'none';
        document.getElementById('verificationCode').value = '';
        checkTwoFactorStatus();
    } catch (error) {
        console.error('Error verifying 2FA:', error);
        alert('Verification failed: ' + error.message);
    }
}

// Function to disable 2FA
async function disableTwoFactor() {
    if (!confirm('Are you sure you want to disable two-factor authentication? This will make your account less secure.')) {
        return;
    }
    
    const token = localStorage.getItem('token');
    
    try {
        const response = await fetch('http://localhost:3000/2fa/disable', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Failed to disable 2FA');
        }
        
        alert('Two-factor authentication has been disabled.');
        checkTwoFactorStatus();
    } catch (error) {
        console.error('Error disabling 2FA:', error);
        alert('Failed to disable two-factor authentication: ' + error.message);
    }
}
