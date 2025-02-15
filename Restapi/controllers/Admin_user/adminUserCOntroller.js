const user = require("../../models/auth/userSchema");
const order = require("../../models/Order/orderSc");
const { sendMail } = require("../../utils/mailer");
const orderCountById = async (userId) => {
  try {
    const orderDetails = await order.find({ userId: userId });
    return orderDetails.length;
  } catch (error) {
    return { message: error.message + " Internal Server Error" };
  }
};
const getAllUser = async (req, res) => {
  try {
    const { query, page = 1, limit = 10 } = req.query;

    // Pagination settings
    const currentPage = Math.max(parseInt(page, 10), 1);
    const perPage = Math.max(parseInt(limit, 10), 1);
    const skip = (currentPage - 1) * perPage;

    // Fetch active users with pagination
    const allUsers = await user
      .find({ is_Active: true })
      .skip(skip)
      .limit(perPage)
      .lean(); // Fetch plain objects for better performance

    const userIds = allUsers.map((user) => user._id);

    // Batch fetch order counts for all users
    const orderCounts = await Promise.all(
      userIds.map(async (userId) => {
        try {
          return { userId, orderCount: await orderCountById(userId) };
        } catch (error) {
          console.error(`Error fetching order count for userId ${userId}:`, error);
          return { userId, orderCount: 0 };
        }
      })
    );

    // Map order counts back to users
    const userWithDetails = allUsers.map((user) => {
      const userOrder = orderCounts.find((order) => String(order.userId) === String(user._id));
      return {
        ...user,
        orderCount: userOrder ? userOrder.orderCount : 0,
      };
    });

    // Apply search query if provided
    let filteredUsers = userWithDetails;
    if (query) {
      const regexQuery = new RegExp(query.split("").join(".*"), "i");
      filteredUsers = userWithDetails.filter(
        (element) =>
          regexQuery.test(element.fullName) || 
          regexQuery.test(element.email) || 
          regexQuery.test(String(element.phone)) // Convert phone number to string for regex match
      );

      if (filteredUsers.length === 0) {
        return res.status(404).json({ message: "No matching users found." });
      }
    }

    // Fetch total count of active users
    const totalCount = await user.countDocuments({ is_Active: true });

    return res.status(200).json({
      users: filteredUsers,
      page: currentPage,
      limit: perPage,
      total: totalCount, // Total count of active users
    });
  } catch (error) {
    return res.status(500).json({
      message: `${error.message} - Internal Server Error`,
    });
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
const contactUs = async (req, res) => {
  try {
    const { name, email, phone, issue } = req.body;
    const msg = `<div style="font-family: Arial, sans-serif; color: #333; background-color: #f9f9f9; padding: 20px;">
            <p style="margin-bottom: 10px;">Dear Admin,</p>
            <p style="margin-bottom: 10px;"> Name:,${name}.</p>
            <p style="margin-bottom: 10px;">Email:,${email}.</p>
            <p style="margin-bottom: 10px;">Phone: ${phone}.</p>
             <p style="margin-bottom: 10px;">Issue: ${issue}.</p>
            <p style="margin-bottom: 10px;">Best regards,</p>
            <p style="margin-bottom: 0;">The Finafid Team</p>
        </div>`;

    const response = await sendMail(
      "info@finafid.com",
      "Issue of Customer Email",
      msg
    );
    return res.status(200).json({ message: "Email sent" });
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
  contactUs,
};
