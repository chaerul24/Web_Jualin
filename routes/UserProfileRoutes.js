const express = require('express');
const UserProfileController = require('../controllers/UserProfileController');

class UserProfileRoutes {
    constructor() {
        this.router = express.Router();
        this.controller = new UserProfileController();

        this.initializeRoutes();
    }

    initializeRoutes() {

        // 🔥 GET profile by user_id
        this.router.get('/:id', (req, res) =>
            this.controller.getProfile(req, res)
        );

        // 🔥 CREATE / UPDATE profile
        this.router.post('/', (req, res) =>
            this.controller.saveProfile(req, res)
        );

        // 🔥 UPDATE profile
        this.router.put('/:id', (req, res) =>
            this.controller.updateProfile(req, res)
        );

        // 🔥 DELETE profile
        this.router.delete('/:id', (req, res) =>
            this.controller.deleteProfile(req, res)
        );
    }
}

module.exports = new UserProfileRoutes().router;