\# QuizVerse 🎯



\*\*QuizVerse\*\* is an online quiz application built to make learning and testing knowledge interactive. It provides separate experiences for students and administrators, including quiz management, timed attempts, score tracking, and a leaderboard.



\## ✨ Features



\### Student

\- Register and log in

\- Browse available quizzes

\- Attempt quizzes with a timer

\- View scores and quiz results

\- Track performance through a dashboard

\- View the student leaderboard



\### Admin

\- Admin dashboard with platform statistics

\- Create, update, and delete quizzes

\- Manage quiz questions

\- View students and quiz activity



\## 🛠️ Tech Stack



| Layer | Technologies |

|---|---|

| Frontend | HTML, CSS, JavaScript |

| Backend | Java, Spring Boot |

| Database | PostgreSQL |

| Data Access | Spring Data JPA |

| Password Hashing | BCrypt |

| Version Control | Git \& GitHub |

| Frontend Hosting | Vercel |



\## 📁 Project Structure



```text

QuizVerse/

├── Backend/          # Earlier Node.js backend

├── Frontend/         # HTML, CSS and JavaScript

├── JavaBackend/

│   └── quizverse/    # Spring Boot backend

└── README.md

```



\## 🚀 Running Locally



\### 1. Clone the repository



```bash

git clone https://github.com/Noor-Afsha7/QuizVerse.git

cd QuizVerse

```



\### 2. Configure PostgreSQL



Create a PostgreSQL database named `quizverse` and configure these environment variables for the Java backend:



\- `DB\_URL`

\- `DB\_USERNAME`

\- `DB\_PASSWORD`



Never commit database passwords or other secrets to GitHub.



\### 3. Start the Java backend



Navigate to the Spring Boot project:



```bash

cd JavaBackend/quizverse

```



Run the application on Windows:



```cmd

mvnw.cmd spring-boot:run

```



The backend runs on port `8080` by default.



\### 4. Run the frontend



Open the `Frontend` folder in VS Code and launch `index.html` using Live Server.



\## 🔗 Repository



\[GitHub – QuizVerse](https://github.com/Noor-Afsha7/QuizVerse)



\---



\*QuizVerse — Learn. Attempt. Improve.\*

