const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const transactionSchema = new Schema({
    orderId: { type: Schema.Types.ObjectId, ref: 'Order', required: true },
    paymentId: { type: String, required: true }, // Razorpay payment ID
    amount: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    status: { type: String, default: 'success' }, // Payment status (success/failure)
},{timestamps:true});

const Transaction = mongoose.model('Transaction', transactionSchema);

module.exports = Transaction;
