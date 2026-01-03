/* =========================================
   1. AUTHENTICATION & GLOBAL STATE
   ========================================= */
const API_BASE_URL = "https://q-by-q.vercel.app/api"; 
const urlParams = new URLSearchParams(window.location.search);

// Global State
let questions = [];
let currentIndex = 0;

/**
 * Sanitizes token and verifies with backend.
 * Updates Sidebar UI based on auth status.
 */
async function checkAuth() {
    let token = localStorage.getItem("token");
    
    if (token && (token.startsWith('"') || token.startsWith("'"))) {
        token = token.substring(1, token.length - 1);
    }

    if (!token || token === "null" || token === "undefined" || token.length < 20) {
        updateSidebarAuthBtn(false);
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
            updateSidebarAuthBtn(true);
            return true;
        } else {
            updateSidebarAuthBtn(true); 
            return true;
        }
    } catch (err) {
        updateSidebarAuthBtn(true); 
        return true; 
    }
}

function updateSidebarAuthBtn(isLoggedIn) {
    const authBtn = document.getElementById("authTopBtn");
    if (!authBtn) return;

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
   2. MAIN APPLICATION LOGIC
   ========================================= */
document.addEventListener("DOMContentLoaded", async () => {
    // 1. Initial Setup
    await checkAuth();

    // UI Elements
    const questionNumberEl = document.getElementById("question-number");
    const questionContentEl = document.getElementById("question-content");
    const prevBtn = document.getElementById("prevBtn");
    const nextBtn = document.getElementById("nextBtn");
    const questionList = document.getElementById("questionList");
    const markSchemeBtn = document.getElementById("markSchemeBtn");
    const markSchemeViewer = document.getElementById("markSchemeViewer");
    const saveBtn = document.getElementById('saveQuestionBtn');
    const loadPaperBtn = document.getElementById("loadPaperBtn");
    const notFoundModal = document.getElementById('notFoundModal');

    // Note Modal Elements
    const noteModal = document.getElementById('noteModal');
    const openNoteBtn = document.getElementById('openNoteModalBtn');
    const closeNoteBtn = document.getElementById('closeNoteModal');
    const saveWithNoteConfirmBtn = document.getElementById('saveWithNoteConfirmBtn');
    const noteTextArea = document.getElementById('noteTextArea');
    
    // Filter Selectors
    const subjectSelect = document.getElementById("subjectSelect");
    const paperSelect = document.getElementById("paperSelect");
    const yearSelect = document.getElementById("yearSelect");
    const seasonSelect = document.getElementById("seasonSelect");
    const variantSelect = document.getElementById("variantSelect");

    /* --- CORE LOGIC FUNCTIONS --- */

    /**
     * Checks if a note exists for the current question in localStorage
     * and displays it in the revision note box.
     */
    function updateQuestionNote() {
        const noteBox = document.getElementById('active-question-note');
        const noteText = document.getElementById('note-text-content');
        if (!noteBox || !noteText || questions.length === 0) {
            if (noteBox) noteBox.style.display = 'none';
            return;
        }

        const q = questions[currentIndex];
        const currentId = `${subjectSelect.value}_${yearSelect.value}_${seasonSelect.value}_${variantSelect.value}_q${q.number}`;
        
        const saved = JSON.parse(localStorage.getItem('savedQuestions')) || [];
        const matched = saved.find(sq => sq.id === currentId);

        if (matched && matched.note && matched.note.trim() !== "") {
            noteText.textContent = matched.note;
            noteBox.style.display = 'flex';
        } else {
            noteBox.style.display = 'none';
        }
    }

    function handleSaveAction(note = null) {
        let token = localStorage.getItem("token");
        if (!token || token.length < 20) {
            window.location.href = "pleaselogin.html";
            return;
        }
        if (questions.length === 0) return;

        const q = questions[currentIndex];
        const currentId = `${subjectSelect.value}_${yearSelect.value}_${seasonSelect.value}_${variantSelect.value}_q${q.number}`;
        let currentSaved = JSON.parse(localStorage.getItem('savedQuestions')) || [];
        const existingIndex = currentSaved.findIndex(sq => sq.id === currentId);
        
        if (existingIndex === -1 || note !== null) {
            const saveObj = { 
                id: currentId, 
                subjectVal: subjectSelect.value, 
                paper: paperSelect.value, 
                year: yearSelect.value, 
                season: seasonSelect.value, 
                variant: variantSelect.value, 
                questionNum: q.number,
                note: note !== null ? note : (currentSaved[existingIndex]?.note || ""),
                dateSaved: new Date().toISOString()
            };

            if (existingIndex > -1) {
                currentSaved[existingIndex] = saveObj;
            } else {
                currentSaved.push(saveObj);
            }
        } else {
            currentSaved.splice(existingIndex, 1);
        }
        
        localStorage.setItem('savedQuestions', JSON.stringify(currentSaved));
        updateSaveButtonState();
        updateQuestionNote(); // Update the note display immediately after saving
    }

    function saveState() {
        if (!subjectSelect.value || questions.length === 0) return;
        const paperDisplayName = paperSelect.options[paperSelect.selectedIndex]?.text || "Paper";
        const subjectDisplayName = subjectSelect.options[subjectSelect.selectedIndex]?.text || "9709 Maths";

        localStorage.setItem("lastPaper", JSON.stringify({
            subject: subjectDisplayName, 
            subjectCode: subjectSelect.value, 
            paper: paperSelect.value, 
            paperName: paperDisplayName, 
            year: yearSelect.value,
            series: seasonSelect.value,
            variant: "v" + variantSelect.value,
            currentIndex: currentIndex
        }));
    }

    function renderQuestion() {
        if (!questions[currentIndex]) return;
        const q = questions[currentIndex];

        if (questionNumberEl) questionNumberEl.textContent = `Question ${q.number}`;

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
            img.loading = "lazy";
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
        updateQuestionNote(); // Show the note if it exists for this specific question
    }

    function renderUI() {
        renderQuestion();
        if (questionList) {
            questionList.innerHTML = "";
            questions.forEach((q, index) => {
                const btn = document.createElement("button");
                btn.textContent = q.number;
                btn.className = index === currentIndex ? "question-btn active" : "question-btn";
                btn.onclick = () => { currentIndex = index; renderUI(); };
                questionList.appendChild(btn);
            });
        }
        if (prevBtn) prevBtn.style.visibility = (currentIndex === 0) ? "hidden" : "visible";
        if (nextBtn) nextBtn.style.visibility = (currentIndex === questions.length - 1 || questions.length === 0) ? "hidden" : "visible";
        saveState(); 
    }

    function updateSaveButtonState() {
        if (!questions[currentIndex] || !saveBtn) return;
        const q = questions[currentIndex];
        const currentId = `${subjectSelect.value}_${yearSelect.value}_${seasonSelect.value}_${variantSelect.value}_q${q.number}`;
        const currentSaved = JSON.parse(localStorage.getItem('savedQuestions')) || [];
        const isSaved = currentSaved.some(sq => sq.id === currentId);
        
        if (isSaved) {
            saveBtn.innerHTML = `<i class="fas fa-bookmark"></i> Saved`;
            saveBtn.style.color = "#eab308";
        } else {
            saveBtn.innerHTML = `<i class="far fa-bookmark"></i> Save`;
            saveBtn.style.color = "";
        }
    }

    /* --- UI EVENT HANDLERS --- */

    if (saveBtn) {
        saveBtn.onclick = () => handleSaveAction();
    }

 if (openNoteBtn) {
    openNoteBtn.onclick = (e) => {
        e.preventDefault();

        // --- AUTH CHECK ADDED HERE ---
        let token = localStorage.getItem("token");
        if (!token || token.length < 20) {
            window.location.href = "pleaselogin.html";
            return;
        }
        // -----------------------------

        if (questions.length === 0) return;
        
        const q = questions[currentIndex];
        const currentId = `${subjectSelect.value}_${yearSelect.value}_${seasonSelect.value}_${variantSelect.value}_q${q.number}`;
        const currentSaved = JSON.parse(localStorage.getItem('savedQuestions')) || [];
        const existing = currentSaved.find(sq => sq.id === currentId);
        
        noteTextArea.value = existing?.note || "";
        noteModal.style.display = 'flex';
    };
}
    if (closeNoteBtn) {
        closeNoteBtn.onclick = () => noteModal.style.display = 'none';
    }

    if (saveWithNoteConfirmBtn) {
        saveWithNoteConfirmBtn.onclick = () => {
            handleSaveAction(noteTextArea.value.trim());
            noteModal.style.display = 'none';
        };
    }

if (loadPaperBtn) {
    loadPaperBtn.onclick = (e) => {
        // Only reset to 0 if the click was a real manual user click
        // If it's a "simulated" click from the auto-resume logic, keep the currentIndex
        if (e && e.isTrusted) {
            currentIndex = 0;
        }
        
        const originalBtnHTML = `<i class="fas fa-sync-alt"></i> Load Paper`;
        // ... rest of your code ...
            loadPaperBtn.disabled = true;
            loadPaperBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Loading...`;

            const paperMap = { pure1: "1", pure3: "3", mechanics: "4", stats1: "5" };
            const pCode = (paperMap[paperSelect.value.toLowerCase()] || paperSelect.value) + variantSelect.value;
            const yCode = (seasonSelect.value === "febmar" ? "m" : seasonSelect.value === "mayjun" ? "s" : "w") + yearSelect.value.slice(-2);
            
            questions = [];
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
                        if (img.complete && img.naturalWidth > 0) {
                            questions.push({ number: qNum, images: [qPath], markImages: [mPath] });
                            qNum++; loadNextQuestion();
                        } else { finalizeLoading(); }
                    };
                    img.onerror = () => finalizeLoading();
                    img.src = qPath;
                };

                const finishQuestion = () => {
                    questions.push({ number: qNum, images: parts, markImages: markParts });
                    qNum++; loadNextQuestion();
                };

      // Inside finalizeLoading in app.js
const finalizeLoading = () => {
    loadPaperBtn.disabled = false;
    loadPaperBtn.innerHTML = originalBtnHTML;
    if (questions.length === 0) {
        if (notFoundModal) notFoundModal.style.display = 'flex';
        return; 
    }
    
    // Ensure the index doesn't exceed the number of questions found
    if (currentIndex >= questions.length) currentIndex = 0;
    
    renderUI();
};
                tryPart();
            };
            loadNextQuestion();
        };
    }

    /* --- SESSION RECOVERY & INITIALIZATION --- */
    function applyVariantRule() {
        const selectedSeason = seasonSelect.value;
        const savedVal = variantSelect.value;
        variantSelect.innerHTML = "";
        if (selectedSeason === "febmar") {
            variantSelect.innerHTML = `<option value="2">v2</option>`;
            variantSelect.value = "2";
        } else {
            ["1", "2", "3"].forEach(v => {
                const opt = document.createElement("option");
                opt.value = v; opt.textContent = "v" + v;
                variantSelect.appendChild(opt);
            });
            if (["1", "2", "3"].includes(savedVal)) variantSelect.value = savedVal;
        }
    }

    if (seasonSelect) seasonSelect.addEventListener('change', applyVariantRule);

    const resumePaper = urlParams.get('paper');
    const resumeYear = urlParams.get('year');
    const lastSession = JSON.parse(localStorage.getItem("lastPaper"));

    if (resumePaper && resumeYear) {
        subjectSelect.value = "9709";
        paperSelect.value = resumePaper;
        yearSelect.value = resumeYear;
        seasonSelect.value = urlParams.get('series') || "mayjun";
        applyVariantRule();
        variantSelect.value = (urlParams.get('variant') || "v1").replace('v', '');
        currentIndex = parseInt(urlParams.get('q') || 0);
        loadPaperBtn.click();
    } else if (lastSession) {
        subjectSelect.value = lastSession.subjectCode || "9709";
        paperSelect.value = lastSession.paper;
        yearSelect.value = lastSession.year;
        seasonSelect.value = lastSession.series;
        applyVariantRule();
        variantSelect.value = lastSession.variant.replace('v', '');
        currentIndex = lastSession.currentIndex || 0;
        loadPaperBtn.click();
    } else {
        applyVariantRule();
    }

    // Navigation Click Events
    if (prevBtn) prevBtn.onclick = () => { if (currentIndex > 0) { currentIndex--; renderUI(); } };
    if (nextBtn) nextBtn.onclick = () => { if (currentIndex < questions.length - 1) { currentIndex++; renderUI(); } };
    if (markSchemeBtn) {
        markSchemeBtn.onclick = () => {
            const isOpen = markSchemeViewer.classList.toggle("open");
            markSchemeViewer.style.display = isOpen ? "block" : "none";
            markSchemeBtn.innerHTML = isOpen ? `<i class="fas fa-eye-slash"></i> Hide Markscheme` : `<i class="fas fa-eye"></i> Show Markscheme`;
        };
    }

    // Sidebar Toggle
    const sidebar = document.getElementById("sidebar");
    const toggleSidebar = document.getElementById("toggleSidebar");
    if (localStorage.getItem("sidebarCollapsed") === "true") sidebar?.classList.add("collapsed");
    if (toggleSidebar) {
        toggleSidebar.onclick = () => {
            sidebar.classList.toggle("collapsed");
            localStorage.setItem("sidebarCollapsed", sidebar.classList.contains("collapsed"));
        };
    }
});

/* =========================================
   3. GLOBAL CLICK LISTENER (Modals & Auth)
   ========================================= */
window.addEventListener('click', (e) => {
    const logoutModal = document.getElementById('logoutModal');
    const noteModal = document.getElementById('noteModal');
    const notFoundModal = document.getElementById('notFoundModal');
    const authBtn = e.target.closest('#authTopBtn');

    if (authBtn) {
        if (authBtn.classList.contains('logout-state')) {
            if (logoutModal) logoutModal.style.display = 'flex';
        } else {
            window.location.href = "pleaselogin.html";
        }
        return;
    }

    if (e.target === logoutModal || e.target.id === 'cancelLogout') {
        if (logoutModal) logoutModal.style.display = 'none';
    }

    if (e.target.id === 'confirmLogout') {
        localStorage.removeItem("token");
        localStorage.removeItem("lastPaper"); 
        window.location.href = "pleaselogin.html";
    }

    if (e.target === noteModal) {
        noteModal.style.display = 'none';
    }

    if (e.target === notFoundModal || e.target.id === 'closeNotFound') {
        if (notFoundModal) notFoundModal.style.display = 'none';
    }
});

/* =========================================
   4. TIMER LOGIC
   ========================================= */
const hoursEl = document.getElementById("hours"), 
      minutesEl = document.getElementById("minutes"), 
      secondsEl = document.getElementById("seconds"),
      startBtn = document.getElementById("startTimer"), 
      pauseBtn = document.getElementById("pauseTimer"), 
      resetBtn = document.getElementById("resetTimer");
let tInt = null;

function getTimerData() { 
    const data = localStorage.getItem("timerTime");
    return (data && data !== "undefined") ? JSON.parse(data) : { h: 0, m: 0, s: 0, startTime: null, running: false }; 
}

function updateTimerUI() {
    const data = getTimerData();
    let totalS = (data.h * 3600) + (data.m * 60) + data.s;
    if (data.running && data.startTime) {
        totalS += Math.floor((Date.now() - data.startTime) / 1000);
    }
    if(hoursEl) hoursEl.textContent = String(Math.floor(totalS / 3600)).padStart(2, "0");
    if(minutesEl) minutesEl.textContent = String(Math.floor((totalS % 3600) / 60)).padStart(2, "0");
    if(secondsEl) secondsEl.textContent = String(totalS % 60).padStart(2, "0");
}

if (startBtn) {
    startBtn.onclick = () => {
        let data = getTimerData(); 
        if (data.running) return;
        data.running = true; 
        data.startTime = Date.now();
        localStorage.setItem("timerTime", JSON.stringify(data));
        tInt = setInterval(updateTimerUI, 1000);
    };
}

if (pauseBtn) {
    pauseBtn.onclick = () => {
        let data = getTimerData(); 
        if (!data.running) return;
        const elapsed = Math.floor((Date.now() - data.startTime) / 1000);
        let totalS = (data.h * 3600) + (data.m * 60) + data.s + elapsed;
        localStorage.setItem("timerTime", JSON.stringify({ 
            h: Math.floor(totalS / 3600), m: Math.floor((totalS % 3600) / 60), s: totalS % 60, 
            running: false, startTime: null 
        }));
        clearInterval(tInt); 
        updateTimerUI();
    };
}

if (resetBtn) {
    resetBtn.onclick = () => { 
        const data = getTimerData();
        let currentS = (data.h * 3600) + (data.m * 60) + data.s;
        if (data.running && data.startTime) currentS += Math.floor((Date.now() - data.startTime) / 1000);
        const existingLifetime = parseInt(localStorage.getItem("lifetimeStudySeconds") || 0);
        localStorage.setItem("lifetimeStudySeconds", existingLifetime + currentS);
        clearInterval(tInt); 
        localStorage.removeItem("timerTime"); 
        updateTimerUI(); 
    };
}

if (getTimerData().running) tInt = setInterval(updateTimerUI, 1000);
updateTimerUI();