const API_BASE_URL = "https://q-by-q.vercel.app/api";
document.addEventListener("DOMContentLoaded", async () => {
    // --- 1. DOM ELEMENTS ---
    const token = localStorage.getItem("token");
    const authBtn = document.getElementById("authTopBtn");
    const userEmailDisplay = document.getElementById("userEmail");
    const dateDisplay = document.getElementById('currentDate');
    const lastPaperDisplay = document.getElementById("lastPaperText");
    const totalTimeDisplay = document.getElementById("totalTime");

    // Modal Elements (Logout)
    const logoutModal = document.getElementById('logoutModal');
    const confirmLogout = document.getElementById('confirmLogout');
    const cancelLogout = document.getElementById('cancelLogout');

    // Modal Elements (Reset)
    const resetModal = document.getElementById("resetModal");
    const totalResetBtn = document.getElementById("totalResetBtn");
    const confirmReset = document.getElementById("confirmReset");
    const cancelReset = document.getElementById("cancelReset");

    // --- 2. AUTH GUARD ---
    if (!token) {
        window.location.href = "pleaselogin.html";
        return;
    }

    // --- 3. UI INITIALIZATION (Date & User) ---
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    if (dateDisplay) {
        dateDisplay.textContent = new Date().toLocaleDateString(undefined, options);
    }

    try {
        const res = await fetch("https://q-by-q.vercel.app/api/dashboard/dashboard-data", {
            headers: { "Authorization": `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok && userEmailDisplay) {
            userEmailDisplay.textContent = data.user.email;
        } else if (res.status === 401) {
            localStorage.removeItem("token");
            window.location.href = "pleaselogin.html";
        }
    } catch (err) {
        if (userEmailDisplay) userEmailDisplay.textContent = "Offline Mode";
    }

    // --- 4. LOAD LAST PAPER STATS ---
    const lastPaper = JSON.parse(localStorage.getItem("lastPaper"));
    if (lastPaper && lastPaperDisplay) {
        const paperName = lastPaper.paper.charAt(0).toUpperCase() + 
                          lastPaper.paper.slice(1).replace(/(\d)/, ' $1');
        lastPaperDisplay.textContent = `${paperName} (${lastPaper.year})`;
    }

    // --- 5. PERSISTENT TICKING TIMER LOGIC ---
    const updateDashboardTimer = () => {
        // Get banked "lifetime" seconds
        const lifetimeSeconds = parseInt(localStorage.getItem("lifetimeStudySeconds") || 0);
        
        // Get active session data
        const data = JSON.parse(localStorage.getItem("timerTime")) || { h: 0, m: 0, s: 0, startTime: null, running: false };
        
        // Calculate session seconds (base time + live elapsed if running)
        let sessionSeconds = (data.h * 3600) + (data.m * 60) + data.s;
        if (data.running && data.startTime) {
            const elapsedSinceStart = Math.floor((Date.now() - data.startTime) / 1000);
            sessionSeconds += elapsedSinceStart;
        }

        const totalSeconds = lifetimeSeconds + sessionSeconds;

        // Convert to HH:MM:SS
        const h = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
        const m = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
        const s = String(totalSeconds % 60).padStart(2, '0');

        if (totalTimeDisplay) {
            totalTimeDisplay.textContent = `${h}:${m}:${s}`;
        }
    };

    // Start the interval immediately
    updateDashboardTimer();
    setInterval(updateDashboardTimer, 1000);

    // --- 6. LOGOUT MODAL LOGIC ---
    if (authBtn) {
        authBtn.onclick = (e) => {
            e.preventDefault();
            if (logoutModal) logoutModal.style.display = 'flex';
        };
    }

    if (confirmLogout) {
        confirmLogout.onclick = () => {
            localStorage.removeItem("token");
            window.location.href = "pleaselogin.html";
        };
    }

    if (cancelLogout) {
        cancelLogout.onclick = () => {
            logoutModal.style.display = 'none';
        };
    }

    // --- 7. TOTAL RESET MODAL LOGIC ---
    if (totalResetBtn) {
        totalResetBtn.onclick = () => {
            if (resetModal) resetModal.style.display = 'flex';
        };
    }

    if (confirmReset) {
        confirmReset.onclick = () => {
            // Wipe all time-related storage
            localStorage.removeItem("lifetimeStudySeconds");
            localStorage.removeItem("timerTime");
            
            // Instantly update UI and close
            updateDashboardTimer();
            if (resetModal) resetModal.style.display = 'none';
        };
    }

    if (cancelReset) {
        cancelReset.onclick = () => {
            if (resetModal) resetModal.style.display = 'none';
        };
    }

    // --- 8. GLOBAL MODAL CLICK-OUTSIDE ---
    window.onclick = (event) => {
        if (event.target === logoutModal) logoutModal.style.display = 'none';
        if (event.target === resetModal) resetModal.style.display = 'none';
    };
});