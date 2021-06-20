const Apartment = require('../models/Apartments');


// @desc Get all apartments
// @route GET /api/v1/stores
// @access Public
exports.getApartments = async(req, res, next) =>{
    try {
        const apartments = await Apartment.find();

        return res.status(200).json({
            success: true,
            count: apartments.length,
            data: apartments
        })
    } catch (error) {
        console.error(error);
        res.status(500).json({error: 'Server error'})
    }
}

// @desc Create an apartment
// @route POST /api/v1/stores
// @access Public
exports.addApartments = async(req, res, next) =>{
    try {
        const apartment = await Apartment.create(req.body);

        return res.status(200).json({
            success: true,
            data: apartment
        });
    } catch (error) {
        console.error(error);
        if (error.code == 11000){
            return res.status(400).json({error: 'This apartment already exist'})
        }
        res.status(500).json({error: 'Server error'})
    }
}