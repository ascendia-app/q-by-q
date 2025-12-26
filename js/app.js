document.addEventListener("DOMContentLoaded", () => {

  const questionNumberEl = document.getElementById("question-number");
  const questionMarksEl = document.getElementById("question-marks");
  const questionContentEl = document.getElementById("question-content");
  const prevBtn = document.getElementById("prevBtn");
  const nextBtn = document.getElementById("nextBtn");
  const questionList = document.getElementById("questionList");

  const questions = [
    { number: 1, marks: 5, content: "This is Question 1" },
    { number: 2, marks: 8, content: "This is Question 2" },
    { number: 3, marks: 6, content: "This is Question 3" }
  ];

  let currentIndex = 0;

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
      };
      questionList.appendChild(btn);
    });
  }

  function renderQuestion() {
    const q = questions[currentIndex];
    questionNumberEl.textContent = `Question ${q.number}`;
    questionMarksEl.textContent = `${q.marks} marks`;
    questionContentEl.innerHTML = `<p>${q.content}</p>`;
    renderQuestionList();
  }

  prevBtn.onclick = () => {
    if (currentIndex > 0) {
      currentIndex--;
      renderQuestion();
    }
  };

  nextBtn.onclick = () => {
    if (currentIndex < questions.length - 1) {
      currentIndex++;
      renderQuestion();
    }
  };

  renderQuestion();

});
const markSchemeBtn = document.getElementById("markSchemeBtn");
const markSchemeViewer = document.getElementById("markSchemeViewer");

markSchemeBtn.onclick = () => {
  markSchemeViewer.classList.toggle("open");
  markSchemeBtn.textContent = markSchemeViewer.classList.contains("open")
    ? "Hide Mark Scheme"
    : "Show Mark Scheme";
};
