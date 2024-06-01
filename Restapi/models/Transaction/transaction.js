const mongoose=require('mongoose')
const transactionSchema=new mongoose.Schema({
    type: {
        type: String,
        enum: ['credit', 'debit'],
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    },
    description: {
        type: String
    }
},{timestamps:true})
const Transaction=mongoose.model('Transaction', transactionSchema);
module.exports=Transaction