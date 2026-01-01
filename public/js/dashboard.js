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
    const resumeBtn = document.querySelector(".btn-full"); 

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
        const res = await fetch(`${API_BASE_URL}/dashboard/dashboard-data`, {
            method: "GET",
            headers: { 
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });

        if (res.ok) {
            const data = await res.json();
            if (userEmailDisplay) {
                userEmailDisplay.textContent = data.user?.email || data.email || "User Account";
            }
        } else if (res.status === 401 || res.status === 403) {
            localStorage.removeItem("token");
            window.location.href = "pleaselogin.html";
        }
    } catch (err) {
        console.error("Network or Server error:", err);
        if (userEmailDisplay) userEmailDisplay.textContent = "Server Offline";
    }

    // --- 5. TIMER LOGIC ---
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

    // --- 6. RECENT ACTIVITY PRETTIFIER & REDIRECT ---
    const lastPaper = JSON.parse(localStorage.getItem("lastPaper"));

    if (lastPaper && lastPaper.paper) {
        // --- PRETTIFY LOGIC ---
        // 1. Component (pure3 -> Pure 3)
        const rawComp = lastPaper.paper || "";
        const formattedComp = rawComp.replace(/([a-zA-Z]+)(\d+)/, (match, p1, p2) => {
            return p1.charAt(0).toUpperCase() + p1.slice(1) + " " + p2;
        });

        // 2. Series (m_j -> May/June)
        const seriesMap = {
            'm_j': 'May/June',
            'o_n': 'Oct/Nov',
            'f_m': 'Feb/March'
        };
        const formattedSeries = seriesMap[lastPaper.series] || lastPaper.series || "";

        // 3. Variant (v2 -> Var 2)
        const formattedVar = lastPaper.variant ? lastPaper.variant.replace('v', 'Var ') : "";

        // 4. Combine into: Pure 3 | May/June 2024 | Var 2
        const displayParts = [];
        if (formattedComp) displayParts.push(formattedComp);
        if (formattedSeries || lastPaper.year) displayParts.push(`${formattedSeries} ${lastPaper.year}`.trim());
        if (formattedVar) displayParts.push(formattedVar);

        const finalDisplayStr = displayParts.join(' | ');
        const qNum = (lastPaper.questionIndex !== undefined) ? ` - Q${lastPaper.questionIndex + 1}` : "";
        
        if (lastPaperDisplay) {
            lastPaperDisplay.innerHTML = `<span style="color: #3498db; font-weight: 600;">${finalDisplayStr}</span>${qNum}`;
        }

        // --- RESUME LOGIC ---
        if (resumeBtn) {
            resumeBtn.onclick = () => {
                const params = new URLSearchParams({
                    paper: lastPaper.paper,
                    year: lastPaper.year,
                    series: lastPaper.series || "",
                    variant: lastPaper.variant || "",
                    q: lastPaper.questionIndex || 0
                });
                window.location.href = `index.html?${params.toString()}`;
            };
            resumeBtn.textContent = "Continue Last Session";
        }
    } else {
        if (lastPaperDisplay) lastPaperDisplay.textContent = "No Recent Activity";
        if (resumeBtn) {
            resumeBtn.onclick = () => window.location.href = 'index.html';
            resumeBtn.textContent = "Start Practice";
        }
    }

    // --- 7. EVENT LISTENERS (Modals) ---
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
        localStorage.removeItem("lastPaper"); 
        updateDashboardTimer();
        if (lastPaperDisplay) lastPaperDisplay.textContent = "No Recent Activity";
        resetModal.style.display = 'none';
    };

    window.onclick = (event) => {
        if (event.target === logoutModal) logoutModal.style.display = 'none';
        if (event.target === resetModal) resetModal.style.display = 'none';
    };
});