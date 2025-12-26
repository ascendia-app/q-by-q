document.addEventListener("DOMContentLoaded", () => {
  // Elements
  const questionNumberEl = document.getElementById("question-number");
  const questionContentEl = document.getElementById("question-content");
  const prevBtn = document.getElementById("prevBtn");
  const nextBtn = document.getElementById("nextBtn");
  const questionList = document.getElementById("questionList");
  const markSchemeBtn = document.getElementById("markSchemeBtn");
  const markSchemeViewer = document.getElementById("markSchemeViewer");

  const subjectSelect = document.getElementById("subjectSelect");
  const paperSelect = document.getElementById("paperSelect");
  const yearSelect = document.getElementById("yearSelect");
  const seasonSelect = document.getElementById("seasonSelect");
  const variantSelect = document.getElementById("variantSelect");
  const loadPaperBtn = document.getElementById("loadPaperBtn");

  let questions = [];
  let currentIndex = 0;

  // Render sidebar
  function renderQuestionList() {
    questionList.innerHTML = "";
    questions.forEach((q, index) => {
      const btn = document.createElement("button");
      btn.textContent = q.number;
      btn.className = "question-btn";
      if (index === currentIndex) btn.classList.add("active");
      btn.onclick = () => {
        currentIndex = index;
        renderQuestion();
        renderQuestionList();
        saveState();
      };
      questionList.appendChild(btn);
    });
  }

  // Render question & markscheme
  function renderQuestion() {
    if (!questions[currentIndex]) return;
    const q = questions[currentIndex];
    questionNumberEl.textContent = `Question ${q.number}`;

    // Question images
    questionContentEl.innerHTML = "";
    q.images.forEach(src => {
      const img = document.createElement("img");
      img.src = src;
      img.className = "question-image";
      img.alt = `Question ${q.number}`;
      questionContentEl.appendChild(img);
    });

    // Markscheme images
    markSchemeViewer.innerHTML = "";
    q.markImages.forEach(src => {
      const img = document.createElement("img");
      img.src = src;
      img.className = "markscheme-image";
      img.alt = `Mark Scheme ${q.number}`;
      markSchemeViewer.appendChild(img);
    });
  }

  // Navigation
  prevBtn.onclick = () => {
    if (currentIndex > 0) {
      currentIndex--;
      renderQuestion();
      renderQuestionList();
      saveState();
    }
  };
  nextBtn.onclick = () => {
    if (currentIndex < questions.length - 1) {
      currentIndex++;
      renderQuestion();
      renderQuestionList();
      saveState();
    }
  };

  // Markscheme toggle
  markSchemeBtn.onclick = () => {
    if (markSchemeViewer.classList.contains("open")) {
      markSchemeViewer.style.height = "0";
      markSchemeViewer.classList.remove("open");
      markSchemeBtn.textContent = "Show Mark Scheme";
    } else {
      markSchemeViewer.classList.add("open");
      markSchemeViewer.style.height = markSchemeViewer.scrollHeight + "px";
      markSchemeBtn.textContent = "Hide Mark Scheme";
    }
  };

  // Save paper & question state
  function saveState() {
    const state = {
      subject: subjectSelect.value,
      paper: paperSelect.value,
      year: yearSelect.value,
      season: seasonSelect.value,
      variant: variantSelect.value,
      currentIndex
    };
    localStorage.setItem("lastPaper", JSON.stringify(state));
  }

  // Load paper dynamically
  loadPaperBtn.onclick = () => {
    const subject = subjectSelect.value;
    const paper = paperSelect.value;
    const year = yearSelect.value;
    const season = seasonSelect.value;
    const variant = variantSelect.value;

    if (!subject || !paper || !year || !season || !variant) {
      alert("Please select all options!");
      return;
    }

    const paperMap = { pure1: "1", pure3: "3", mechanics: "4", stats1: "5" };
    const paperCode = paperMap[paper.toLowerCase()] + variant; // e.g., '3' + '1' → '31'
// Determine yearCode based on season
let yearCode;
switch(season.toLowerCase()) {
  case "febmar":
    yearCode = "m" + year.slice(2); // e.g., 2024 → m24
    break;
  case "mayjun":
    yearCode = "s" + year.slice(2); // e.g., 2024 → s24
    break;
  case "octnov":
    yearCode = "w" + year.slice(2); // e.g., 2024 → w24
    break;
  default:
    yearCode = "s" + year.slice(2); // fallback
}


    questions = [];
    currentIndex = 0;

    let i = 1;

    const loadQuestionParts = () => {
      let partIndex = 0;
      const parts = [];
      const markParts = [];
      const partLetters = "abcdefghijklmnopqrstuvwxyz";

      const tryNextPart = () => {
        if (partIndex >= partLetters.length) {
          if (parts.length > 0) {
            questions.push({ number: i, images: parts, markImages: markParts });
            i++;
            loadQuestionParts();
          } else {
            // Finished loading all questions
            renderQuestionList();
            renderQuestion();
            saveState();
          }
          return;
        }

        const part = partLetters[partIndex];
const qImgPath = `images/${subject}_${yearCode}_qp_${paperCode}_q${i}${part}.PNG`;
const mImgPath = `images/${subject}_${yearCode}_ms_${paperCode}_q${i}${part}.PNG`;


        const img = new Image();
        img.onload = () => {
          parts.push(qImgPath);
          markParts.push(mImgPath);
          partIndex++;
          tryNextPart();
        };
        img.onerror = () => {
          if (parts.length > 0) {
            questions.push({ number: i, images: parts, markImages: markParts });
            i++;
            loadQuestionParts();
          } else if (i === 1) {
            alert("No questions found for this paper!");
          } else {
            renderQuestionList();
            renderQuestion();
            saveState();
          }
        };
        img.src = qImgPath;
      };

      tryNextPart();
    };

    loadQuestionParts();
  };

  // Restore last loaded paper
  const lastPaper = JSON.parse(localStorage.getItem("lastPaper"));
  if (lastPaper) {
    subjectSelect.value = lastPaper.subject;
    paperSelect.value = lastPaper.paper;
    yearSelect.value = lastPaper.year;
    seasonSelect.value = lastPaper.season;
    variantSelect.value = lastPaper.variant;
    loadPaperBtn.click();

    const restoreIndex = lastPaper.currentIndex;
    const interval = setInterval(() => {
      if (questions.length > 0) {
        currentIndex = restoreIndex < questions.length ? restoreIndex : 0;
        renderQuestion();
        renderQuestionList();
        clearInterval(interval);
      }
    }, 100);
  }
});

document.addEventListener("DOMContentLoaded", () => {
  let hoursEl = document.getElementById("hours");
  let minutesEl = document.getElementById("minutes");
  let secondsEl = document.getElementById("seconds");

  let startBtn = document.getElementById("startTimer");
  let pauseBtn = document.getElementById("pauseTimer");
  let resetBtn = document.getElementById("resetTimer");

  let timerInterval;
  let hours = 0, minutes = 0, seconds = 0;

  // Restore time from localStorage
  const savedTime = JSON.parse(localStorage.getItem("timerTime"));
  const isRunning = JSON.parse(localStorage.getItem("timerRunning"));

  if (savedTime) {
    hours = savedTime.hours;
    minutes = savedTime.minutes;
    seconds = savedTime.seconds;
    updateDisplay();
  }

  // If timer was running before reload, continue
  if (isRunning) startTimer();

  function updateDisplay() {
    hoursEl.textContent = String(hours).padStart(2, "0");
    minutesEl.textContent = String(minutes).padStart(2, "0");
    secondsEl.textContent = String(seconds).padStart(2, "0");
  }

  function saveTime() {
    localStorage.setItem("timerTime", JSON.stringify({ hours, minutes, seconds }));
    localStorage.setItem("timerRunning", timerInterval ? true : false);
  }

  function startTimer() {
    if (timerInterval) return; // already running
    timerInterval = setInterval(() => {
      seconds++;
      if (seconds >= 60) {
        seconds = 0;
        minutes++;
      }
      if (minutes >= 60) {
        minutes = 0;
        hours++;
      }
      updateDisplay();
      saveTime();
    }, 1000);
  }

  function pauseTimer() {
    clearInterval(timerInterval);
    timerInterval = null;
    saveTime();
  }

  function resetTimer() {
    clearInterval(timerInterval);
    timerInterval = null;
    hours = 0;
    minutes = 0;
    seconds = 0;
    updateDisplay();
    saveTime();
  }

  startBtn.addEventListener("click", startTimer);
  pauseBtn.addEventListener("click", pauseTimer);
  resetBtn.addEventListener("click", resetTimer);
});
