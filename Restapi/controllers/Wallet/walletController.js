const addBalance=async(req,res)=>{
    try{

    }catch (error) {
        res.status(500).json({ message: error.message + ' Internal Server Error' });
    }
}
const showTransactions=async(req,res)=>{
    try{

    }catch (error) {
        res.status(500).json({ message: error.message + ' Internal Server Error' });
    }
}
module.exports={
    addBalance,
    showTransactions
}