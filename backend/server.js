const express = require("express");
const mysql = require("mysql2/promise");
const cors = require("cors");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    waitForConnections: true,
    connectionLimit: 10
});

/*
    Health Check
*/
app.get("/health", async (req, res) => {
    try {
        await pool.query("SELECT 1");

        res.json({
            status: "OK",
            database: "Connected"
        });
    } catch (error) {
        res.status(500).json({
            status: "ERROR",
            database: "Disconnected"
        });
    }
});

/*
    Get all applications
*/
app.get("/api/applications", async (req, res) => {
    try {
        const [rows] = await pool.query(
            "SELECT * FROM applications ORDER BY application_date DESC"
        );

        res.json(rows);
    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Failed to fetch applications"
        });
    }
});

/*
    Get one application
*/
app.get("/api/applications/:id", async (req, res) => {
    try {
        const [rows] = await pool.query(
            "SELECT * FROM applications WHERE id = ?",
            [req.params.id]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                message: "Application not found"
            });
        }

        res.json(rows[0]);
    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Failed to fetch application"
        });
    }
});

/*
    Create application
*/
app.post("/api/applications", async (req, res) => {
    try {
        const {
            company,
            position,
            location,
            status,
            application_date,
            notes
        } = req.body;

        if (!company || !position || !application_date) {
            return res.status(400).json({
                message: "Company, position and application date are required"
            });
        }

        const [result] = await pool.query(
            `INSERT INTO applications
            (company, position, location, status, application_date, notes)
            VALUES (?, ?, ?, ?, ?, ?)`,
            [
                company,
                position,
                location,
                status || "Applied",
                application_date,
                notes
            ]
        );

        res.status(201).json({
            message: "Application created",
            id: result.insertId
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Failed to create application"
        });
    }
});

/*
    Update application
*/
app.put("/api/applications/:id", async (req, res) => {
    try {
        const {
            company,
            position,
            location,
            status,
            application_date,
            notes
        } = req.body;

        const [result] = await pool.query(
            `UPDATE applications
             SET company = ?,
                 position = ?,
                 location = ?,
                 status = ?,
                 application_date = ?,
                 notes = ?
             WHERE id = ?`,
            [
                company,
                position,
                location,
                status,
                application_date,
                notes,
                req.params.id
            ]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Application not found"
            });
        }

        res.json({
            message: "Application updated"
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Failed to update application"
        });
    }
});

/*
    Delete application
*/
app.delete("/api/applications/:id", async (req, res) => {
    try {
        const [result] = await pool.query(
            "DELETE FROM applications WHERE id = ?",
            [req.params.id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Application not found"
            });
        }

        res.json({
            message: "Application deleted"
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Failed to delete application"
        });
    }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Backend server running on http://localhost:${PORT}`);
});
