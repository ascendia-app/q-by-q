const questions = [
  {
    number: 1,
    marks: 5,
    content: "This is Question 1. Question content goes here."
  },
  {
    number: 2,
    marks: 8,
    content: "This is Question 2. Question content goes here."
  },
  {
    number: 3,
    marks: 6,
    content: "This is Question 3. Question content goes here."
  }
];

let currentIndex = 0;

const questionNumberEl = document.getElementById("question-number");
const questionMarksEl = document.getElementById("question-marks");
const questionContentEl = document.getElementById("question-content");

const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");

function renderQuestion() {
  const q = questions[currentIndex];
  questionNumberEl.textContent = `Question ${q.number}`;
  questionMarksEl.textContent = `${q.marks} marks`;
  questionContentEl.innerHTML = `<p>${q.content}</p>`;
}

prevBtn.addEventListener("click", () => {
  if (currentIndex > 0) {
    currentIndex--;
    renderQuestion();
  }
});

nextBtn.addEventListener("click", () => {
  if (currentIndex < questions.length - 1) {
    currentIndex++;
    renderQuestion();
  }
});

renderQuestion();
