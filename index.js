
const express = require('express');
const mysql = require('mysql');
const app = express();
const port = 5500;
const pool = mysql.createPool({
    connectionLimit: 10,
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'userdb',
});
app.use(express.json());
pool.getConnection((err) => {
    if (err) {
        console.error("error connecting to MySQL:", err);
    } else {
        console.log("connected to MySQL!");
    }
});

app.get('/checking', (req, res) => {
    res.status(200).send("welcome");
});

app.post('/api/signup', (req, res) => {
    const { firstname, lastname, email, password, password2 } = req.body;

    if (password !== password2) {
        return res.status(400).json({ message: "Password  not match" });
    }

    pool.getConnection((err, connection) => {
        if (err) {
            console.error("error in MySQL connection:", err);
            return res.status(500).json({ success: false });
        }

        connection.query("SELECT * FROM users WHERE email = ?", [email], (error, results) => {
            if (error) {
                console.error("error executing MySQL query:", error);
                connection.release();
                return res.status(500).json({ success: false });
            }

            if (results.length > 0) {
                connection.release();
                return res.status(400).json({ auth: false, message: "email is already" });
            }
            const newUser = {
                firstname,
                lastname,
                email,
                password,

            };
            connection.query("INSERT INTO users SET ?", newUser, (err, result) => {
                connection.release();

                if (err) {
                    console.error("Error executing MySQL query:", err);
                    return res.status(400).json({ success: false });
                }
                res.status(200).json({
                    success: true,
                    user: newUser
                });
            });
        });
    });
});
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;

    pool.getConnection((err, connection) => {
        if (err) {
            console.error("error getting MySQL connection:", err);
            return res.status(500).json({ success: false });
        }

        connection.query("SELECT * FROM users WHERE email = ?", [email], (error, results) => {
            if (error) {
                console.error("Error executing MySQL query:", error);
                connection.release();
                return res.status(500).json({ success: false });
            }

            if (results.length === 0) 
            {
                connection.release();
                return res.status(400).json({ auth: false, message: "Email not found" });
            }

            const user = results[0];
            if (user.password !== password) 
            {
                connection.release();
                return res.status(400).json({ auth: false, message: "Invalid password" });
            }
            connection.release();
            res.status(200).json({
                auth: true,
                message: "Login successful",
                user: {
                    id: user.id,
                    email: user.email,
                }
            });
        });
    });
});
app.listen(port, () => {
    console.log("Server is running on port ${port}");
});
