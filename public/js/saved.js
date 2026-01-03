/* =========================================
   1. AUTHENTICATION & GLOBAL STATE
   ========================================= */
const API_BASE_URL = "https://q-by-q.vercel.app/api";

/**
 * Sanitizes token and verifies with backend.
 */
async function checkAuth() {
    let token = localStorage.getItem("token");
    
    if (token && (token.startsWith('"') || token.startsWith("'"))) {
        token = token.substring(1, token.length - 1);
    }

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
    const userEmailEl = document.getElementById("userEmail");
    if (!authBtn) return;

    if (userEmailEl) userEmailEl.textContent = email;

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
   2. MAIN LIBRARY LOGIC
   ========================================= */
document.addEventListener("DOMContentLoaded", async () => {
    await checkAuth();

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

    const clearAllBtn = document.getElementById('clearAllBtn');
    if (clearAllBtn) {
        clearAllBtn.onclick = () => { 
            const saved = JSON.parse(localStorage.getItem('savedQuestions')) || [];
            if(saved.length > 0) clearAllModal.style.display = 'flex'; 
        };
    }

    document.getElementById('confirmClearBtn').onclick = () => {
        localStorage.setItem('savedQuestions', "[]");
        clearAllModal.style.display = 'none';
        checkEmpty();
    };

    document.getElementById('cancelClearBtn').onclick = () => {
        clearAllModal.style.display = 'none';
    };
});

/**
 * Toggles between the Grid and the Empty State UI
 */
function checkEmpty() {
    const savedGrid = document.getElementById('savedGrid');
    const emptyState = document.getElementById('emptyState');
    const saved = JSON.parse(localStorage.getItem('savedQuestions')) || [];

    if (saved.length === 0) {
        if (emptyState) emptyState.style.display = 'block';
        if (savedGrid) savedGrid.style.display = 'none';
    } else {
        if (emptyState) emptyState.style.display = 'none';
        if (savedGrid) {
            savedGrid.style.display = 'flex'; 
            savedGrid.style.flexDirection = 'column';
            renderSavedQuestions();
        }
    }
}

/**
 * Renders Horizontal Cards
 */
function renderSavedQuestions() {
    const savedGrid = document.getElementById("savedGrid");
    const saved = JSON.parse(localStorage.getItem('savedQuestions')) || [];

    savedGrid.innerHTML = "";

    saved.forEach((q) => {
        const card = document.createElement("div");
        card.className = "saved-card-row"; 
        
        const noteText = q.note ? q.note.trim() : "";
        const noteHtml = noteText 
            ? `<div class="note-badge" title="${noteText.replace(/"/g, '&quot;')}">
                <i class="fas fa-sticky-note"></i> <span>${noteText}</span>
               </div>` 
            : `<div style="flex: 1;"></div>`; 

        const titleHtml = `
            <span class="sub-text">Math ${q.subjectVal || '9709'}</span>
            <span class="separator">|</span>
            <span class="main-ref">${q.season.toUpperCase()} ${q.year}</span>
            <span class="variant-tag">V${q.variant}</span>
            <span class="separator">|</span>
            <span class="question-text">Question ${q.questionNum}</span>
        `;

        card.innerHTML = `
            <div class="card-main-content">
                <h3 class="paper-title-aesthetic">${titleHtml}</h3>
                ${noteHtml}
            </div>

            <div class="card-actions">
                <button class="btn-action preview" onclick="previewQuestion('${q.id}')">
                    <i class="fas fa-eye"></i> <span>Preview</span>
                </button>
                <button class="btn-action practice" onclick="practiceQuestion('${q.id}')">
                    <i class="fas fa-play"></i> <span>Practice</span>
                </button>
                <button class="btn-action delete" onclick="removeQuestion('${q.id}')">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </div>
        `;
        savedGrid.appendChild(card);
    });
}

/* =========================================
   3. GLOBAL ACTION HANDLERS
   ========================================= */

window.removeQuestion = (id) => {
    let saved = JSON.parse(localStorage.getItem('savedQuestions')) || [];
    saved = saved.filter(q => q.id !== id);
    localStorage.setItem('savedQuestions', JSON.stringify(saved));
    checkEmpty();
};

/**
 * FIXED: Properly redirects to index.html with the correct question index
 */
window.practiceQuestion = (id) => {
    const saved = JSON.parse(localStorage.getItem('savedQuestions')) || [];
    const q = saved.find(item => item.id === id);
    if (!q) return;

    // Convert question number (1-based) to index (0-based)
    const targetIndex = parseInt(q.questionNum) - 1;

    // 1. Update lastPaper in localStorage for session recovery
    localStorage.setItem('lastPaper', JSON.stringify({
        subjectCode: q.subjectVal || "9709",
        paper: q.paper,
        year: q.year.toString(),
        series: q.season,
        variant: "v" + q.variant.toString().replace('v', ''),
        currentIndex: targetIndex
    }));

    // 2. Redirect with URL parameters that app.js expects
    const params = new URLSearchParams({
        paper: q.paper,
        year: q.year,
        series: q.season,
        variant: "v" + q.variant.toString().replace('v', ''),
        q: targetIndex
    });

    window.location.href = `index.html?${params.toString()}`;
};

window.previewQuestion = async (id) => {
    const saved = JSON.parse(localStorage.getItem('savedQuestions')) || [];
    const q = saved.find(item => item.id === id);
    if (!q) return;

    const modal = document.getElementById('previewModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalImages = document.getElementById('modalImages');
    const modalMS = document.getElementById('modalMS');
    const toggleMSBtn = document.getElementById('toggleModalMS');
    const modalNote = document.getElementById('modalNote');
    const modalNoteText = document.getElementById('modalNoteText');

    if (q.note && q.note.trim() !== "") {
        if (modalNote) modalNote.style.display = 'block';
        if (modalNoteText) modalNoteText.textContent = q.note;
    } else {
        if (modalNote) modalNote.style.display = 'none';
    }

    modalTitle.textContent = `Question ${q.questionNum}`;
    modalImages.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Loading Images...</div>';
    modalMS.innerHTML = '';
    modalMS.style.display = 'none';
    if(toggleMSBtn) toggleMSBtn.textContent = "Show Mark Scheme";

    const paperMap = { pure1: "1", pure3: "3", mechanics: "4", stats1: "5" };
    const vNum = q.variant.toString().replace('v', '');
    const pCode = (paperMap[q.paper.toLowerCase()] || q.paper) + vNum;
    const yCode = (q.season === "febmar" ? "m" : q.season === "mayjun" ? "s" : "w") + q.year.toString().slice(-2);
    
    const qFileBase = `images/${q.subjectVal}_${yCode}_qp_${pCode}_q${q.questionNum}`;
    const mFileBase = `images/${q.subjectVal}_${yCode}_ms_${pCode}_q${q.questionNum}`;

    let foundAtLeastOne = false;
    const partLetters = ["", "a", "b", "c", "d", "e", "f"];

    for (const char of partLetters) {
        const qPath = `${qFileBase}${char}.PNG`;
        const mPath = `${mFileBase}${char}.PNG`;

        try {
            await new Promise((resolve, reject) => {
                const img = new Image();
                img.onload = () => {
                    if (!foundAtLeastOne) { modalImages.innerHTML = ''; foundAtLeastOne = true; }
                    
                    const qImg = document.createElement('img');
                    qImg.src = qPath; 
                    qImg.className = "preview-img";
                    qImg.style.width = "100%";
                    qImg.style.marginBottom = "10px";
                    qImg.style.borderRadius = "8px";
                    modalImages.appendChild(qImg);

                    const mImg = document.createElement('img');
                    mImg.src = mPath;
                    mImg.className = "preview-ms-img";
                    mImg.style.width = "100%";
                    mImg.style.borderRadius = "8px";
                    mImg.onerror = () => mImg.remove();
                    modalMS.appendChild(mImg);
                    resolve();
                };
                img.onerror = () => reject();
                img.src = qPath;
            });
        } catch(e) {}
    }

    if (!foundAtLeastOne) {
        modalImages.innerHTML = `<div class="error-msg" style="text-align:center; padding:20px; color:#ef4444;">No images found for Q${q.questionNum}</div>`;
    }

    modal.style.display = "flex";
};

/* =========================================
   4. MODAL & UI EVENT LISTENERS
   ========================================= */

window.addEventListener('click', (e) => {
    const logoutModal = document.getElementById('logoutModal');
    const previewModal = document.getElementById('previewModal');
    const clearAllModal = document.getElementById('clearAllModal');

    if (e.target.closest('#authTopBtn')) {
        const authBtn = e.target.closest('#authTopBtn');
        if (authBtn.classList.contains('logout-state')) {
            if (logoutModal) logoutModal.style.display = 'flex';
        } else {
            window.location.href = "pleaselogin.html";
        }
    }

    if (e.target === logoutModal) logoutModal.style.display = 'none';
    if (e.target === previewModal) previewModal.style.display = 'none';
    if (e.target === clearAllModal) clearAllModal.style.display = 'none';
    
    if (e.target.classList.contains('close-modal')) {
        document.querySelectorAll('.modal').forEach(m => m.style.display = 'none');
    }

    if (e.target.id === 'cancelLogout') logoutModal.style.display = 'none';
    if (e.target.id === 'confirmLogout') {
        localStorage.removeItem("token");
        localStorage.removeItem("lastPaper"); 
        window.location.href = "pleaselogin.html";
    }
});

document.addEventListener('keydown', (e) => {
    if (e.key === "Escape") {
        document.querySelectorAll('.modal').forEach(m => m.style.display = "none");
    }
});

const toggleMSBtnModal = document.getElementById('toggleModalMS');
if (toggleMSBtnModal) {
    toggleMSBtnModal.onclick = () => {
        const modalMS = document.getElementById('modalMS');
        const isHidden = modalMS.style.display === 'none';
        modalMS.style.display = isHidden ? 'block' : 'none';
        toggleMSBtnModal.textContent = isHidden ? 'Hide Mark Scheme' : 'Show Mark Scheme';
    };
}