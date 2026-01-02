/* =========================================
   1. AUTHENTICATION GUARD
   ========================================= */
(async function() {
    const token = localStorage.getItem("token");
    if (!token) {
        window.location.href = "pleaselogin.html";
        return;
    }

    try {
        // FIXED: Use absolute URL to match your app.js
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
    const savedGrid = document.getElementById('savedGrid');
    const emptyState = document.getElementById('emptyState');
    const modal = document.getElementById('previewModal');
    const closeModal = document.querySelector('.close-modal');
    const authBtn = document.getElementById("authTopBtn");
    
    const clearAllBtn = document.getElementById('clearAllBtn');
    const clearAllModal = document.getElementById('clearAllModal');
    const confirmClearBtn = document.getElementById('confirmClearBtn');
    const cancelClearBtn = document.getElementById('cancelClearBtn');

    let savedQuestions = JSON.parse(localStorage.getItem('savedQuestions')) || [];

    // --- AUTH UI ---
    if (authBtn) {
        // Check if token exists to set initial state
        const hasToken = !!localStorage.getItem("token");
        authBtn.innerHTML = hasToken ? `<i class="fas fa-sign-out-alt"></i> Logout` : `<i class="fas fa-sign-in-alt"></i> Login`;
        authBtn.className = hasToken ? "auth-btn logout-state" : "auth-btn login-state";

        authBtn.onclick = () => {
            if (authBtn.classList.contains('logout-state')) {
                document.getElementById('logoutModal').style.display = 'flex';
            } else {
                window.location.href = 'login.html';
            }
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

    function getFormattedSubtitle(q) {
        const seasonMap = { 
            "febmar": "Feb/March", "mayjun": "May/June", "octnov": "Oct/Nov",
            "m_j": "May/June", "o_n": "Oct/Nov", "f_m": "Feb/March"
        };
        const seasonName = seasonMap[q.season?.toLowerCase()] || q.season || "";
        const paperName = q.paper ? q.paper.toUpperCase() : "Paper";
        return `${paperName} | ${seasonName} ${q.year} | Var ${q.variant}`;
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
                    <span class="badge">${q.paper.toUpperCase()}</span>
                </div>
                <h3>Question ${q.questionNum}</h3>
                <p style="margin-bottom: 1rem; color: #64748b; font-size: 0.9rem;">
                    ${getFormattedSubtitle(q)}
                </p>
                <div class="card-actions">
                    <button class="btn-view" onclick="openPreview(${index})">
                        <i class="fas fa-eye"></i> Preview
                    </button>
                    <button class="btn-view secondary" onclick="jumpToPractice(${index})" style="margin-left:5px; background:#f1f5f9; color:#475569; border:none; padding: 8px 12px; border-radius: 6px; cursor: pointer;">
                        <i class="fas fa-external-link-alt"></i> Practice
                    </button>
                </div>
            `;
            savedGrid.appendChild(card);
        });
    }

    // --- PREVIEW LOGIC ---
    window.openPreview = async (index) => {
        const q = savedQuestions[index];
        const modalImages = document.getElementById('modalImages');
        const modalMS = document.getElementById('modalMS');
        const msBtn = document.getElementById('toggleModalMS');
        const modalTitle = document.getElementById('modalTitle');
        
        modalTitle.textContent = `Question ${q.questionNum}`;
        modalImages.innerHTML = '<p style="text-align:center; padding:20px;">Loading images...</p>';
        modalMS.innerHTML = '';
        modalMS.style.display = 'none';
        if (msBtn) msBtn.textContent = "Show Mark Scheme";

        const season = q.season || q.sea;
        const yearCode = (season === "febmar" ? "m" : season === "mayjun" ? "s" : "w") + q.year.toString().slice(-2);
        
        const paperMap = { pure1: "1", pure3: "3", mechanics: "4", stats1: "5" };
        const pNum = paperMap[q.paper.toLowerCase()] || q.paper.replace(/\D/g, '');
        const paperCode = pNum + q.variant;
        const subVal = q.subjectVal || "9709";

        const basePath = `images/${subVal}_${yearCode}`;
        const qFileBase = `${basePath}_qp_${paperCode}_q${q.questionNum}`;
        const mFileBase = `${basePath}_ms_${paperCode}_q${q.questionNum}`;

        const parts = ["", "a", "b", "c", "d", "e", "f", "g", "h"];
        let foundAny = false;

        for (const char of parts) {
            const qPath = `${qFileBase}${char}.PNG`;
            const mPath = `${mFileBase}${char}.PNG`;

            try {
                await new Promise((resolve, reject) => {
                    const img = new Image();
                    img.onload = () => {
                        if (!foundAny) { modalImages.innerHTML = ''; foundAny = true; }
                        const qImg = document.createElement('img');
                        qImg.src = qPath; qImg.className = "preview-img";
                        modalImages.appendChild(qImg);

                        const mImg = document.createElement('img');
                        mImg.src = mPath; mImg.className = "preview-img";
                        modalMS.appendChild(mImg);
                        resolve();
                    };
                    img.onerror = () => reject();
                    img.src = qPath;
                });
            } catch (err) {
                if (char !== "") break;
            }
        }

        if (!foundAny) modalImages.innerHTML = "<p style='text-align:center; color:#e74c3c;'>Question images not found.</p>";
        modal.style.display = "block";
    };

    // --- NAVIGATION TO PRACTICE ---
    window.jumpToPractice = (index) => {
        const q = savedQuestions[index];
        // FIXED: Creating a "lastPaper" state so index.html auto-loads this exact paper
        const lastPaperState = {
            subject: q.subjectVal || "9709",
            paper: q.paper,
            year: q.year,
            series: q.season,
            variant: "v" + q.variant,
            currentIndex: 0 // Will be overridden by jumpToQuestion logic
        };
        
        const jumpData = { num: q.questionNum };
        
        localStorage.setItem('lastPaper', JSON.stringify(lastPaperState));
        localStorage.setItem('jumpToQuestion', JSON.stringify(jumpData));
        window.location.href = "index.html"; 
    };

    window.removeSaved = (index) => {
        savedQuestions.splice(index, 1);
        localStorage.setItem('savedQuestions', JSON.stringify(savedQuestions));
        checkEmpty(); 
    };

    if (confirmClearBtn) {
        confirmClearBtn.onclick = () => {
            savedQuestions = [];
            localStorage.setItem('savedQuestions', JSON.stringify([]));
            clearAllModal.style.display = 'none';
            checkEmpty();
        };
    }

    if (closeModal) {
        closeModal.onclick = () => {
            modal.style.display = "none";
            document.body.style.overflow = "auto";
        };
    }

    checkEmpty();
});