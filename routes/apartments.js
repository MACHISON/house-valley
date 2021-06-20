const express = require('express');
const router = express.Router();
const {getApartments, addApartments} = require('../controllers/apartments');

//Get request from controller
router.route('/').get(getApartments).post(addApartments);

module.exports = router;