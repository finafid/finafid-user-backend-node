const order=require('../../models/Order/orderSc')
const orderItems=require('../../models/Order/orderItem')
const user=require('../../models/auth/userSchema')

const placeOrder=async (req,res)=>{
try{
    console.log(req.body.orderItem)
    let orderItemList=Promise.all(req.body.orderItem.map(async orderItem=>{
        console.log(orderItem.quantity)
        const newOrderItem=new orderItems({
            quantity:orderItem.quantity,
            product:orderItem.product
        })
        console.log(newOrderItem)
        await newOrderItem.save()    ; 
        console.log(newOrderItem._id)
        return newOrderItem._id;
    }))
    const orderItemIds=await orderItemList;
    console.log(orderItemIds)
    const totalPrices = await Promise.all(orderItemIds.map(async (orderItemId) => {
        const orderItem = await orderItems.findById(orderItemId).populate('product', 'price');
        console.log(orderItem)
        if (!orderItem) {
            throw new Error(`OrderItem not found for ID: ${orderItemId}`);
        }
    
        const totalPrice = orderItem.product.price * orderItem.quantity;
        return totalPrice;
    }));
    console.log(totalPrices)
    const totalPrice=totalPrices.reduce((a,b)=>a+b,0)
    console.log(req.user._id)
    const newOrder=new order({
        orderItem:orderItemIds,
        user:req.user._id,
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
        message:"successfully created",
        success:true
    })
    
}catch (error) {
    return res.status(500).json({
        success: false,
        message: error.message +'Internal Server error'
    });
}
}

const getOrderDetails=async(req,res)=>{
    try{
        const orderDetail=await order.find({
            user:req.user._id,
        }).populate()

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
            message: error.message+'  Internal server Error'
        });
    }
}
const getOrderById=async(req,res)=>{
    try{
        const orderDetail=await order.findById({
            _id:req.params.orderId,
        }).populate('user')

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
            message: error.message+" Internal server error", 
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
    getOrderById,
    updateStatus,
    getOrderDetails
}