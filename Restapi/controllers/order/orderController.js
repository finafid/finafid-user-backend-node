const order=require('../../models/Order/orderSc')
const orderItems=require('../../models/Order/orderItem')


const placeOrder=async (req,res)=>{
try{
    const orderItemList=Promise.all(req.body.orderItems.map(async orderItem=>{
        const newOrderItem=new orderItems({
            quantity:orderItem.quantity,
            product:orderItem.product
        })
        newOrderItem=await orderItem.save()    ; 
        return newOrderItem._id;
    }))
    const orderItemIds=await orderItemList;
    const totalPrices=await promise.all(orderItemIds.map(async orderItemId=>{
        const orderItem=await orderItems.findById(orderItemId).populate('product','price');
        const totalPrice=orderItem.product.price*orderItem.quantity;
        return totalPrice;
    }))
    const totalPrice=totalPrices.reduce((a,b)=>a+b,0)
    const newOrder=new order({
        orderItem:orderItemIds,
        locality:req.body.locality,
        city:req.body.city,
        street:req.body.street,
        state:req.body.state,
        houseNumber:req.body.houseNumber,
        country:req.body.country,
        status:req.body.status,
        totalPrice:totalPrice
    }) 
    await newOrder.save();
    return res.status(201).json({
        message:success,
        success:false
    })
    
}catch (error) {
    return res.status(500).json({
        success: false,
        message: 'error', err
    });
}
}

const getOrderDetails=async(req,res)=>{
    try{
        const orderDetail=await order.find({
            user:req.user,
        }).populate('user','name')

        if(!orderDetail){
            return res.status(500).json({
                success:false,
                message:'No order till now'
            })
        }
        res.send(orderDetail)
    }catch(error){
        return res.status(500).json({
            success: false,
            message: 'error', err
        });
    }
}
const getOrderById=async(req,res)=>{
    try{
        const orderDetail=await order.findById({
            _id:req.param._id,
        }).populate('user','name')

        if(!orderDetail){
            return res.status(500).json({
                success:false,
                message:'No order till now'
            })
        }
        res.send(orderDetail)
    }catch(error){
        return res.status(500).json({
            success: false,
            message: 'error', err
        });
    }
}
const updateStatus=async(req,res)=>{
    try{
        const orderDetail=await order.findByIdAndUpdate({
            _id:req.param._id,
        },{
            status:req.body.status
        }).populate('user','name')

        if(!orderDetail){
            return res.status(500).json({
                success:false,
                message:'No order till now'
            })
        }
        res.send(orderDetail)
    }catch(error){
        return res.status(500).json({
            success: false,
            message: 'error', err
        });
    }
}

module.exports={
    placeOrder,
    getOrderDetails,
    updateStatus,
    getOrderDetails
}