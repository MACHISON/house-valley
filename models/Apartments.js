const mongoose = require('mongoose');
const geocoder = require('../scripts/geocoder')

const ApartmentSchema = new mongoose.Schema({
    apartmentID: {
        type: String,
        required: [true, 'Please add apartment ID'],
        unique: true,
        trim: true,
        maxlength: [10, 'Insert ID less then 10 characters']

    },

    address: {
        type: String,
        required: [true, 'Please add an address']
    },

    location: {
        type: {
            type: String, // Don't do `{ location: { type: String } }`
            enum: ['Point'], // 'location.type' must be 'Point'
        },
        coordinates: {
            type: [Number],
            index: '2dsphere',
            //required: true
        },

        formattedAddress: String,
    },

    createdAt: {
        type: Date,
        default: Date.now
    },

    price: {
        currency: {
            type: String,
            default: "EUR",

        },

        value: {
            type: Number,
            default: 0,
            minimum: 0,
            maximum: 99999,
            required: true
        },
    }


    /*
    region: {
        type: String,
        required: true
    },

    },
    offert: {
        type: String,
        required: true
    },

    rooms: {
        type: Number,
        required: true
    },
    utilities: {
        type: Array,
        required: false
    }
    */
});

//Geocoder and create location
ApartmentSchema.pre('save', async function (next) {
    const loc = await geocoder.geocode(this.address);
    this.location = {
        type: 'Point',
        coordinates: [loc[0].longitude, loc[0].latitude],
        formattedAddress: loc[0].formattedAddress
    }
})

module.exports = mongoose.model('Apartment', ApartmentSchema);