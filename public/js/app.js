/* =========================================
   1. AUTHENTICATION & GLOBAL STATE
   ========================================= */
let questions = [];
let currentIndex = 0;
let savedQuestions = JSON.parse(localStorage.getItem('savedQuestions')) || [];

async function checkAuth() {
    const token = localStorage.getItem("token");
    const isLoginPage = window.location.pathname.includes("login.html") || window.location.pathname.includes("pleaselogin.html");
    const isIndexPage = window.location.pathname.includes("index.html") || window.location.pathname === "/";

    if (!token) {
        updateSidebarAuthBtn(false);
        if (!isLoginPage && !isIndexPage) {
            window.location.href = "pleaselogin.html";
        }
        return;
    }

    try {
     const res = await fetch("https://q-by-q.vercel.app/api/auth/signup", {
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (!res.ok) {
            if (res.status === 401 || res.status === 403) {
                localStorage.removeItem("token");
                updateSidebarAuthBtn(false);
                if (!isLoginPage) window.location.href = "pleaselogin.html";
            }
        } else {
            updateSidebarAuthBtn(true);
        }
    } catch (err) {
        console.warn("Auth server unreachable. Working in Offline Mode.");
        updateSidebarAuthBtn(!!token);
    }
}

function updateSidebarAuthBtn(isLoggedIn) {
    const authBtn = document.getElementById("authTopBtn");
    if (!authBtn) return;

    if (isLoggedIn) {
        authBtn.innerHTML = `<i class="fas fa-sign-out-alt"></i> Logout`;
        authBtn.className = "auth-btn logout-state"; 
    } else {
        authBtn.innerHTML = `<i class="fas fa-sign-in-alt"></i> Login`;
        authBtn.className = "auth-btn login-state";
    }
}

/* =========================================
   2. MAIN APPLICATION INITIALIZATION
   ========================================= */
document.addEventListener("DOMContentLoaded", () => {
    checkAuth();
// --- Place this directly inside your document.addEventListener("DOMContentLoaded", () => { ---

const notFoundModal = document.getElementById('notFoundModal');
const closeNotFound = document.getElementById('closeNotFound');

if (closeNotFound && notFoundModal) {
    closeNotFound.onclick = () => {
        notFoundModal.style.display = 'none';
    };
}

// Also close if the user clicks the dark background outside the modal
window.addEventListener('click', (e) => {
    if (e.target === notFoundModal) {
        notFoundModal.style.display = 'none';
    }
});
    // UI Elements
    const questionNumberEl = document.getElementById("question-number");
    const questionContentEl = document.getElementById("question-content");
    const prevBtn = document.getElementById("prevBtn");
    const nextBtn = document.getElementById("nextBtn");
    const questionList = document.getElementById("questionList");
    const markSchemeBtn = document.getElementById("markSchemeBtn");
    const markSchemeViewer = document.getElementById("markSchemeViewer");
    const saveBtn = document.getElementById('saveQuestionBtn');

    // Selection Elements
    const subjectSelect = document.getElementById("subjectSelect");
    const paperSelect = document.getElementById("paperSelect");
    const yearSelect = document.getElementById("yearSelect");
    const seasonSelect = document.getElementById("seasonSelect");
    const variantSelect = document.getElementById("variantSelect");
    const loadPaperBtn = document.getElementById("loadPaperBtn");

    // --- Variant Logic ---
    const allVariants = [
        { val: "1", text: "v1" },
        { val: "2", text: "v2" },
        { val: "3", text: "v3" }
    ];

    function applyVariantRule() {
        const selectedSeason = seasonSelect.value;
        const savedVal = variantSelect.value;
        
        variantSelect.innerHTML = "";
        if (selectedSeason === "febmar") {
            variantSelect.innerHTML = `<option value="2">v2</option>`;
            variantSelect.value = "2";
            variantSelect.style.backgroundColor = "#f8fafc";
        } else {
            allVariants.forEach(v => {
                const opt = document.createElement("option");
                opt.value = v.val;
                opt.textContent = v.text;
                variantSelect.appendChild(opt);
            });
            variantSelect.style.backgroundColor = "";
            if (["1", "2", "3"].includes(savedVal)) variantSelect.value = savedVal;
        }
    }

    if (seasonSelect) seasonSelect.addEventListener('change', applyVariantRule);

    // Modal Elements
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

    // --- Core Rendering Functions ---
    function renderQuestionList() {
        if(!questionList) return;
        questionList.innerHTML = "";
        questions.forEach((q, index) => {
            const btn = document.createElement("button");
            btn.textContent = q.number;
            btn.className = index === currentIndex ? "question-btn active" : "question-btn";
            btn.onclick = () => {
                currentIndex = index;
                renderUI();
            };
            questionList.appendChild(btn);
        });
    }

    function renderQuestion() {
        if (!questions[currentIndex]) return;
        const q = questions[currentIndex];
        if(questionNumberEl) questionNumberEl.textContent = `Question ${q.number}`;

        if (markSchemeViewer && markSchemeBtn) {
            markSchemeViewer.style.display = "none";
            markSchemeViewer.classList.remove("open");
            markSchemeBtn.innerHTML = `<i class="fas fa-eye"></i> Show Mark Scheme`;
        }

        questionContentEl.innerHTML = "";
        q.images.forEach(src => {
            const img = document.createElement("img");
            img.src = src;
            img.className = "question-image";
            img.onerror = () => img.style.display = 'none';
            questionContentEl.appendChild(img);
        });

        markSchemeViewer.innerHTML = "";
        q.markImages.forEach(src => {
            const img = document.createElement("img");
            img.src = src;
            img.className = "markscheme-image";
            markSchemeViewer.appendChild(img);
        });

        updateSaveButtonState();
    }

    function updateSaveButtonState() {
        if (!questions[currentIndex] || !saveBtn) return;
        const q = questions[currentIndex];
        const currentId = `${subjectSelect.value}_${yearSelect.value}_${seasonSelect.value}_${variantSelect.value}_q${q.number}`;
        const isSaved = savedQuestions.some(sq => sq.id === currentId);
        
        if (isSaved) {
            saveBtn.innerHTML = `<i class="fas fa-bookmark"></i> Saved`;
            saveBtn.classList.add('saved');
        } else {
            saveBtn.innerHTML = `<i class="far fa-bookmark"></i> Save Question`;
            saveBtn.classList.remove('saved');
        }
    }

    function renderUI() {
        renderQuestion();
        renderQuestionList();
        saveState();
    }

    function saveState() {
        if (!subjectSelect.value) return;
        const state = {
            subject: subjectSelect.value, paper: paperSelect.value,
            year: yearSelect.value, season: seasonSelect.value,
            variant: variantSelect.value, currentIndex
        };
        localStorage.setItem("lastPaper", JSON.stringify(state));
    }

    if(loadPaperBtn) {
        loadPaperBtn.onclick = () => {
            const paperMap = { pure1: "1", pure3: "3", mechanics: "4", stats1: "5" };
            const pCode = (paperMap[paperSelect.value.toLowerCase()] || paperSelect.value) + variantSelect.value;
            const yCode = (seasonSelect.value === "febmar" ? "m" : seasonSelect.value === "mayjun" ? "s" : "w") + yearSelect.value.slice(-2);
            
            questions = [];
            currentIndex = 0; 
            let qNum = 1;

            const loadNextQuestion = () => {
                let parts = []; let markParts = []; let partIndex = 0;
                const partLetters = "abcdefgh";

                const tryPart = () => {
                    const char = partLetters[partIndex];
                    const qPath = `images/${subjectSelect.value}_${yCode}_qp_${pCode}_q${qNum}${char}.PNG`;
                    const mPath = `images/${subjectSelect.value}_${yCode}_ms_${pCode}_q${qNum}${char}.PNG`;
                    const img = new Image();
                    img.onload = () => {
                        parts.push(qPath); markParts.push(mPath);
                        partIndex++; tryPart();
                    };
                    img.onerror = () => {
                        if (partIndex === 0) tryNoPart();
                        else finishQuestion();
                    };
                    img.src = qPath;
                };

                const tryNoPart = () => {
                    const qPath = `images/${subjectSelect.value}_${yCode}_qp_${pCode}_q${qNum}.PNG`;
                    const mPath = `images/${subjectSelect.value}_${yCode}_ms_${pCode}_q${qNum}.PNG`;
                    const img = new Image();
                    img.onload = () => {
                        questions.push({ number: qNum, images: [qPath], markImages: [mPath] });
                        qNum++; loadNextQuestion();
                    };
                    img.onerror = () => {
                        if (questions.length === 0) {
                            const modal = document.getElementById('notFoundModal');
                            if(modal) modal.style.display = 'flex';
                            return; 
                        }
                        const jumpTo = JSON.parse(localStorage.getItem('jumpToQuestion'));
                        if (jumpTo) {
                            const foundIndex = questions.findIndex(q => q.number == jumpTo.num);
                            if (foundIndex !== -1) currentIndex = foundIndex;
                            localStorage.removeItem('jumpToQuestion');
                        }
                        renderUI();
                    };
                    img.src = qPath;
                };

                const finishQuestion = () => {
                    questions.push({ number: qNum, images: parts, markImages: markParts });
                    qNum++; loadNextQuestion();
                };
                tryPart();
            };
            loadNextQuestion();
        };
    }

    if (saveBtn) {
        saveBtn.onclick = () => {
            if (questions.length === 0) return;
            const q = questions[currentIndex];
            const currentId = `${subjectSelect.value}_${yearSelect.value}_${seasonSelect.value}_${variantSelect.value}_q${q.number}`;
            
            const existingIndex = savedQuestions.findIndex(sq => sq.id === currentId);
            if (existingIndex === -1) {
                savedQuestions.push({
                    id: currentId,
                    subjectVal: subjectSelect.value,
                    paper: paperSelect.value,
                    year: yearSelect.value,
                    season: seasonSelect.value,
                    variant: variantSelect.value,
                    questionNum: q.number
                });
            } else {
                savedQuestions.splice(existingIndex, 1);
            }
            localStorage.setItem('savedQuestions', JSON.stringify(savedQuestions));
            updateSaveButtonState();
        };
    }

    if (markSchemeBtn) {
        markSchemeBtn.onclick = () => {
            const isOpen = markSchemeViewer.classList.toggle("open");
            markSchemeViewer.style.display = isOpen ? "block" : "none";
            markSchemeBtn.innerHTML = isOpen ? `<i class="fas fa-eye-slash"></i> Hide Mark Scheme` : `<i class="fas fa-eye"></i> Show Mark Scheme`;
        };
    }

    // --- RECOVERY LOGIC ---
    const lastPaper = JSON.parse(localStorage.getItem("lastPaper"));
    const jumpTo = JSON.parse(localStorage.getItem('jumpToQuestion'));

    if (jumpTo || lastPaper) {
        const data = jumpTo || lastPaper;
        subjectSelect.value = data.subject || data.sub || "9709";
        paperSelect.value = data.paper || data.pap || "pure1";
        yearSelect.value = data.year || data.yr || "2024";
        seasonSelect.value = data.season || data.sea || "mayjun";
        applyVariantRule();
        variantSelect.value = data.variant || data.varnt || "1";
        if (!jumpTo) currentIndex = data.currentIndex || 0;
        loadPaperBtn.click();
    } else {
        applyVariantRule();
    }

    if(prevBtn) prevBtn.onclick = () => { if (currentIndex > 0) { currentIndex--; renderUI(); } };
    if(nextBtn) nextBtn.onclick = () => { if (currentIndex < questions.length - 1) { currentIndex++; renderUI(); } };
});

/* =========================================
   3. PERSISTENT TIMER LOGIC
   ========================================= */
const hoursEl = document.getElementById("hours"),
      minutesEl = document.getElementById("minutes"),
      secondsEl = document.getElementById("seconds"),
      startBtn = document.getElementById("startTimer"),
      pauseBtn = document.getElementById("pauseTimer"),
      resetBtn = document.getElementById("resetTimer");

let tInt = null;

function getTimerData() {
    return JSON.parse(localStorage.getItem("timerTime")) || { h: 0, m: 0, s: 0, startTime: null, running: false };
}

function updateTimerUI() {
    const data = getTimerData();
    let totalSeconds = (data.h * 3600) + (data.m * 60) + data.s;

    if (data.running && data.startTime) {
        const elapsedSinceStart = Math.floor((Date.now() - data.startTime) / 1000);
        totalSeconds += elapsedSinceStart;
    }

    const displayH = Math.floor(totalSeconds / 3600);
    const displayM = Math.floor((totalSeconds % 3600) / 60);
    const displayS = totalSeconds % 60;

    if(hoursEl) hoursEl.textContent = String(displayH).padStart(2, "0");
    if(minutesEl) minutesEl.textContent = String(displayM).padStart(2, "0");
    if(secondsEl) secondsEl.textContent = String(displayS).padStart(2, "0");
    
    localStorage.setItem("activeSessionSeconds", totalSeconds);
}

function startInterval() {
    if (tInt) clearInterval(tInt);
    tInt = setInterval(updateTimerUI, 1000);
}

if (startBtn) {
    startBtn.onclick = () => {
        let data = getTimerData();
        if (data.running) return;
        data.running = true;
        data.startTime = Date.now();
        localStorage.setItem("timerTime", JSON.stringify(data));
        startInterval();
    };
}

if (pauseBtn) {
    pauseBtn.onclick = () => {
        let data = getTimerData();
        if (!data.running) return;
        const elapsed = Math.floor((Date.now() - data.startTime) / 1000);
        let totalS = (data.h * 3600) + (data.m * 60) + data.s + elapsed;
        data.h = Math.floor(totalS / 3600);
        data.m = Math.floor((totalS % 3600) / 60);
        data.s = totalS % 60;
        data.running = false;
        data.startTime = null;
        localStorage.setItem("timerTime", JSON.stringify(data));
        clearInterval(tInt);
        updateTimerUI();
    };
}

if (resetBtn) {
    resetBtn.onclick = () => {
        const currentData = getTimerData();
        const elapsed = currentData.running ? Math.floor((Date.now() - currentData.startTime) / 1000) : 0;
        const sessionS = (currentData.h * 3600) + (currentData.m * 60) + currentData.s + elapsed;
        const lifetime = parseInt(localStorage.getItem("lifetimeStudySeconds") || 0);
        localStorage.setItem("lifetimeStudySeconds", lifetime + sessionS);
        clearInterval(tInt);
        localStorage.removeItem("timerTime");
        updateTimerUI();
    };
}

// Initialize Timer on load
const initialData = getTimerData();
if (initialData.running) startInterval();
updateTimerUI();