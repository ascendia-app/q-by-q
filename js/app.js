console.log("questionList:", questionList);

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
const questionList = document.getElementById("questionList");
function renderQuestionList() {
  questionList.innerHTML = "";

  questions.forEach((q, index) => {
    const btn = document.createElement("button");
    btn.textContent = q.number;
    btn.classList.add("question-btn");

    if (index === currentIndex) {
      btn.classList.add("active");
    }

    btn.addEventListener("click", () => {
      currentIndex = index;
      renderQuestion();
      renderQuestionList();
    });

    questionList.appendChild(btn);
  });
}


function renderQuestionList() {
  questionList.innerHTML = "";

  questions.forEach((q, index) => {
    const btn = document.createElement("button");
    btn.textContent = q.number;
    btn.className = "question-btn";

    if (index === currentIndex) {
      btn.classList.add("active");
    }

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

renderQuestion();

