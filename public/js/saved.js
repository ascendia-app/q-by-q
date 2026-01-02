/* =========================================
   1. AUTHENTICATION & GLOBAL STATE
   ========================================= */
const API_BASE_URL = "https://q-by-q.vercel.app/api";

/**
 * Sanitizes token and verifies with backend.
 * Redirects to login if token is missing or invalid.
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

    const savedGrid = document.getElementById('savedGrid');
    const emptyState = document.getElementById('emptyState');
    const previewModal = document.getElementById('previewModal');
    const modalImages = document.getElementById('modalImages');
    const modalMS = document.getElementById('modalMS');
    const modalTitle = document.getElementById('modalTitle');
    const toggleMSBtn = document.getElementById('toggleModalMS');
    const sidebar = document.getElementById("sidebar");
    const toggleSidebar = document.getElementById("toggleSidebar");
    const clearAllModal = document.getElementById('clearAllModal');

    let savedQuestions = JSON.parse(localStorage.getItem('savedQuestions')) || [];

    if (localStorage.getItem("sidebarCollapsed") === "true") sidebar?.classList.add("collapsed");

    function checkEmpty() {
        if (savedQuestions.length === 0) {
            if (emptyState) emptyState.style.display = 'block';
            if (savedGrid) savedGrid.style.display = 'none';
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
        const seasonMap = { 'febmar': 'Feb/March', 'mayjun': 'May/June', 'octnov': 'Oct/Nov' };
        
        savedQuestions.forEach((q, index) => {
            const card = document.createElement('div');
            card.className = 'saved-card';
            const paperRef = `${seasonMap[q.season] || q.season} ${q.year} | V${q.variant}`;

            card.innerHTML = `
                <button class="btn-remove" onclick="removeSaved(${index})"><i class="fas fa-trash"></i></button>
                <div class="card-badges">
                    <span class="badge" style="color: #0ea5e9">Math 9709</span>
                    <span class="badge">${(q.paper || "QP").toUpperCase()}</span>
                </div>
                <h3>Question ${q.questionNum}</h3>
                <p style="margin-bottom: 1rem; color: #64748b; font-size: 0.85rem;">${paperRef}</p>
                <div class="card-actions">
                    <button class="btn-view" onclick="openPreview(${index})"><i class="fas fa-eye"></i> Preview</button>
                    <button class="btn-view secondary-bg" onclick="jumpToPractice(${index})"><i class="fas fa-external-link-alt"></i> Practice</button>
                </div>`;
            savedGrid.appendChild(card);
        });
    }

    window.removeSaved = (index) => {
        savedQuestions.splice(index, 1);
        localStorage.setItem('savedQuestions', JSON.stringify(savedQuestions));
        checkEmpty(); 
    };

    window.jumpToPractice = (index) => {
        const q = savedQuestions[index];
        localStorage.setItem('lastPaper', JSON.stringify({
            subjectCode: q.subjectVal,
            paper: q.paper,
            year: q.year,
            series: q.season,
            variant: "v" + q.variant,
            currentIndex: q.questionNum - 1
        }));
        window.location.href = `index.html?paper=${q.paper}&year=${q.year}&series=${q.season}&variant=v${q.variant}&q=${q.questionNum - 1}`;
    };

    window.openPreview = async (index) => {
        const q = savedQuestions[index];
        if (!q) return;

        modalTitle.textContent = `Question ${q.questionNum}`;
        modalImages.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Loading...</div>';
        modalMS.innerHTML = '';
        modalMS.style.display = 'none';
        toggleMSBtn.textContent = "Show Mark Scheme";

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
                        modalImages.appendChild(qImg);

                        const mImg = document.createElement('img');
                        mImg.src = mPath;
                        mImg.className = "preview-ms-img";
                        mImg.onerror = () => mImg.style.display = 'none';
                        modalMS.appendChild(mImg);
                        resolve();
                    };
                    img.onerror = () => reject();
                    img.src = qPath;
                });
            } catch(e) {}
        }

        if (!foundAtLeastOne) {
            modalImages.innerHTML = `<div class="error-msg">No images found for Q${q.questionNum}</div>`;
        }
        previewModal.style.display = "block";
    };

    if (toggleSidebar) {
        toggleSidebar.onclick = () => {
            sidebar.classList.toggle("collapsed");
            localStorage.setItem("sidebarCollapsed", sidebar.classList.contains("collapsed"));
        };
    }

    if (toggleMSBtn) {
        toggleMSBtn.onclick = () => {
            const isHidden = modalMS.style.display === 'none';
            modalMS.style.display = isHidden ? 'block' : 'none';
            toggleMSBtn.textContent = isHidden ? 'Hide Mark Scheme' : 'Show Mark Scheme';
        };
    }

    const clearAllBtn = document.getElementById('clearAllBtn');
    if (clearAllBtn) {
        clearAllBtn.onclick = () => { if(savedQuestions.length > 0) clearAllModal.style.display = 'flex'; };
    }

    document.getElementById('confirmClearBtn').onclick = () => {
        savedQuestions = [];
        localStorage.setItem('savedQuestions', "[]");
        clearAllModal.style.display = 'none';
        checkEmpty();
    };

    document.getElementById('cancelClearBtn').onclick = () => {
        clearAllModal.style.display = 'none';
    };

    checkEmpty();
});

/* =========================================
   3. GLOBAL MODAL HANDLER
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

    if (e.target === logoutModal || e.target.id === 'cancelLogout') {
        if (logoutModal) logoutModal.style.display = 'none';
    }
    if (e.target === previewModal || e.target.classList.contains('close-modal')) {
        if (previewModal) previewModal.style.display = 'none';
    }
    if (e.target === clearAllModal) {
        if (clearAllModal) clearAllModal.style.display = 'none';
    }

    if (e.target.id === 'confirmLogout') {
        // CRITICAL FIX: Only remove session data, do NOT clear savedQuestions
        localStorage.removeItem("token");
        localStorage.removeItem("lastPaper"); 
        window.location.href = "pleaselogin.html";
    }
});

document.addEventListener('keydown', (e) => {
    if (e.key === "Escape") {
        if(document.getElementById('previewModal')) document.getElementById('previewModal').style.display = "none";
        if(document.getElementById('logoutModal')) document.getElementById('logoutModal').style.display = "none";
        if(document.getElementById('clearAllModal')) document.getElementById('clearAllModal').style.display = "none";
    }
});