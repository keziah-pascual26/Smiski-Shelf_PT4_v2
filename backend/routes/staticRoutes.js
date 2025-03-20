const express = require('express');
const path = require('path');

module.exports = (app) => {
    // Serve static files from the /pages directory
    app.use("/pages", express.static(path.join(__dirname, "../../frontend/pages"), {
        setHeaders: (res, path) => {
            if (path.endsWith(".css")) {
                res.setHeader("Content-Type", "text/css");
            }
        }
    }));

    // Serve static files from the /uploads directory
    app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

    // Serve static files from the /public directory
    app.use(express.static(path.join(__dirname, '../../frontend/public')));

    // Serve register page
    app.get('/', (req, res) => {
        res.sendFile(path.join(__dirname, '../../frontend/pages/register/register.html'));
    });

    // Serve login page
    app.get('/login', (req, res) => {
        res.sendFile(path.join(__dirname, '../../frontend/pages/login/login.html'));
    });
};