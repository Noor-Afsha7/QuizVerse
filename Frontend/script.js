
// ==========================================
// QUIZVERSE - MAIN JAVASCRIPT
// ==========================================


// 1. REGISTRATION FORM

const registerForm = document.getElementById("registerForm");

if (registerForm) {
    registerForm.addEventListener("submit", async function (e) {
        e.preventDefault();

        const name = document.getElementById("name").value.trim();
        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value;
        const confirmPassword = document.getElementById("confirmPassword").value;

        if (password !== confirmPassword) {
            alert("Passwords do not match!");
            return;
        }

        try {
            const response = await fetch("http://localhost:8080/api/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, email, password })
            });

            const data = await response.json();

            if (!response.ok) {
                alert(data.message || "Registration failed!");
                return;
            }

            alert("Registration successful! You can now log in.");
            window.location.href = "login.html";

        } catch (error) {
            console.error("Registration error:", error);
            alert("Cannot connect to the server. Please try again.");
        }
    });
}



// 2. LOGIN FORM

const loginForm = document.getElementById("loginForm");

if (loginForm) {
    loginForm.addEventListener("submit", async function (e) {
        e.preventDefault();

        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value;

        try {
            const response = await fetch("http://localhost:8080/api/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (!response.ok) {
                alert(data.message || "Login failed!");
                return;
            }

            sessionStorage.setItem("loggedInUser", JSON.stringify(data.user));

            alert(`Welcome, ${data.user.name}!`);

            window.location.href = data.user.role === "admin"
                ? "admin-dashboard.html"
                : "dashboard.html";

        } catch (error) {
            console.error("Login error:", error);
            alert("Cannot connect to the server.");
        }
    });
}

// 3. QUIZ SEARCH AND CATEGORY FILTER
const quizSearch = document.getElementById("quizSearch");
const categoryFilter = document.getElementById("categoryFilter");
const quizItems = document.querySelectorAll(".quiz-item");
const noQuizzes = document.getElementById("noQuizzes");

function filterQuizzes() {
    const searchText = quizSearch.value.toLowerCase().trim();
    const selectedCategory = categoryFilter.value;

    let visibleCount = 0;

    quizItems.forEach(function (quiz) {
        const title = quiz.querySelector("h2").textContent.toLowerCase();
        const description = quiz.querySelector("p").textContent.toLowerCase();
        const category = quiz.dataset.category;

        const matchesSearch =
            title.includes(searchText) ||
            description.includes(searchText);

        const matchesCategory =
            selectedCategory === "all" ||
            category === selectedCategory;

        if (matchesSearch && matchesCategory) {
            quiz.style.display = "flex";
            visibleCount++;
        } else {
            quiz.style.display = "none";
        }
    });

    if (noQuizzes) {
        noQuizzes.hidden = visibleCount !== 0;
    }
}

if (quizSearch && categoryFilter) {
    quizSearch.addEventListener("input", filterQuizzes);
    categoryFilter.addEventListener("change", filterQuizzes);
}


// ==========================================
// 4 & 5. QUIZ ATTEMPT - JAVA API
// ==========================================

(async () => {

    const questionText = document.getElementById("questionText");
    const optionsList = document.getElementById("optionsList");
    const questionCount = document.getElementById("questionCount");
    const progressPercent = document.getElementById("progressPercent");
    const progressFill = document.getElementById("progressFill");
    const previousBtn = document.getElementById("previousBtn");
    const nextBtn = document.getElementById("nextBtn");
    const submitBtn = document.getElementById("submitBtn");
    const timerDisplay = document.getElementById("timer");

    // Run only on the actual quiz attempt page
    if (
        !questionText ||
        !optionsList ||
        !questionCount ||
        !progressPercent ||
        !progressFill ||
        !previousBtn ||
        !nextBtn ||
        !submitBtn ||
        !timerDisplay
    ) return;

    const quizId = new URLSearchParams(window.location.search).get("quizId");

    if (!quizId) {
        alert("Please select a quiz first.");
        window.location.replace("quizzes.html");
        return;
    }

    let selectedQuiz;
    let questions;

    try {
        const [quizResponse, questionResponse] = await Promise.all([
            fetch(`http://localhost:8080/api/quizzes/${quizId}`),
            fetch(`http://localhost:8080/api/questions/quiz/${quizId}`)
        ]);

        if (!quizResponse.ok || !questionResponse.ok) {
            throw new Error("Unable to load quiz.");
        }

        selectedQuiz = await quizResponse.json();

        const questionData = await questionResponse.json();

        questions = questionData.map(question => ({
            question: question.questionText,
            options: [
                question.optionA,
                question.optionB,
                question.optionC,
                question.optionD
            ],
            answer: Number(question.correctAnswer),
            marks: Number(question.marks)
        }));

    } catch (error) {
        console.error("Quiz loading error:", error);
        alert("Unable to load this quiz. Please try again.");
        window.location.replace("quizzes.html");
        return;
    }

    if (questions.length === 0) {
        alert("This quiz doesn't have any questions yet.");
        window.location.replace("quizzes.html");
        return;
    }

    let currentQuestion = 0;
    let selectedAnswers = Array(questions.length).fill(null);
    let timeLeft = selectedQuiz.duration * 60;
    let quizSubmitted = false;
    let timerInterval;

    document.getElementById("quizTitle").textContent = selectedQuiz.title;

    document.getElementById("quizDescription").textContent =
        selectedQuiz.description || "";

    document.getElementById("quizCategory").textContent =
        (selectedQuiz.category || "").toUpperCase() + " / " +
        (selectedQuiz.difficulty || "").toUpperCase();

    // DISPLAY QUESTION
    function displayQuestion() {

        const question = questions[currentQuestion];

        questionText.textContent = question.question;

        document.getElementById("questionNumber").textContent =
            `QUESTION ${String(currentQuestion + 1).padStart(2, "0")}`;

        questionCount.textContent =
            `Question ${currentQuestion + 1} of ${questions.length}`;

        const progress = ((currentQuestion + 1) / questions.length) * 100;

        progressPercent.textContent =
            `${Math.round(progress)}% completed`;

        progressFill.style.width = `${progress}%`;

        optionsList.innerHTML = "";

        question.options.forEach((option, index) => {

            const button = document.createElement("button");

            button.className = "option-btn";
            button.type = "button";

            if (selectedAnswers[currentQuestion] === index) {
                button.classList.add("selected");
            }

            const letter = document.createElement("span");
            letter.textContent = String.fromCharCode(65 + index);

            const optionText = document.createElement("p");
            optionText.textContent = option;

            button.appendChild(letter);
            button.appendChild(optionText);

            button.addEventListener("click", () => {
                selectedAnswers[currentQuestion] = index;
                displayQuestion();
            });

            optionsList.appendChild(button);
        });

        previousBtn.disabled = currentQuestion === 0;

        nextBtn.hidden = currentQuestion === questions.length - 1;

        submitBtn.hidden = currentQuestion !== questions.length - 1;
    }

    // PREVIOUS QUESTION
    previousBtn.addEventListener("click", () => {
        if (currentQuestion > 0) {
            currentQuestion--;
            displayQuestion();
        }
    });

    // NEXT QUESTION
    nextBtn.addEventListener("click", () => {
        if (currentQuestion < questions.length - 1) {
            currentQuestion++;
            displayQuestion();
        }
    });

    // SUBMIT QUIZ
   
async function submitQuiz() {

    if (quizSubmitted) return;

    quizSubmitted = true;
    clearInterval(timerInterval);

    let score = 0;
    let earnedMarks = 0;
    let totalMarks = 0;

    questions.forEach(function (question, index) {

        totalMarks += question.marks;

        if (selectedAnswers[index] === question.answer) {
            score++;
            earnedMarks += question.marks;
        }

    });

    const percentage = totalMarks > 0
        ? Number(((earnedMarks / totalMarks) * 100).toFixed(2))
        : 0;

    const loggedInUser = JSON.parse(
        sessionStorage.getItem("loggedInUser") || "null"
    );

    if (!loggedInUser) {
        alert("Please log in before submitting your quiz.");
        window.location.href = "login.html";
        return;
    }

    const resultData = {
        userId: loggedInUser.id,
        quizId: Number(quizId),
        score: earnedMarks,
        correctAnswers: score,
        incorrectAnswers: questions.length - score,
        totalQuestions: questions.length,
        percentage: percentage
    };

    try {
        const response = await fetch("http://localhost:8080/api/results", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(resultData)
        });

        if (!response.ok) {
            throw new Error("Could not save quiz result.");
        }

        sessionStorage.setItem("quizScore", score);
        sessionStorage.setItem("totalQuestions", questions.length);
        sessionStorage.setItem("earnedMarks", earnedMarks);
        sessionStorage.setItem("totalMarks", totalMarks);
        sessionStorage.setItem("completedQuizTitle", selectedQuiz.title);

        sessionStorage.setItem(
            "quizAnswers",
            JSON.stringify(selectedAnswers)
        );

        window.location.href = "result.html";

    } catch (error) {
        console.error("Result saving error:", error);
        quizSubmitted = false;
        alert("Your result could not be saved. Please try submitting again.");
    }
}

    // SUBMIT BUTTON
    submitBtn.addEventListener("click", () => {

        const unanswered = selectedAnswers.filter(
            answer => answer === null
        ).length;

        if (unanswered > 0) {
            const confirmSubmit = confirm(
                `You have ${unanswered} unanswered questions. Submit anyway?`
            );

            if (!confirmSubmit) return;
        }

        submitQuiz();
    });

    // COUNTDOWN TIMER
    function updateTimer() {

        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;

        timerDisplay.textContent =
            `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            alert("Time is up! Your quiz will be submitted.");
            submitQuiz();
            return;
        }

        timeLeft--;
    }

    // INITIALIZE QUIZ
    displayQuestion();
    updateTimer();

    timerInterval = setInterval(updateTimer, 1000);

})();

const exitQuiz = document.getElementById("exitQuiz");

if (exitQuiz) {
    exitQuiz.addEventListener("click", function (event) {
        const confirmExit = confirm(
            "Are you sure you want to leave this quiz? Your progress will be lost."
        );

        if (!confirmExit) {
            event.preventDefault();
        }
    });
}

// ==========================================
// 6. QUIZ RESULT PAGE
// ==========================================

const marksScore = document.getElementById("marksScore");
const resultDescription = document.getElementById("resultDescription");
const scorePercentage = document.getElementById("scorePercentage");
const correctAnswers = document.getElementById("correctAnswers");
const incorrectAnswers = document.getElementById("incorrectAnswers");
const totalQuestions = document.getElementById("totalQuestions");
const resultHeading = document.getElementById("resultHeading");
const resultMessage = document.getElementById("resultMessage");

if (scorePercentage && correctAnswers && incorrectAnswers && totalQuestions) {

    const score = Number(sessionStorage.getItem("quizScore"));
    const total = Number(sessionStorage.getItem("totalQuestions"));
    const completedQuizTitle = sessionStorage.getItem("completedQuizTitle");

    if(resultDescription && completedQuizTitle) {
        resultDescription.textContent =  `You've completed ${completedQuizTitle}. Here's how you performed.`;
    }

    const earnedMarks = Number(sessionStorage.getItem("earnedMarks"));
    const totalMarks = Number(sessionStorage.getItem("totalMarks"));

    if (
        sessionStorage.getItem("quizScore") === null ||
        sessionStorage.getItem("totalQuestions") === null ||
        total <= 0
    ) {
        resultHeading.textContent = "No results found.";
        resultMessage.textContent = "Please attempt a quiz first.";
    } else {

        const percentage = totalMarks > 0
            ? Math.round((earnedMarks / totalMarks) * 100)
            : 0;
        const incorrect = total - score;

        marksScore.textContent = `${earnedMarks} / ${totalMarks} marks`;

        scorePercentage.textContent = `${percentage}%`;
        correctAnswers.textContent = score;
        incorrectAnswers.textContent = incorrect;
        totalQuestions.textContent = total;

        if (percentage >= 80) {
            resultHeading.textContent = "Excellent work!";
            resultMessage.textContent = "Outstanding performance. Keep it up!";
        } else if (percentage >= 60) {
            resultHeading.textContent = "Well done!";
            resultMessage.textContent = "You're doing great. Keep improving!";
        } else if (percentage >= 40) {
            resultHeading.textContent = "Good effort!";
            resultMessage.textContent = "A little more practice will take you further.";
        } else {
            resultHeading.textContent = "Keep learning!";
            resultMessage.textContent = "Every attempt is a chance to improve.";
        }
    }
}



/* ================================
   ADMIN QUIZ MANAGEMENT - JAVA API
================================ */

(() => {
    const API_URL = "http://localhost:8080/api/quizzes";

    const modal = document.getElementById("createQuizModal");
    const createBtn = document.getElementById("createQuizBtn");
    const closeBtn = document.getElementById("closeQuizModal");
    const cancelBtn = document.getElementById("cancelQuizModal");
    const quizForm = document.getElementById("createQuizForm");
    const quizList = document.getElementById("adminQuizList");
    const quizSearch = document.getElementById("adminQuizSearch");
    const quizCount = document.getElementById("adminQuizCount");

    if (!modal || !quizForm || !quizList) return;

    let adminQuizzes = [];

    function openModal() {
        modal.classList.add("active");
    }

    function closeModal() {
        modal.classList.remove("active");
        quizForm.reset();
        delete quizForm.dataset.editingId;
    }

    function escapeHTML(value) {
        return String(value).replace(/[&<>"']/g, character => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"
        })[character]);
    }

    async function loadQuizzes() {
        try {
            const response = await fetch(API_URL);

            if (!response.ok) {
                throw new Error("Failed to load quizzes.");
            }

            adminQuizzes = await response.json();
            renderQuizzes(quizSearch?.value || "");

        } catch (error) {
            console.error("Quiz loading error:", error);
            quizList.innerHTML = `
                <div class="admin-empty-state">
                    <h3>Unable to load quizzes</h3>
                    <p>Check whether the Java backend is running.</p>
                </div>
            `;
        }
    }

    function renderQuizzes(searchTerm = "") {
        const filteredQuizzes = adminQuizzes.filter(quiz =>
            quiz.title.toLowerCase().includes(searchTerm.toLowerCase())
        );

        quizCount.textContent =
            `${filteredQuizzes.length} ${filteredQuizzes.length === 1 ? "quiz" : "quizzes"}`;

        if (filteredQuizzes.length === 0) {
            quizList.innerHTML = `
                <div class="admin-empty-state">
                    <h3>${adminQuizzes.length === 0
                        ? "No quizzes created yet"
                        : "No matching quizzes found"}</h3>

                    <p>${adminQuizzes.length === 0
                        ? "Start building your quiz library by creating your first quiz."
                        : "Try searching with a different quiz title."}</p>

                    ${adminQuizzes.length === 0
                        ? '<button class="admin-primary-button" id="emptyCreateQuizBtn">Create your first quiz</button>'
                        : ""}
                </div>
            `;
            return;
        }

        quizList.innerHTML = filteredQuizzes.map(quiz => `
            <div class="admin-quiz-card">
                <div class="admin-quiz-info">
                    <h3>${escapeHTML(quiz.title)}</h3>
                    <p>${escapeHTML(quiz.description || "")}</p>

                    <div class="admin-quiz-meta">
                        <span>${escapeHTML(quiz.category || "")}</span>
                        <span>${escapeHTML(quiz.difficulty || "")}</span>
                        <span>${quiz.duration} minutes</span>
                    </div>
                </div>

                <div class="admin-quiz-actions">
                    <button class="quiz-edit-btn" data-id="${quiz.id}">
                        Edit
                    </button>

                    <button class="quiz-delete-btn" data-id="${quiz.id}">
                        Delete
                    </button>
                </div>
            </div>
        `).join("");
    }

    // CREATE QUIZ MODAL
    createBtn?.addEventListener("click", openModal);

    closeBtn?.addEventListener("click", closeModal);
    cancelBtn?.addEventListener("click", closeModal);

    modal.addEventListener("click", event => {
        if (event.target === modal) {
            closeModal();
        }
    });

    // HANDLE CREATE BUTTON AND EDIT / DELETE
    quizList.addEventListener("click", async event => {
        if (event.target.closest("#emptyCreateQuizBtn")) {
            openModal();
            return;
        }

        const editBtn = event.target.closest(".quiz-edit-btn");
        const deleteBtn = event.target.closest(".quiz-delete-btn");

        if (editBtn) {
            const quizId = Number(editBtn.dataset.id);
            const quiz = adminQuizzes.find(q => q.id === quizId);

            if (!quiz) return;

            document.getElementById("quizTitle").value = quiz.title;
            document.getElementById("quizDescription").value = quiz.description || "";
            document.getElementById("quizCategory").value = quiz.category;
            document.getElementById("quizDifficulty").value = quiz.difficulty;
            document.getElementById("quizDuration").value = quiz.duration;

            quizForm.dataset.editingId = quizId;
            openModal();
        }

        if (deleteBtn) {
            const quizId = Number(deleteBtn.dataset.id);

            if (!confirm("Are you sure you want to delete this quiz?")) {
                return;
            }

            try {
                const response = await fetch(`${API_URL}/${quizId}`, {
                    method: "DELETE"
                });

                if (!response.ok) {
                    throw new Error("Quiz deletion failed.");
                }

                alert("Quiz deleted successfully!");
                await loadQuizzes();

            } catch (error) {
                console.error("Quiz deletion error:", error);
                alert("Unable to delete quiz. Please try again.");
            }
        }
    });

    // CREATE OR UPDATE QUIZ
    quizForm.addEventListener("submit", async event => {
        event.preventDefault();

        const editingId = quizForm.dataset.editingId;

        const newQuiz = {
            id: editingId ? Number(editingId) : Date.now(),
            title: document.getElementById("quizTitle").value.trim(),
            description: document.getElementById("quizDescription").value.trim(),
            category: document.getElementById("quizCategory").value,
            difficulty: document.getElementById("quizDifficulty").value,
            duration: Number(document.getElementById("quizDuration").value)
        };

        try {
            const response = await fetch(
                editingId ? `${API_URL}/${editingId}` : API_URL,
                {
                    method: editingId ? "PUT" : "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(newQuiz)
                }
            );

            if (!response.ok) {
                throw new Error("Quiz could not be saved.");
            }

            alert(editingId
                ? "Quiz updated successfully!"
                : "Quiz created successfully!");

            closeModal();
            await loadQuizzes();

        } catch (error) {
            console.error("Quiz saving error:", error);
            alert("Unable to save quiz. Please check the Java backend.");
        }
    });

    // SEARCH QUIZZES
    quizSearch?.addEventListener("input", () => {
        renderQuizzes(quizSearch.value);
    });

    // INITIAL LOAD FROM DATABASE
    loadQuizzes();

})();



/* ================================
   ADMIN QUESTION MANAGEMENT - JAVA API
================================ */

(() => {
    const API_URL = "http://localhost:8080/api/questions";
    const QUIZ_API = "http://localhost:8080/api/quizzes";

    const modal = document.getElementById("createQuestionModal");
    const createBtn = document.getElementById("createQuestionBtn");
    const closeBtn = document.getElementById("closeQuestionModal");
    const cancelBtn = document.getElementById("cancelQuestionModal");

    const questionForm = document.getElementById("createQuestionForm");
    const questionList = document.getElementById("adminQuestionList");
    const questionCount = document.getElementById("adminQuestionCount");
    const quizSelect = document.getElementById("questionQuiz");

    if (!modal || !questionForm || !questionList) return;

    let adminQuizzes = [];
    let adminQuestions = [];

    function escapeHTML(value) {
        return String(value ?? "").replace(/[&<>"']/g, character => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"
        })[character]);
    }

    async function loadData() {
        try {
            const [quizResponse, questionResponse] = await Promise.all([
                fetch(QUIZ_API),
                fetch(API_URL)
            ]);

            if (!quizResponse.ok || !questionResponse.ok) {
                throw new Error("Unable to load data.");
            }

            adminQuizzes = await quizResponse.json();
            adminQuestions = await questionResponse.json();

            renderQuestions();

        } catch (error) {
            console.error("Question loading error:", error);
            questionList.innerHTML = `
                <div class="admin-empty-state">
                    <h3>Unable to load questions</h3>
                    <p>Check whether the Java backend is running.</p>
                </div>
            `;
        }
    }

    function loadQuizOptions() {
        quizSelect.innerHTML = `
            <option value="">Choose a quiz</option>
            ${adminQuizzes.map(quiz => `
                <option value="${quiz.id}">
                    ${escapeHTML(quiz.title)}
                </option>
            `).join("")}
        `;
    }

    function openModal() {
        loadQuizOptions();
        modal.classList.add("active");
    }

    function closeModal() {
        modal.classList.remove("active");
        questionForm.reset();
        delete questionForm.dataset.editingId;

        document.getElementById("questionModalTitle").textContent = "Create Question";
        document.getElementById("saveQuestionBtn").textContent = "Save Question";
    }

    function renderQuestions() {
        questionCount.textContent =
            `${adminQuestions.length} ${adminQuestions.length === 1 ? "question" : "questions"}`;

        if (adminQuestions.length === 0) {
            questionList.innerHTML = `
                <div class="admin-empty-state">
                    <h3>No questions added yet</h3>
                    <p>Start building your quiz by adding your first question.</p>
                    <button class="admin-primary-button" id="emptyCreateQuestionBtn">
                        Add your first question
                    </button>
                </div>
            `;
            return;
        }

        questionList.innerHTML = adminQuestions.map(question => {
            const quiz = adminQuizzes.find(
                quiz => quiz.id === question.quizId
            );

            const options = [
                question.optionA,
                question.optionB,
                question.optionC,
                question.optionD
            ];

            return `
                <div class="admin-quiz-card">
                    <div class="admin-quiz-info">
                        <span class="section-label">
                            ${escapeHTML(quiz ? quiz.title : "Quiz unavailable")}
                        </span>

                        <h3>${escapeHTML(question.questionText)}</h3>

                        <p>
                            Correct answer:
                            ${escapeHTML(options[question.correctAnswer])}
                        </p>

                        <div class="admin-quiz-meta">
                            <span>${question.marks} marks</span>
                            <span>4 options</span>
                        </div>
                    </div>

                    <div class="admin-quiz-actions">
                        <button class="quiz-edit-btn" data-id="${question.id}">
                            Edit
                        </button>

                        <button class="quiz-delete-btn" data-id="${question.id}">
                            Delete
                        </button>
                    </div>
                </div>
            `;
        }).join("");
    }

    // OPEN AND CLOSE MODAL
    createBtn?.addEventListener("click", openModal);
    closeBtn?.addEventListener("click", closeModal);
    cancelBtn?.addEventListener("click", closeModal);

    modal.addEventListener("click", event => {
        if (event.target === modal) closeModal();
    });

    questionList.addEventListener("click", async event => {
        if (event.target.closest("#emptyCreateQuestionBtn")) {
            openModal();
            return;
        }

        const editBtn = event.target.closest(".quiz-edit-btn");
        const deleteBtn = event.target.closest(".quiz-delete-btn");

        // EDIT QUESTION
        if (editBtn) {
            const questionId = Number(editBtn.dataset.id);

            const question = adminQuestions.find(
                q => q.id === questionId
            );

            if (!question) return;

            openModal();

            quizSelect.value = question.quizId;
            document.getElementById("questionText").value = question.questionText;
            document.getElementById("optionA").value = question.optionA;
            document.getElementById("optionB").value = question.optionB;
            document.getElementById("optionC").value = question.optionC;
            document.getElementById("optionD").value = question.optionD;
            document.getElementById("correctAnswer").value = question.correctAnswer;
            document.getElementById("questionMarks").value = question.marks;

            questionForm.dataset.editingId = questionId;

            document.getElementById("questionModalTitle").textContent = "Edit Question";
            document.getElementById("saveQuestionBtn").textContent = "Update Question";
        }

        // DELETE QUESTION
        if (deleteBtn) {
            const questionId = Number(deleteBtn.dataset.id);

            if (!confirm("Are you sure you want to delete this question?")) {
                return;
            }

            try {
                const response = await fetch(`${API_URL}/${questionId}`, {
                    method: "DELETE"
                });

                if (!response.ok) {
                    throw new Error("Question deletion failed.");
                }

                alert("Question deleted successfully!");
                await loadData();

            } catch (error) {
                console.error("Question deletion error:", error);
                alert("Unable to delete question.");
            }
        }
    });

    // CREATE OR UPDATE QUESTION
    questionForm.addEventListener("submit", async event => {
        event.preventDefault();

        const editingId = questionForm.dataset.editingId;

        const question = {
            id: editingId ? Number(editingId) : Date.now(),
            quizId: Number(quizSelect.value),
            questionText: document.getElementById("questionText").value.trim(),
            optionA: document.getElementById("optionA").value.trim(),
            optionB: document.getElementById("optionB").value.trim(),
            optionC: document.getElementById("optionC").value.trim(),
            optionD: document.getElementById("optionD").value.trim(),
            correctAnswer: Number(document.getElementById("correctAnswer").value),
            marks: Number(document.getElementById("questionMarks").value)
        };

        try {
            const response = await fetch(
                editingId ? `${API_URL}/${editingId}` : API_URL,
                {
                    method: editingId ? "PUT" : "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(question)
                }
            );

            if (!response.ok) {
                throw new Error("Question could not be saved.");
            }

            alert(editingId
                ? "Question updated successfully!"
                : "Question created successfully!");

            closeModal();
            await loadData();

        } catch (error) {
            console.error("Question saving error:", error);
            alert("Unable to save question. Please try again.");
        }
    });

    // INITIAL LOAD
    loadData();

})();



/* ================================
   STUDENT QUIZ LIBRARY - JAVA API
================================ */

(() => {
    const quizList = document.getElementById("studentQuizList");

    if (!quizList) return;

    const QUIZ_API = "http://localhost:8080/api/quizzes";
    const QUESTION_API = "http://localhost:8080/api/questions";

    function escapeHTML(value) {
        return String(value ?? "").replace(/[&<>"']/g, character => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"
        })[character]);
    }

    async function loadStudentQuizzes() {
        try {
            const [quizResponse, questionResponse] = await Promise.all([
                fetch(QUIZ_API),
                fetch(QUESTION_API)
            ]);

            if (!quizResponse.ok || !questionResponse.ok) {
                throw new Error("Unable to load quiz data.");
            }

            const quizzes = await quizResponse.json();
            const questions = await questionResponse.json();

            if (quizzes.length === 0) {
                quizList.innerHTML = `
                    <div class="empty-state">
                        <h3>No quizzes available yet</h3>
                        <p>New challenges will appear here when quizzes are created.</p>
                    </div>
                `;
                return;
            }

            quizList.innerHTML = quizzes.map(quiz => {
                const questionCount = questions.filter(
                    question => String(question.quizId) === String(quiz.id)
                ).length;

                return `
                    <article class="quiz-item"
                        data-category="${escapeHTML((quiz.category || "").toLowerCase())}">

                        <div>
                            <span class="quiz-category">
                                ${escapeHTML((quiz.category || "").toUpperCase())}
                            </span>

                            <h2>${escapeHTML(quiz.title)}</h2>

                            <p>${escapeHTML(quiz.description)}</p>
                        </div>

                        <div class="quiz-meta">
                            <span>${questionCount} questions</span>
                            <span>${quiz.duration} minutes</span>

                            <a href="quiz.html?quizId=${quiz.id}"
                                class="btn btn-primary">
                                Start quiz →
                            </a>
                        </div>

                    </article>
                `;
            }).join("");

        } catch (error) {
            console.error("Student quiz loading error:", error);

            quizList.innerHTML = `
                <div class="empty-state">
                    <h3>Unable to load quizzes</h3>
                    <p>Please check whether the Java backend is running.</p>
                </div>
            `;
        }
    }

    loadStudentQuizzes();
})();
