/* =========================================
   1. CONFIGURATION & AUTHENTICATION
   ========================================= */
const API_BASE_URL = "https://q-by-q.vercel.app/api";

async function checkAuth() {
    let token = localStorage.getItem("token");
    if (token && (token.startsWith('"') || token.startsWith("'"))) {
        token = token.substring(1, token.length - 1);
    }
    if (!token || token === "null" || token === "undefined" || token.length < 20) {
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
            window.location.href = "pleaselogin.html";
            return false;
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
        authBtn.innerHTML = `<div class="icon-box"><i class="fas fa-sign-out-alt"></i></div><span class="nav-text">Logout</span>`;
    } else {
        authBtn.classList.add("login-state");
        authBtn.classList.remove("logout-state");
        authBtn.innerHTML = `<div class="icon-box"><i class="fas fa-sign-in-alt"></i></div><span class="nav-text">Login</span>`;
    }
}

/* =========================================
   2. SYLLABUS FETCH & RENDER
   ========================================= */
async function fetchAndRenderSyllabus() {
    const paperSelect = document.getElementById('paperSelectSyllabus');
    const container = document.getElementById('syllabusDisplayContainer');
    const loadBtn = document.getElementById('loadSyllabusBtn');
    
    if (!paperSelect || !container) return;

    const paper = paperSelect.value;
    
    // PERSISTENCE: Save selection whenever we render
    localStorage.setItem('selectedPaperSyllabus', paper);

    const icon = loadBtn ? loadBtn.querySelector('i') : null;
    if (icon) icon.classList.add('fa-spin');
    if (container) container.style.opacity = "0.5";

    try {
        const response = await fetch('topics.html');
        if (!response.ok) throw new Error('Could not find topics.html');
        
        const text = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(text, 'text/html');
        const template = doc.getElementById(`template-${paper}`);

        if (template) {
            container.innerHTML = template.innerHTML;
            container.style.opacity = "1";
            loadSyllabusProgress(); 
            if (window.MathJax) {
                window.MathJax.typesetPromise().catch((err) => console.log('MathJax Error:', err));
            }
        } else {
            container.innerHTML = `<p style="padding:20px;">Template for <b>${paper}</b> not found in topics.html</p>`;
            container.style.opacity = "1";
        }
    } catch (err) {
        console.error("Fetch Error:", err);
        container.innerHTML = "<p style='padding:20px; color:red;'>Error loading syllabus file.</p>";
        container.style.opacity = "1";
    } finally {
        if (icon) setTimeout(() => icon.classList.remove('fa-spin'), 600);
    }
}

/* =========================================
   3. PROGRESS & PERSISTENCE
   ========================================= */
function handleConfidenceClick(wrapper) {
    const group = wrapper.closest('.confidence-dots');
    const subItem = wrapper.closest('.subtopic-item');
    const dot = wrapper.querySelector('.dot');
    let color = dot.classList.contains('yellow') ? 'yellow' : (dot.classList.contains('green') ? 'green' : 'red');
    const isAlreadyActive = wrapper.classList.contains('active');
    group.querySelectorAll('.dot-wrapper').forEach(w => w.classList.remove('active'));
    subItem.classList.remove('status-red', 'status-yellow', 'status-green');
    if (!isAlreadyActive) {
        wrapper.classList.add('active');
        subItem.classList.add(`status-${color}`);
    }
    saveSyllabusProgress();
    updateProgressBar();
}

function saveSyllabusProgress() {
    const paper = document.getElementById('paperSelectSyllabus').value;
    const progressData = {};
    document.querySelectorAll('.subtopic-item').forEach((item, index) => {
        const activeWrapper = item.querySelector('.dot-wrapper.active');
        if (activeWrapper) {
            const dot = activeWrapper.querySelector('.dot');
            const color = dot.classList.contains('red') ? 'red' : (dot.classList.contains('yellow') ? 'yellow' : 'green');
            progressData[index] = color;
        }
    });
    localStorage.setItem(`syllabus_${paper}_progress`, JSON.stringify(progressData));
}

function loadSyllabusProgress() {
    const paper = document.getElementById('paperSelectSyllabus').value;
    const saved = JSON.parse(localStorage.getItem(`syllabus_${paper}_progress`) || "{}");
    document.querySelectorAll('.subtopic-item').forEach((item, index) => {
        item.classList.remove('status-red', 'status-yellow', 'status-green');
        item.querySelectorAll('.dot-wrapper').forEach(w => w.classList.remove('active'));
        const color = saved[index];
        if (color) {
            item.classList.add(`status-${color}`);
            const targetDot = item.querySelector(`.dot.${color}`);
            if (targetDot) targetDot.parentElement.classList.add('active');
        }
    });
    updateProgressBar();
}

function updateProgressBar() {
    const subtopics = document.querySelectorAll('.subtopic-item');
    let totalScore = 0;
    if (subtopics.length === 0) return;
    subtopics.forEach(item => {
        const activeDot = item.querySelector('.dot-wrapper.active .dot');
        if (activeDot) {
            if (activeDot.classList.contains('green')) totalScore += 100;
            else if (activeDot.classList.contains('yellow')) totalScore += 50;
            else totalScore += 10;
        }
    });
    const percentage = Math.round((totalScore / (subtopics.length * 100)) * 100);
    const fill = document.getElementById('progressFill');
    const rateText = document.getElementById('completionRate');
    if (fill && rateText) {
        fill.style.width = percentage + '%';
        rateText.innerText = `${percentage}% Confidence`;
        if (percentage < 35) fill.style.background = '#ef4444';
        else if (percentage < 75) fill.style.background = '#f59e0b';
        else fill.style.background = '#22c55e';
    }
}

/* =========================================
   4. UI INTERACTIONS & ACCORDION
   ========================================= */
function toggleTopic(header) {
    const row = header.closest('.topic-row');
    const content = row.querySelector('.collapsible-content');
    const isActive = row.classList.toggle('active');
    if (isActive) content.style.maxHeight = content.scrollHeight + "px";
    else content.style.maxHeight = "0px";
}

/* =========================================
   5. INIT & GLOBAL EVENT ROUTING
   ========================================= */
document.addEventListener('DOMContentLoaded', async () => {
    // 1. Check Auth
    await checkAuth();

    // 2. PERSISTENCE: Restore dropdown value before rendering
    const paperSelect = document.getElementById('paperSelectSyllabus');
    const savedPaper = localStorage.getItem('selectedPaperSyllabus');
    if (paperSelect && savedPaper) {
        paperSelect.value = savedPaper;
    }

    // 3. Initial Load
    fetchAndRenderSyllabus();

    // 4. Save persistence when user changes the dropdown manually
    paperSelect?.addEventListener('change', () => {
        localStorage.setItem('selectedPaperSyllabus', paperSelect.value);
    });

    // 5. Setup Load Button
    document.getElementById('loadSyllabusBtn')?.addEventListener('click', fetchAndRenderSyllabus);

    // 6. Sidebar Logic
    const sidebar = document.getElementById("sidebar");
    const toggleSidebar = document.getElementById("toggleSidebar");
    if (localStorage.getItem("sidebarCollapsed") === "true") sidebar?.classList.add("collapsed");
    if (toggleSidebar) {
        toggleSidebar.onclick = () => {
            sidebar.classList.toggle("collapsed");
            localStorage.setItem("sidebarCollapsed", sidebar.classList.contains("collapsed"));
        };
    }

    // 7. Global Click Delegation
    document.addEventListener('click', (e) => {
        const dotWrapper = e.target.closest('.dot-wrapper');
        if (dotWrapper) { handleConfidenceClick(dotWrapper); return; }

        const authBtn = e.target.closest('#authTopBtn');
        if (authBtn) {
            if (authBtn.classList.contains('logout-state')) {
                document.getElementById('logoutModal').style.display = 'flex';
            } else {
                window.location.href = "pleaselogin.html";
            }
            return;
        }
        if (e.target.id === 'confirmLogout') { localStorage.removeItem("token"); window.location.href = "pleaselogin.html"; }
        if (e.target.id === 'cancelLogout' || e.target.classList.contains('modal')) {
            document.getElementById('logoutModal').style.display = 'none';
        }
    });
});
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