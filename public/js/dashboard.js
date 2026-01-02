/* =========================================
   1. GLOBAL CONFIG & INITIALIZATION
   ========================================= */
const API_BASE_URL = "https://q-by-q.vercel.app/api";

document.addEventListener("DOMContentLoaded", async () => {
    // 1. Run Auth Check
    await checkAuth();

    // 2. Sidebar Persistence
    const sidebar = document.getElementById("sidebar");
    const toggleSidebar = document.getElementById("toggleSidebar");
    if (localStorage.getItem("sidebarCollapsed") === "true") {
        sidebar?.classList.add("collapsed");
    }

    if (toggleSidebar) {
        toggleSidebar.onclick = () => {
            sidebar.classList.toggle("collapsed");
            localStorage.setItem("sidebarCollapsed", sidebar.classList.contains("collapsed"));
        };
    }

    // 3. Initialize Dashboard Data
    updateRecentActivity();
    updateLifetimeTimer();
    setInterval(updateLifetimeTimer, 1000);

    // 4. Reset Progress Logic (The "Nuclear" Option)
    const resetModal = document.getElementById("resetModal");
    const totalResetBtn = document.getElementById("totalResetBtn");
    
    if (totalResetBtn) {
        totalResetBtn.onclick = () => resetModal.style.display = 'flex';
    }
    
    const cancelResetBtn = document.getElementById("cancelReset");
    if (cancelResetBtn) {
        cancelResetBtn.onclick = () => resetModal.style.display = 'none';
    }
    
    const confirmResetBtn = document.getElementById("confirmReset");
    if (confirmResetBtn) {
        confirmResetBtn.onclick = () => {
            // This is the ONLY place where recent activity should be cleared
            localStorage.removeItem("lastPaper");
            localStorage.removeItem("lifetimeStudySeconds");
            localStorage.removeItem("timerTime");
            localStorage.removeItem("savedQuestions");
            window.location.reload();
        };
    }
});

/* =========================================
   2. AUTH FUNCTIONS (SYNCED WITH APP.JS)
   ========================================= */
async function checkAuth() {
    let token = localStorage.getItem("token");
    
    // Clean token from potential quotes
    if (token && (token.startsWith('"') || token.startsWith("'"))) {
        token = token.substring(1, token.length - 1);
    }

    // Guard: Redirect if no valid token exists
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
            // If backend fails but token looks real, stay logged in for UI
            updateSidebarAuthBtn(true); 
            return true;
        }
    } catch (err) {
        console.error("Auth Fetch Error:", err);
        updateSidebarAuthBtn(true); 
        return true; 
    }
}

function updateSidebarAuthBtn(isLoggedIn, email = "") {
    const authBtn = document.getElementById("authTopBtn");
    const userEmailDisplay = document.getElementById("userEmail");
    if (!authBtn) return;

    if (userEmailDisplay) userEmailDisplay.textContent = email;

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

/* =========================================
   3. RECENT ACTIVITY & TIMER
   ========================================= */
function updateRecentActivity() {
    const lastPaperData = localStorage.getItem("lastPaper");
    const lastPaperText = document.getElementById("lastPaperText");
    const resumeBtn = document.getElementById("resumeStudyBtn");

    if (lastPaperData && lastPaperData !== "undefined") {
        try {
            const lastPaper = JSON.parse(lastPaperData);
            const seasonNames = { "mayjun": "May/June", "octnov": "Oct/Nov", "febmar": "Feb/Mar" };
            const displaySeason = seasonNames[lastPaper.series] || "Series";
            const displayVariant = lastPaper.variant ? lastPaper.variant.replace('v', '') : "1";
            const questionNum = (lastPaper.currentIndex || 0) + 1; 

            if (lastPaperText) {
                lastPaperText.innerHTML = `
                    <div class="activity-row-primary">
                        <span class="subject-span">${lastPaper.subject || "9709 Maths"}</span>
                        <span class="separator">/</span>
                        <span class="paper-span">${lastPaper.paperName || "Paper"}</span>
                    </div>
                    <div class="activity-row-secondary">
                        ${displaySeason} ${lastPaper.year} <span class="dot">•</span> Variant ${displayVariant}
                    </div>
                    <div class="activity-row-tertiary">
                        Question ${questionNum}
                    </div>
                `;
            }

            if (resumeBtn) {
                resumeBtn.style.display = "flex";
                resumeBtn.onclick = () => {
                    const url = `index.html?paper=${lastPaper.paper}&year=${lastPaper.year}&series=${lastPaper.series}&variant=${lastPaper.variant}&q=${lastPaper.currentIndex}`;
                    window.location.href = url;
                };
            }
        } catch (e) {
            console.error("Error parsing lastPaper:", e);
        }
    } else {
        if (lastPaperText) lastPaperText.innerHTML = `<div class="activity-row-secondary">No recent activity found. Start practicing!</div>`;
        if (resumeBtn) resumeBtn.style.display = "none";
    }
}

function updateLifetimeTimer() {
    // 1. Get the permanent bucket
    const lifetimeSeconds = parseInt(localStorage.getItem("lifetimeStudySeconds") || 0);
    
    // 2. Get the current active session
    const timerRaw = localStorage.getItem("timerTime");
    let activeSeconds = 0;

    if (timerRaw && timerRaw !== "undefined") {
        try {
            const currentSession = JSON.parse(timerRaw);
            activeSeconds = (currentSession.h * 3600) + (currentSession.m * 60) + currentSession.s;
            
            if (currentSession.running && currentSession.startTime) {
                activeSeconds += Math.floor((Date.now() - currentSession.startTime) / 1000);
            }
        } catch (e) {
            console.error("Timer parse error");
        }
    }

    // 3. The display is the sum of Permanent + Current Active
    const totalSeconds = lifetimeSeconds + activeSeconds;
    
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;

    const totalTimeDisplay = document.getElementById("totalTime");
    if (totalTimeDisplay) {
        totalTimeDisplay.textContent = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }
}

/* =========================================
   4. GLOBAL CLICK LISTENER
   ========================================= */
window.addEventListener('click', (e) => {
    const logoutModal = document.getElementById("logoutModal");
    const resetModal = document.getElementById("resetModal");
    const authBtn = e.target.closest('#authTopBtn');

    // Handle Sidebar Auth Click
    if (authBtn) {
        if (authBtn.classList.contains('logout-state')) {
            if (logoutModal) logoutModal.style.display = 'flex';
        } else {
            window.location.href = "pleaselogin.html";
        }
        return;
    }

    // Global Confirm Logout (FIXED: Preserves lastPaper)
    if (e.target.id === 'confirmLogout') {
        localStorage.removeItem("token");
        // We do NOT remove "lastPaper" here anymore so Recent Activity stays.
        window.location.href = "pleaselogin.html";
    }

    // Modal Close logic
    if (e.target === logoutModal || e.target.id === 'cancelLogout') {
        if (logoutModal) logoutModal.style.display = 'none';
    }

    if (e.target === resetModal) {
        resetModal.style.display = 'none';
    }
});

// Escape key support
document.addEventListener('keydown', (e) => {
    if (e.key === "Escape") {
        const modals = ["logoutModal", "resetModal"];
        modals.forEach(id => {
            const m = document.getElementById(id);
            if (m) m.style.display = "none";
        });
    }
});