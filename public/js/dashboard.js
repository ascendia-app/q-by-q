const API_BASE_URL = "/api"; // Best for Vercel relative routing

document.addEventListener("DOMContentLoaded", async () => {
    const token = localStorage.getItem("token");
    const userEmailDisplay = document.getElementById("userEmail");
    const lastPaperDisplay = document.getElementById("lastPaperText");
    const resumeBtn = document.querySelector(".btn-full");
    const totalTimeDisplay = document.getElementById("totalTime");

    if (!token) {
        window.location.href = "pleaselogin.html";
        return;
    }

    // --- 1. FETCH USER DATA ---
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
        if (userEmailDisplay) userEmailDisplay.textContent = "Server Offline";
    }

    // --- 2. RECENT ACTIVITY PRETTIFIER ---
   // --- RECENT ACTIVITY PRETTIFIER ---
const lastPaper = JSON.parse(localStorage.getItem("lastPaper"));

if (lastPaper && lastPaper.paper) {
    // 1. Format Component: "pure3" -> "Pure 3"
    const formattedComp = lastPaper.paper.replace(/([a-zA-Z]+)(\d+)/, (match, p1, p2) => {
        return p1.charAt(0).toUpperCase() + p1.slice(1) + " " + p2;
    });

    // 2. Format Series: "m_j" -> "May/June"
    const seriesMap = { 
        'm_j': 'May/June', 
        'o_n': 'Oct/Nov', 
        'f_m': 'Feb/March' 
    };
    const formattedSeries = seriesMap[lastPaper.series] || lastPaper.series || "";

    // 3. Format Variant: "v2" -> "Var 2"
    const formattedVar = lastPaper.variant ? lastPaper.variant.replace('v', 'Var ') : "";

    // 4. Combine into: Pure 3 | May/June 2024 | Var 2
    const displayParts = [];
    if (formattedComp) displayParts.push(formattedComp);
    if (formattedSeries || lastPaper.year) displayParts.push(`${formattedSeries} ${lastPaper.year}`.trim());
    if (formattedVar) displayParts.push(formattedVar);

    const finalDisplayStr = displayParts.join(' | '); // Adds the " | " separator
    const qNum = (lastPaper.questionIndex !== undefined) ? ` (Q${lastPaper.questionIndex + 1})` : "";

    if (lastPaperDisplay) {
        // Apply the blue color and bold weight to the formatted string
        lastPaperDisplay.innerHTML = `
            <span style="color: #3498db; font-weight: 700;">${finalDisplayStr}</span>
            <span style="font-size: 0.85rem; display: block; color: #7f8c8d; margin-top: 5px;">Progress: ${qNum || 'Start'}</span>
        `;
    }

    // Resume Button Logic
    if (resumeBtn) {
        resumeBtn.onclick = () => {
            const q = lastPaper.questionIndex || 0;
            window.location.href = `index.html?paper=${lastPaper.paper}&year=${lastPaper.year}&series=${lastPaper.series}&variant=${lastPaper.variant}&q=${q}`;
        };
    }
} else {
    if (lastPaperDisplay) lastPaperDisplay.textContent = "No Recent Activity";
}

    // --- 3. TIMER LOGIC ---
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