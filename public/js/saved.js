/* =========================================
   1. AUTHENTICATION GUARD & SIDEBAR
   ========================================= */
(async function() {
    const token = localStorage.getItem("token");
    const authBtn = document.getElementById("authTopBtn");

    if (!token) {
        if (authBtn) {
            authBtn.innerHTML = `<i class="fas fa-sign-in-alt"></i> Login`;
            authBtn.className = "auth-btn login-state";
        }
        window.location.href = "pleaselogin.html";
        return;
    }

    // Set initial button state to Logout
    if (authBtn) {
        authBtn.innerHTML = `<i class="fas fa-sign-out-alt"></i> Logout`;
        authBtn.className = "auth-btn logout-state";
    }

    try {
        const res = await fetch("https://q-by-q.vercel.app/api/dashboard/dashboard-data", {
            headers: { "Authorization": `Bearer ${token}` }
        });
        if (!res.ok && (res.status === 401 || res.status === 403)) {
            localStorage.removeItem("token");
            window.location.href = "pleaselogin.html";
        }
    } catch (err) {
        console.warn("Auth server unreachable. Working in local mode.");
    }
})();

/* =========================================
   2. MAIN PAGE LOGIC
   ========================================= */
document.addEventListener('DOMContentLoaded', () => {
    // UI Elements
    const savedGrid = document.getElementById('savedGrid');
    const emptyState = document.getElementById('emptyState');
    const modal = document.getElementById('previewModal');
    const closeModal = document.querySelector('.close-modal');
    
    // Your Specific Modal Elements
    const logoutModal = document.getElementById('logoutModal');
    const confirmLogout = document.getElementById('confirmLogout');
    const cancelLogout = document.getElementById('cancelLogout');
    const authBtn = document.getElementById("authTopBtn");
    
    const clearAllBtn = document.getElementById('clearAllBtn');
    const clearAllModal = document.getElementById('clearAllModal');
    const confirmClearBtn = document.getElementById('confirmClearBtn');
    const cancelClearBtn = document.getElementById('cancelClearBtn');

    let savedQuestions = JSON.parse(localStorage.getItem('savedQuestions')) || [];

    // --- INTEGRATED LOGOUT LOGIC ---
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
    if (cancelLogout) {
        cancelLogout.onclick = () => {
            logoutModal.style.display = 'none';
        };
    }

    // --- DATA HANDLING ---
    function checkEmpty() {
        if (!savedQuestions || savedQuestions.length === 0) {
            if (emptyState) emptyState.style.display = 'block';
            if (savedGrid) {
                savedGrid.style.display = 'none';
                savedGrid.innerHTML = '';
            }
        } else {
            if (emptyState) emptyState.style.display = 'none';
            if (savedGrid) {
                savedGrid.style.display = 'grid';
                renderSavedQuestions();
            }
        }
    }

    function renderSavedQuestions() {
        if (!savedGrid) return;
        savedGrid.innerHTML = '';
        
        savedQuestions.forEach((q, index) => {
            const card = document.createElement('div');
            card.className = 'saved-card';
            card.innerHTML = `
                <button class="btn-remove" onclick="removeSaved(${index})">
                    <i class="fas fa-trash"></i>
                </button>
                <div class="card-badges">
                    <span class="badge" style="color: #3498db">Math 9709</span>
                    <span class="badge">${(q.paper || "QP").toUpperCase()}</span>
                </div>
                <h3>Question ${q.questionNum}</h3>
                <p style="margin-bottom: 1rem; color: #64748b; font-size: 0.9rem;">
                    Var ${q.variant} | ${q.season} ${q.year}
                </p>
                <div class="card-actions">
                    <button class="btn-view" onclick="openPreview(${index})">
                        <i class="fas fa-eye"></i> Preview
                    </button>
                    <button class="btn-view secondary" onclick="jumpToPractice(${index})">
                        <i class="fas fa-external-link-alt"></i> Practice
                    </button>
                </div>
            `;
            savedGrid.appendChild(card);
        });
    }

    // --- NAVIGATION TO PRACTICE ---
    window.jumpToPractice = (index) => {
        const q = savedQuestions[index];
        // Ensure index.html loads the correct paper
        const lastPaperState = {
            subject: q.subjectVal || "9709",
            paper: q.paper,
            year: q.year,
            series: q.season,
            variant: "v" + q.variant,
            currentIndex: 0 
        };
        
        localStorage.setItem('lastPaper', JSON.stringify(lastPaperState));
        localStorage.setItem('jumpToQuestion', JSON.stringify({ num: q.questionNum }));
        window.location.href = "index.html"; 
    };

    // --- PREVIEW LOGIC ---
    window.openPreview = async (index) => {
        const q = savedQuestions[index];
        const modalImages = document.getElementById('modalImages');
        const modalMS = document.getElementById('modalMS');
        const modalTitle = document.getElementById('modalTitle');
        
        modalTitle.textContent = `Question ${q.questionNum}`;
        modalImages.innerHTML = '<p>Loading...</p>';
        modalMS.innerHTML = '';
        modalMS.style.display = 'none';

        const season = q.season || q.sea;
        const yearCode = (season === "febmar" ? "m" : season === "mayjun" ? "s" : "w") + q.year.toString().slice(-2);
        const paperMap = { pure1: "1", pure3: "3", mechanics: "4", stats1: "5" };
        const pNum = paperMap[q.paper?.toLowerCase()] || q.paper?.replace(/\D/g, '') || "1";
        const paperCode = pNum + q.variant;

        const qFileBase = `images/${q.subjectVal || '9709'}_${yearCode}_qp_${paperCode}_q${q.questionNum}`;
        const mFileBase = `images/${q.subjectVal || '9709'}_${yearCode}_ms_${paperCode}_q${q.questionNum}`;

        const parts = ["", "a", "b", "c", "d", "e", "f", "g"];
        let found = false;

        for (const char of parts) {
            const qPath = `${qFileBase}${char}.PNG`;
            try {
                await new Promise((resolve, reject) => {
                    const img = new Image();
                    img.onload = () => {
                        if(!found) { modalImages.innerHTML = ''; found = true; }
                        const qImg = document.createElement('img');
                        qImg.src = qPath; qImg.className = "preview-img";
                        modalImages.appendChild(qImg);
                        
                        const mImg = document.createElement('img');
                        mImg.src = `${mFileBase}${char}.PNG`;
                        mImg.className = "preview-img";
                        modalMS.appendChild(mImg);
                        resolve();
                    };
                    img.onerror = reject;
                    img.src = qPath;
                });
            } catch(e) { if(char !== "") break; }
        }
        modal.style.display = "block";
    };

    window.removeSaved = (index) => {
        savedQuestions.splice(index, 1);
        localStorage.setItem('savedQuestions', JSON.stringify(savedQuestions));
        checkEmpty(); 
    };

    if (closeModal) closeModal.onclick = () => modal.style.display = "none";
    
    // Close on outside click
    window.onclick = (e) => {
        if (e.target === logoutModal) logoutModal.style.display = 'none';
        if (e.target === modal) modal.style.display = 'none';
    };

    checkEmpty();
});