// Use the current domain + /api to avoid hardcoding issues
const API_BASE_URL = window.location.origin + "/api";

document.addEventListener("DOMContentLoaded", async () => {
    console.log("Dashboard loaded. API Base:", API_BASE_URL);

    // --- 1. DOM ELEMENTS ---
    const token = localStorage.getItem("token");
    const userEmailDisplay = document.getElementById("userEmail");
    const authBtn = document.getElementById("authTopBtn");
    const dateDisplay = document.getElementById('currentDate');
    const lastPaperDisplay = document.getElementById("lastPaperText");
    const totalTimeDisplay = document.getElementById("totalTime");

    // Modals
    const logoutModal = document.getElementById('logoutModal');
    const confirmLogout = document.getElementById('confirmLogout');
    const cancelLogout = document.getElementById('cancelLogout');
    const resetModal = document.getElementById("resetModal");
    const totalResetBtn = document.getElementById("totalResetBtn");
    const confirmReset = document.getElementById("confirmReset");
    const cancelReset = document.getElementById("cancelReset");

    // --- 2. AUTH GUARD ---
    if (!token) {
        console.warn("No token found. Redirecting...");
        window.location.href = "pleaselogin.html";
        return;
    }

    // --- 3. UI INITIALIZATION (Date) ---
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    if (dateDisplay) {
        dateDisplay.textContent = new Date().toLocaleDateString(undefined, options);
    }

    // --- 4. FETCH USER DATA ---
    try {
        console.log("Attempting to fetch user data...");
        const res = await fetch(`${API_BASE_URL}/dashboard/dashboard-data`, {
            method: "GET",
            headers: { 
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });

        if (res.ok) {
            const data = await res.json();
            console.log("Data received:", data);
            
            // Check if backend sends { user: { email } } or just { email }
            if (userEmailDisplay) {
                userEmailDisplay.textContent = data.user?.email || data.email || "User Account";
            }
        } else if (res.status === 401 || res.status === 403) {
            console.error("Session expired or unauthorized.");
            localStorage.removeItem("token");
            window.location.href = "pleaselogin.html";
        } else {
            const errorData = await res.json();
            console.error("Backend error message:", errorData.message);
            if (userEmailDisplay) userEmailDisplay.textContent = "Error loading user";
        }
    } catch (err) {
        console.error("Network or Server error:", err);
        if (userEmailDisplay) userEmailDisplay.textContent = "Server Offline";
    }

    // --- 5. TIMER & LOCALSTORAGE LOGIC ---
    const updateDashboardTimer = () => {
        const lifetimeSeconds = parseInt(localStorage.getItem("lifetimeStudySeconds") || 0);
        const timerData = JSON.parse(localStorage.getItem("timerTime") || '{"h":0,"m":0,"s":0,"running":false}');
        
        let sessionSeconds = (timerData.h * 3600) + (timerData.m * 60) + timerData.s;
        if (timerData.running && timerData.startTime) {
            const elapsed = Math.floor((Date.now() - timerData.startTime) / 1000);
            sessionSeconds += elapsed;
        }

        const total = lifetimeSeconds + sessionSeconds;
        const h = String(Math.floor(total / 3600)).padStart(2, '0');
        const m = String(Math.floor((total % 3600) / 60)).padStart(2, '0');
        const s = String(total % 60).padStart(2, '0');

        if (totalTimeDisplay) totalTimeDisplay.textContent = `${h}:${m}:${s}`;
    };

    setInterval(updateDashboardTimer, 1000);
    updateDashboardTimer();

    // Load last paper from local storage
    const lastPaper = JSON.parse(localStorage.getItem("lastPaper"));
    if (lastPaper && lastPaperDisplay) {
        lastPaperDisplay.textContent = `${lastPaper.paper} (${lastPaper.year})`;
    }

    // --- 6. EVENT LISTENERS (Modals) ---
    if (authBtn) authBtn.onclick = (e) => { e.preventDefault(); logoutModal.style.display = 'flex'; };
    if (cancelLogout) cancelLogout.onclick = () => { logoutModal.style.display = 'none'; };
    if (confirmLogout) confirmLogout.onclick = () => { 
        localStorage.removeItem("token"); 
        window.location.href = "pleaselogin.html"; 
    };

    if (totalResetBtn) totalResetBtn.onclick = () => { resetModal.style.display = 'flex'; };
    if (cancelReset) cancelReset.onclick = () => { resetModal.style.display = 'none'; };
    if (confirmReset) confirmReset.onclick = () => {
        localStorage.removeItem("lifetimeStudySeconds");
        localStorage.removeItem("timerTime");
        updateDashboardTimer();
        resetModal.style.display = 'none';
    };

    // Close on outside click
    window.onclick = (event) => {
        if (event.target === logoutModal) logoutModal.style.display = 'none';
        if (event.target === resetModal) resetModal.style.display = 'none';
    };
});