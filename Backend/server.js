const express = require("express");
const cors = require("cors");
require("dotenv").config();
const bcrypt = require("bcryptjs");
const pool = require("./db");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

//User Registration API
app.post("/api/register", async (req, res) => {
    try {
        const { name, email, password } = req.body;
        console.log("Registration request received:", name, email);

        if (!name || !email || !password) {
            return res.status(400).json({
                message: "All fields are required."
            });
        }
        if (password.length < 8) {
            return res.status(400).json({
                message: "Password must be at least 8 characters."
            });
        }
        const hashedPassword = await bcrypt.hash(password, 10);

        const result = await pool.query(
            `INSERT INTO users (name, email, password_hash)
            VALUES ($1, $2, $3)
            RETURNING id, name, email, role`,
            [name.trim(), email.trim().toLowerCase(), hashedPassword]
        );
        res.status(201).json({
            message: "Registration successful!",
            user: result.rows[0]
        });
    } catch (error) {
        if (error.code === "23505") {
            return res.status(409).json({
                message: "This email is already registered."
            });
        }
        console.error("REGISTRATION ERROR:", error);

        res.status(500).json({  
            message: "Registration failed.",
            error: error.message,
            code: error.code    
    });
    }
});


// User Login API
app.post("/api/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: "Email and password are required."
            });
        }

        const result = await pool.query(
            "SELECT * FROM users WHERE email = $1",
            [email.trim().toLowerCase()]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({
                message: "Invalid email or password."
            });
        }

        const user = result.rows[0];

        const passwordMatch = await bcrypt.compare(
            password,
            user.password_hash
        );

        if (!passwordMatch) {
            return res.status(401).json({
                message: "Invalid email or password."
            });
        }

        res.json({
            message: "Login successful!",
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        console.error("LOGIN ERROR:", error);

        res.status(500).json({
            message: "Login failed."
        });
    }
});


// Test route
app.get("/", (req, res) => {
    res.json({
        message: "QuizVerse API is running!"
    });
});

//Test databse connection
app.get("/api/db-test", async(req, res) => {
    try {
        const result = await pool.query("SELECT NOW()");

        res.json({
            message: "QuizVerse database connected successfully!",
            time: result.rows[0].now
        });
    
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Database connection failed"
        });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`QuizVerse server running on port ${PORT}`);
});

