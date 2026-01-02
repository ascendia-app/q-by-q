const API_BASE_URL = "https://q-by-q.vercel.app/api"; // Updated to your absolute URL

document.addEventListener("DOMContentLoaded", async () => {
    // --- 1. ELEMENT SELECTIONS ---
    const token = localStorage.getItem("token");
    const userEmailDisplay = document.getElementById("userEmail");
    const lastPaperDisplay = document.getElementById("lastPaperText");
    const resumeBtn = document.querySelector(".btn-full");
    const totalTimeDisplay = document.getElementById("totalTime");
    
    // Auth/Logout Elements
    const authBtn = document.getElementById("authTopBtn");
    const logoutModal = document.getElementById('logoutModal');
    const confirmLogout = document.getElementById('confirmLogout');
    const cancelLogout = document.getElementById('cancelLogout');

    // --- 2. AUTH GUARD ---
    if (!token) {
        window.location.href = "pleaselogin.html";
        return;
    }

    // --- 3. FETCH USER DATA ---
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
            if (userEmailDisplay) userEmailDisplay.textContent = data.user?.email || "User Account";
        } else {
            if (userEmailDisplay) userEmailDisplay.textContent = "Error loading user";
        }
    } catch (err) {
        console.warn("Server offline, using local data.");
        if (userEmailDisplay) userEmailDisplay.textContent = "Offline Mode";
    }

    // --- 4. LOGOUT MODAL LOGIC ---
    if (authBtn) {
        authBtn.onclick = (e) => {
            e.preventDefault();
            if (authBtn.classList.contains('logout-state')) {
                if (logoutModal) logoutModal.style.display = 'flex';
            } else {
                window.location.href = 'login.html';
            }
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
            if (logoutModal) logoutModal.style.display = 'none';
        };
    }

    // Global click to close modal
    window.addEventListener('click', (e) => {
        if (e.target === logoutModal) logoutModal.style.display = 'none';
    });

    // --- 5. RECENT ACTIVITY PRETTIFIER ---
    const lastPaper = JSON.parse(localStorage.getItem("lastPaper"));

    if (lastPaper && lastPaper.paper) {
        const formattedComp = lastPaper.paper.replace(/([a-zA-Z]+)(\d+)/, (match, p1, p2) => {
            return p1.charAt(0).toUpperCase() + p1.slice(1) + " " + p2;
        });

        const seriesMap = { 
            'mayjun': 'May/June', 'octnov': 'Oct/Nov', 'febmar': 'Feb/March',
            'm_j': 'May/June', 'o_n': 'Oct/Nov', 'f_m': 'Feb/March' 
        };
        const rawSeries = lastPaper.series || lastPaper.season || "";
        const formattedSeries = seriesMap[rawSeries] || rawSeries;
        const formattedVar = lastPaper.variant ? lastPaper.variant.replace('v', 'Var ') : "";

        const displayParts = [];
        if (formattedComp) displayParts.push(formattedComp);
        if (formattedSeries || lastPaper.year) displayParts.push(`${formattedSeries} ${lastPaper.year}`.trim());
        if (formattedVar) displayParts.push(formattedVar);

        const finalDisplayStr = displayParts.join(' | '); 
        const qIndex = lastPaper.currentIndex !== undefined ? lastPaper.currentIndex : 0;

        if (lastPaperDisplay) {
            lastPaperDisplay.innerHTML = `
                <span style="color: #3498db; font-weight: 700;">${finalDisplayStr}</span>
                <span style="font-size: 0.85rem; display: block; color: #7f8c8d; margin-top: 5px;">Progress: Q${qIndex + 1}</span>
            `;
        }

        if (resumeBtn) {
            resumeBtn.onclick = (e) => {
                e.preventDefault();
                window.location.href = `index.html?paper=${lastPaper.paper}&year=${lastPaper.year}&series=${rawSeries}&variant=${lastPaper.variant}&q=${qIndex}`;
            };
            resumeBtn.textContent = "Continue Session";
        }
    } else {
        if (lastPaperDisplay) lastPaperDisplay.textContent = "No Recent Activity";
    }

    // --- 6. TIMER DISPLAY ---
    const updateTimer = () => {
        const lifetime = parseInt(localStorage.getItem("lifetimeStudySeconds") || 0);
        const timerData = JSON.parse(localStorage.getItem("timerTime") || '{"h":0,"m":0,"s":0,"running":false}');
        let session = (timerData.h * 3600) + (timerData.m * 60) + timerData.s;
        
        if (timerData.running && timerData.startTime) {
            session += Math.floor((Date.now() - timerData.startTime) / 1000);
        }
        
        const total = lifetime + session;
        const h = String(Math.floor(total / 3600)).padStart(2, '0');
        const m = String(Math.floor((total % 3600) / 60)).padStart(2, '0');
        const s = String(total % 60).padStart(2, '0');
        
        if (totalTimeDisplay) totalTimeDisplay.textContent = `${h}:${m}:${s}`;
    };
    
    setInterval(updateTimer, 1000);
    updateTimer();
});
    // Close on outside click
    window.onclick = (e) => {
        if (e.target === logoutModal) logoutModal.style.display = 'none';
        if (e.target === modal) modal.style.display = 'none';
    };

    checkEmpty();

  const logoutModal = document.getElementById('logoutModal');
    const confirmLogout = document.getElementById('confirmLogout');
    const cancelLogout = document.getElementById('cancelLogout');
    const authBtn = document.getElementById("authTopBtn");

    if (authBtn) {
        authBtn.onclick = () => {
            if (authBtn.classList.contains('logout-state')) {
                logoutModal.style.display = 'flex';
            } else {
                window.location.href = 'login.html';
            }
        };
    }
    if (confirmLogout) {
        confirmLogout.onclick = () => {
            localStorage.removeItem("token");
            window.location.href = "pleaselogin.html";
        };
    }
    if (cancelLogout) cancelLogout.onclick = () => logoutModal.style.display = 'none';