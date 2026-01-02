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
        // Updated to use the dashboard-data route which we know exists
        const res = await fetch("/api/dashboard/dashboard-data", {
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
    const authBtn = document.getElementById("authTopBtn");
    
    // Custom Modal Elements
    const clearAllBtn = document.getElementById('clearAllBtn');
    const clearAllModal = document.getElementById('clearAllModal');
    const confirmClearBtn = document.getElementById('confirmClearBtn');
    const cancelClearBtn = document.getElementById('cancelClearBtn');

    let savedQuestions = JSON.parse(localStorage.getItem('savedQuestions')) || [];

    // --- SYNC ACROSS TABS ---
    window.addEventListener('storage', (e) => {
        if (e.key === 'savedQuestions') {
            savedQuestions = JSON.parse(e.newValue) || [];
            checkEmpty();
        }
    });

    // --- AUTH UI ---
    if (authBtn) {
        authBtn.onclick = () => {
            if (authBtn.classList.contains('logout-state')) {
                const logoutModal = document.getElementById('logoutModal');
                if(logoutModal) logoutModal.style.display = 'flex';
            } else {
                window.location.href = 'login.html';
            }
        };
    }

    const confirmLogout = document.getElementById('confirmLogout');
    const cancelLogout = document.getElementById('cancelLogout');
    if (confirmLogout) {
        confirmLogout.onclick = () => {
            localStorage.removeItem("token");
            window.location.href = "pleaselogin.html";
        };
    }
    if (cancelLogout) cancelLogout.onclick = () => {
        document.getElementById('logoutModal').style.display = 'none';
    };

    // --- DATA HANDLING ---
    function checkEmpty() {
        if (savedQuestions.length === 0) {
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
            "febmar": "Feb/March", 
            "mayjun": "May/June", 
            "octnov": "Oct/Nov",
            "m_j": "May/June",
            "o_n": "Oct/Nov",
            "f_m": "Feb/March"
        };
        const seasonName = seasonMap[q.season?.toLowerCase()] || q.season || "";
        const formattedPaper = q.paper.replace(/([a-zA-Z]+)(\d+)/, (match, p1, p2) => {
            return p1.charAt(0).toUpperCase() + p1.slice(1) + " " + p2;
        });
        return `${formattedPaper} | ${seasonName} ${q.year} | Var ${q.variant}`;
    }

    // --- RENDER GRID ---
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
                <p class="gate-description" style="margin-bottom: 1rem; color: #64748b; font-size: 0.9rem;">
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

    // --- PREVIEW LOGIC (FIXED ORDERING) ---
    window.openPreview = async (index) => {
        const q = savedQuestions[index];
        const modalImages = document.getElementById('modalImages');
        const modalMS = document.getElementById('modalMS');
        const msBtn = document.getElementById('toggleModalMS');
        const modalTitle = document.getElementById('modalTitle');
        
        modalTitle.textContent = `Question ${q.questionNum}`;
        modalImages.innerHTML = '<p id="loadingText" style="text-align:center; padding:20px;">Loading question parts...</p>';
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

        // Load parts in strict sequence (a, b, c...)
        const parts = ["", "a", "b", "c", "d", "e", "f", "g", "h"];
        let foundAny = false;

        for (const char of parts) {
            const qPath = `${qFileBase}${char}.PNG`;
            const mPath = `${mFileBase}${char}.PNG`;

            try {
                await new Promise((resolve, reject) => {
                    const img = new Image();
                    img.onload = () => {
                        if (!foundAny) {
                            modalImages.innerHTML = '';
                            foundAny = true;
                        }
                        const qImg = document.createElement('img');
                        qImg.src = qPath;
                        qImg.className = "preview-img";
                        modalImages.appendChild(qImg);

                        const mImg = document.createElement('img');
                        mImg.src = mPath;
                        mImg.className = "preview-img";
                        modalMS.appendChild(mImg);
                        resolve();
                    };
                    img.onerror = () => reject();
                    img.src = qPath;
                });
            } catch (err) {
                // If we hit a missing part (and it's not the base image), stop looking for more parts
                if (char !== "") break;
            }
        }

        if (!foundAny) modalImages.innerHTML = "<p style='text-align:center; color:#e74c3c;'>Images not found for this question.</p>";

        modal.style.display = "block";
        document.body.style.overflow = "hidden";
    };

    // --- NAVIGATION ---
    window.jumpToPractice = (index) => {
        const q = savedQuestions[index];
        const jumpData = {
            subject: q.subjectVal,
            paper: q.paper,
            year: q.year,
            season: q.season,
            variant: q.variant,
            num: q.questionNum
        };
        localStorage.setItem('jumpToQuestion', JSON.stringify(jumpData));
        window.location.href = "index.html"; 
    };

    // --- REMOVE & CLEAR LOGIC ---
    window.removeSaved = (index) => {
        savedQuestions.splice(index, 1);
        localStorage.setItem('savedQuestions', JSON.stringify(savedQuestions));
        checkEmpty(); 
    };

    if (clearAllBtn) {
        clearAllBtn.onclick = () => {
            if (savedQuestions.length > 0) clearAllModal.style.display = 'flex';
        };
    }

    if (cancelClearBtn) cancelClearBtn.onclick = () => clearAllModal.style.display = 'none';

    if (confirmClearBtn) {
        confirmClearBtn.onclick = () => {
            savedQuestions = [];
            localStorage.setItem('savedQuestions', JSON.stringify([]));
            clearAllModal.style.display = 'none';
            checkEmpty();
        };
    }

    // --- CLOSE MODALS ---
    if (closeModal) {
        closeModal.onclick = () => {
            modal.style.display = "none";
            document.body.style.overflow = "auto";
        };
    }

    window.onclick = (e) => {
        if (e.target === modal) closeModal.onclick();
        if (e.target === clearAllModal) clearAllModal.style.display = 'none';
        if (e.target === document.getElementById('logoutModal')) {
            document.getElementById('logoutModal').style.display = 'none';
        }
    };

    // --- MARK SCHEME TOGGLE ---
    const msToggle = document.getElementById('toggleModalMS');
    if (msToggle) {
        msToggle.onclick = function() {
            const ms = document.getElementById('modalMS');
            const isHidden = ms.style.display === 'none';
            ms.style.display = isHidden ? 'block' : 'none';
            this.textContent = isHidden ? "Hide Mark Scheme" : "Show Mark Scheme";
        };
    }

    checkEmpty();
});