const user = require("../../models/auth/userSchema");
const order = require("../../models/Order/orderSc");
const orderCountById=async(userId)=>{
  try {
    const orderDetails = await order.find({ userId: userId });
    return orderDetails.length;
  } catch (error) {
    return ({ message: error.message + " Internal Server Error" });
  }
}
const getAllUser = async (req, res) => {
  try {
    const allUser = await user.find({ is_Active: true });
    
    let userWithDetails = await Promise.all(
      allUser.map(async (element) => {
        const userId = element._id;
        try {
          const orderCount = await orderCountById(userId);
          return {
            ...element._doc,
            orderCount: orderCount,
          };
        } catch (error) {
          console.error(`Error fetching details for userId ${userId}:`, error);
          return {
            ...element._doc,
            orderCount:0
          };
        }
      })
    );
    const { query } = req.query;

    if (query) {
      const regexQuery = new RegExp(query.split("").join(".*"), "i");

      userWithDetails = userWithDetails.filter((element) => {
        return regexQuery.test(element.name);
      });

      if (userWithDetails.length === 0) {
        return res.status(404).json({ message: "No matching entities found." });
      }
    }
    return res.status(200).json({ userWithDetails: userWithDetails });
  } catch (error) {
    return res
      .status(500)
      .json({ message: error.message + " Internal Server Error" });
  }
};
const blockingCustomer = async (req, res) => {
  try {
    const userDetails = await user.findById(req.params.userId);
    if (!userDetails) {
      return res.status(500).json({ message: "No customer" });
    }
    userDetails.blocking = req.body.blockStatus;
    await userDetails.save();
    return res.status(200).json({ message: "Blocked successfully" });
  } catch (error) {
    return res
      .status(500)
      .json({ message: error.message + " Internal Server Error" });
  }
};
const deleteCustomer = async (req, res) => {
  try {
    const userDetails = await user.findByIdAndUpdate(
      { _id: req.params.userId },
      {
        is_Active: false,
      }
    );
    if (!userDetails) {
      return res.status(500).json({ message: "No customer" });
    }

    return res.status(200).json({ message: "Deleted successfully" });
  } catch (error) {
    return res
      .status(500)
      .json({ message: error.message + " Internal Server Error" });
  }
};
const getCustomerDetailsById = async (req, res) => {
  try {
    const userDetails = await user.findById(req.params.userId);
    if (!userDetails) {
      return res.status(500).json({ message: "No customer" });
    }

    return res.status(200).json({ userDetails: userDetails });
  } catch (error) {
    return res
      .status(500)
      .json({ message: error.message + " Internal Server Error" });
  }
};
const makeUtsabMember = async (req, res) => {
  try {
    const userDetails = await user.findById(req.params.userId);
    if (!userDetails) {
      return res.status(500).json({ message: "No customer" });
    }
    userDetails.is_utsav = req.body.utsavStatus;
    await userDetails.save();
    return res.status(200).json({ userDetails: userDetails });
  } catch (error) {
    return res
      .status(500)
      .json({ message: error.message + " Internal Server Error" });
  }
};
const customerOrderDetails = async (req, res) => {
  try {
    const orderDetails = await order
      .find({
        userId: req.params.userId,
      })
      .populate({
        path: "orderItem.productId",
        model: "Variant",
        populate: {
          path: "productGroup",
          model: "Product",
        },
      });
    if (!orderDetails) {
      return res.status(500).json({ message: "No customer" });
    }

    return res.status(200).json({ orderDetails: orderDetails });
  } catch (error) {
    return res
      .status(500)
      .json({ message: error.message + " Internal Server Error" });
  }
};
module.exports = {
  getAllUser,
  blockingCustomer,
  deleteCustomer,
  getCustomerDetailsById,
  makeUtsabMember,
  customerOrderDetails,
};
