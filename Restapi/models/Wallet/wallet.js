const mongoose=require('mongoose')
const walletSchema=new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true
    },
    balance: {
        type: Number,
        default: 0
    },
    transactions:[{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'WalletTransaction',
        required: true
    }]

},{timestamps:true})
const Wallet = mongoose.model('Wallet', walletSchema);

module.exports = Wallet; 
