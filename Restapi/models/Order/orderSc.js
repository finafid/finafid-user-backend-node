const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    orderItem: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'OrderItem',
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId, // Corrected type definition
        ref: 'User',
        required: true
    },
    locality: {
        type: String, // Corrected type definition (String should be capitalized)
        required: true
    },
    city: {
        type: String,
        required: true
    },
    street: {
        type: String,
        required: true
    },
    houseNumber: {
        type: String,
        required: true,
        validate: {
            validator: function(value) {
                return /^[a-zA-Z0-9]+$/.test(value);
            },
            message: 'House number must be alphanumeric'
        }
    },
    state: {
        type: String,
        required: true
    },
    country: {
        type: String,
        required: true
    },
    totalPrice: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        required: true
    }
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
