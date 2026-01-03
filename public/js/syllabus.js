/* =========================================
   1. CONFIGURATION & AUTHENTICATION
   ========================================= */
const API_BASE_URL = "https://q-by-q.vercel.app/api";

/**
 * Sanitizes token and verifies with backend.
 * Updates sidebar UI and redirects if session is invalid.
 */
async function checkAuth() {
    let token = localStorage.getItem("token");
    
    // Clean token of extra quotes
    if (token && (token.startsWith('"') || token.startsWith("'"))) {
        token = token.substring(1, token.length - 1);
    }

    // If no token, redirect to login
    if (!token || token === "null" || token === "undefined" || token.length < 20) {
        updateSidebarAuthBtn(false);
        window.location.href = "pleaselogin.html"; 
        return false; 
    }

    try {
        const res = await fetch(`${API_BASE_URL}/auth/verify`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });

        if (res.ok) {
            const data = await res.json();
            updateSidebarAuthBtn(true, data.email);
            return true;
        } else {
            // Token expired or invalid
            updateSidebarAuthBtn(false);
            window.location.href = "pleaselogin.html";
            return false;
        }
    } catch (err) {
        console.error("Auth Fetch Error:", err);
        // On server error, we allow the UI to show logged in to prevent loop, 
        // but typically you'd handle this based on your security needs.
        updateSidebarAuthBtn(true); 
        return true; 
    }
}

function updateSidebarAuthBtn(isLoggedIn, email = "") {
    const authBtn = document.getElementById("authTopBtn");

    if (!authBtn) return;


    if (isLoggedIn) {
        authBtn.classList.add("logout-state");
        authBtn.classList.remove("login-state");
        authBtn.innerHTML = `
            <div class="icon-box"><i class="fas fa-sign-out-alt"></i></div>
            <span class="nav-text">Logout</span>
        `;
    } else {
        authBtn.classList.add("login-state");
        authBtn.classList.remove("logout-state");
        authBtn.innerHTML = `
            <div class="icon-box"><i class="fas fa-sign-in-alt"></i></div>
            <span class="nav-text">Login</span>
        `;
    }
}

/**
 * Handles clicks specifically for the Auth Button and Logout Modal
 */
function handleAuthEvents(e) {
    const logoutModal = document.getElementById('logoutModal');
    const authBtn = e.target.closest('#authTopBtn');

    if (authBtn) {
        if (authBtn.classList.contains('logout-state')) {
            if (logoutModal) logoutModal.style.display = 'flex';
        } else {
            window.location.href = "pleaselogin.html";
        }
        return;
    }

    if (e.target.id === 'confirmLogout') {
        localStorage.removeItem("token");
        localStorage.removeItem("lastPaper"); 
        window.location.href = "pleaselogin.html";
    }

    if (e.target.id === 'cancelLogout' || e.target === logoutModal) {
        if (logoutModal) logoutModal.style.display = 'none';
    }
}

/* =========================================
   2. MAIN SYLLABUS LOGIC
   ========================================= */

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Initial Setup
    await checkAuth();
    loadSyllabusData();
    updateProgress();

    // 2. Initial MathJax Rendering
    if (window.MathJax) {
        window.MathJax.typesetPromise().catch((err) => console.log('MathJax failed: ', err));
    }

    // 3. Handle "Load Progress" Button
    const loadBtn = document.getElementById('loadSyllabusBtn');
    if (loadBtn) {
        loadBtn.addEventListener('click', () => {
            const icon = loadBtn.querySelector('i');
            icon.classList.add('spinning');
            
            loadSyllabusData();
            updateProgress();

            if (window.MathJax) {
                window.MathJax.typesetPromise();
            }
            
            setTimeout(() => {
                icon.classList.remove('spinning');
            }, 600);
        });
    }

    // 4. Handle Confidence Dot Clicks
    document.addEventListener('click', (e) => {
        const wrapper = e.target.closest('.dot-wrapper');
        
        if (wrapper) {
            const dot = wrapper.querySelector('.dot');
            const group = wrapper.closest('.confidence-dots');
            const allWrappersInGroup = group.querySelectorAll('.dot-wrapper');
            const allDotsInGroup = group.querySelectorAll('.dot');
            
            if (dot.classList.contains('active')) {
                dot.classList.remove('active');
                wrapper.classList.remove('active');
            } else {
                allDotsInGroup.forEach(d => d.classList.remove('active'));
                allWrappersInGroup.forEach(w => w.classList.remove('active'));
                
                dot.classList.add('active');
                wrapper.classList.add('active');
            }
            
            saveSyllabusData(); 
            updateProgress();
        }
    });

    // 5. Auth Event Listener
    document.addEventListener('click', handleAuthEvents);
});

/* =========================================
   3. DATA PERSISTENCE & UI UPDATES
   ========================================= */

function updateProgress() {
    const subtopics = document.querySelectorAll('.subtopic-item');
    let totalScore = 0;
    const count = subtopics.length;
    const maxPossibleScore = count * 100;

    subtopics.forEach(item => {
        const activeDot = item.querySelector('.dot.active');
        if (activeDot) {
            if (activeDot.classList.contains('green')) totalScore += 100;
            else if (activeDot.classList.contains('yellow')) totalScore += 50;
            else if (activeDot.classList.contains('red')) totalScore += 10;
        }
    });

    const percentage = maxPossibleScore > 0 ? Math.round((totalScore / maxPossibleScore) * 100) : 0;
    const fill = document.getElementById('progressFill');
    const rateText = document.getElementById('completionRate');
    
    if (fill && rateText) {
        fill.style.width = percentage + '%';
        rateText.innerText = `${percentage}% Confidence`;

        if (percentage < 30) fill.style.background = '#ef4444';
        else if (percentage < 70) fill.style.background = '#f59e0b';
        else fill.style.background = '#22c55e';
    }
}

function saveSyllabusData() {
    const syllabusState = { confidence: {} };

    document.querySelectorAll('.confidence-dots').forEach((group, index) => {
        const activeDot = group.querySelector('.dot.active');
        if (activeDot) {
            const color = activeDot.classList.contains('red') ? 'red' : 
                          activeDot.classList.contains('yellow') ? 'yellow' : 'green';
            syllabusState.confidence[`conf-${index}`] = color;
        }
    });

    localStorage.setItem('syllabus_p3_data', JSON.stringify(syllabusState));
}

function loadSyllabusData() {
    const saved = localStorage.getItem('syllabus_p3_data');
    if (!saved) return;

    const data = JSON.parse(saved);
    document.querySelectorAll('.dot').forEach(d => d.classList.remove('active'));
    document.querySelectorAll('.dot-wrapper').forEach(w => w.classList.remove('active'));

    document.querySelectorAll('.confidence-dots').forEach((group, index) => {
        const savedColor = data.confidence[`conf-${index}`];
        if (savedColor) {
            const dot = group.querySelector(`.dot.${savedColor}`);
            const wrapper = dot?.closest('.dot-wrapper');
            if (dot && wrapper) {
                dot.classList.add('active');
                wrapper.classList.add('active');
            }
        }
    });
}