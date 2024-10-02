const User = require("../../models/auth/userSchema");
const order = require("../../models/Order/orderSc");
const Variant = require("../../models/product/Varient");
const MemberShipPlan = require("../../models/Utsab/MembershipPlan");
const Leader = require("../../models/Utsab/LeaderMember");
const borrowMember = require("../../models/Utsab/borrowMember");
const BorrowMemberShipPlan = require("../../models/Utsab/BorrowMemberShipPlan");
const Referral = require("../../models/auth/referral");
const Wallet = require("../../models/Wallet/wallet");
const Address = require("../../models/Order/address");
const walletTransaction = require("../../models/Wallet/WalletTransaction");
const isUtsabApplicable = async (req, res) => {
  try {
    const planDetails = await MemberShipPlan.findOne({
      identity: "PLAN_IDENTITY",
    });
    const userOrderDetails = await order.findOne({
      userId: req.user._id,
      totalPrice: { $gt: planDetails.amount },
      status: "Completed",
    });
    if (!userOrderDetails) {
      return res.status(500).json({ message: "Not available" });
    }
    for (const element of userOrderDetails.orderItem) {
      const productDetails = await Variant.findById(element.productId);
      if (productDetails.isUtsav === false) {
        return res.status(500).json({ message: "Not available" });
      }
    }
    const userData = await User.findOne({ _id: req.user._id });
    userData.is_utsav = true;
    await userData.save();
    return res
      .status(200)
      .json({ message: "Congratulations, You are ustav member" });
  } catch (error) {
    return res
      .status(500)
      .json({ message: error.message + " Internal Server Error" });
  }
};
const addBorrowMembershipPlan = async (req, res) => {
  try {
    const { amount, due, status, instruction } = req.body;
    const memberShipDetails = await BorrowMemberShipPlan.findOne({
      identity: "BORROW_IDENTITY",
    });

    if (!memberShipDetails) {
      const newDetails = new BorrowMemberShipPlan({
        amount,
        due,
        status,
        instruction,
        identity: "BORROW_IDENTITY",
      });

      await newDetails.save();
       return res.status(200).json({ message: "Successfully done" });
    }
    memberShipDetails.amount = amount;
    memberShipDetails.due = due;
    memberShipDetails.status = status;
    await memberShipDetails.save();
    return res.status(200).json({ message: "Successfully done" });
  } catch (error) {
    return res
      .status(500)
      .json({ message: error.message + " Internal Server Error" });
  }
};
const addMembershipPlan = async (req, res) => {
  try {
    const { amount, reward, status, instruction } = req.body;
    const memberShipDetails = await MemberShipPlan.findOne({
      identity: "PLAN_IDENTITY",
    });
    console.log(req.body);
    if (!memberShipDetails) {
      const newDetails = new MemberShipPlan({
        amount,
        reward,
        status,
        instruction,
        identity: "PLAN_IDENTITY",
      });

      await newDetails.save();
       return res.status(200).json({ message: "Successfully done" });
    }
    memberShipDetails.amount = amount;
    memberShipDetails.reward = reward;
    memberShipDetails.status = status;
    memberShipDetails.instruction = instruction;
    await memberShipDetails.save();
    return res.status(200).json({ message: "Successfully done" });
  } catch (error) {
    return res
      .status(500)
      .json({ message: error.message + " Internal Server Error" });
  }
};
const totalOrderOfUtsav = async (req, res) => {
  try {
    const { status, page = 1, limit = 10, startDate, endDate } = req.query;

    // Create a date filter object if startDate and endDate are provided
    let dateFilter = { is_utsab: true };
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) {
        dateFilter.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        // Add 1 day to the endDate to include the entire day
        const end = new Date(endDate);
        end.setDate(end.getDate() + 1);
        dateFilter.createdAt.$lte = end;
      }
    }

    // Fetch all orders first with the date filter applied
    const orderDetails = await order
      .find(dateFilter)
      .populate("userId")
      .populate({
        path: "orderItem.productId",
        model: "Variant",
        populate: {
          path: "productGroup",
          model: "Product",
        },
      });
    const statusCount = {};
    const statusList = [
      "Pending",
      "Confirmed",
      "Shipping",
      "Out For delivery",
      "Delivered",
      "Returned",
      "Canceled",
      "Completed",
    ];

    statusList.forEach((status) => {
      const filteredOrderList = orderDetails.filter(
        (order) => order.status === status
      );
      statusCount[status] = filteredOrderList.length;
    });

    if (!orderDetails) {
      return res.status(500).json({ message: " Internal Server Error" });
    }

    let filteredOrders = orderDetails;
    if (status) {
      filteredOrders = orderDetails.filter((order) => order.status === status);
    }

    // Calculate pagination values
    const skip = (page - 1) * limit;
    const paginatedOrders = filteredOrders.slice(skip, skip + parseInt(limit));

    // Calculate total pages
    const totalOrders = filteredOrders.length;
    const totalPages = Math.ceil(totalOrders / limit);

    return res.status(200).json({
      success: true,
      orderDetails: paginatedOrders,
      totalOrders,
      totalPages,
      currentPage: page,
      statusCount,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: error.message + " Internal Server Error" });
  }
};
const addLeader = async (req, res) => {
  try {
    let leaderDetails = await Leader.findOne({ userId: req.params.userId });
    if (leaderDetails) {
       leaderDetails.status = req.body.status;
       await leaderDetails.save()
       return res.status(200).json({ leaderDetails });
    }
    const newLeader = new Leader({
      userId: req.params.userId,
    });
    newLeader.status=req.body.status;
    await newLeader.save();
    return res.status(200).json({ newLeader });
  } catch (error) {
    return res
      .status(500)
      .json({ message: error.message + " Internal Server Error" });
  }
};
const getLeaderDetails = async (req, res) => {
  try {
    let leaderDetails = await Leader.findOne({ userId: req.params.userId });
    if (leaderDetails) {
    return res.status(200).json({ message:"" });
    }
    
    return res.status(200).json({ leaderDetails: leaderDetails });
  } catch (error) {
    return res
      .status(500)
      .json({ message: error.message + " Internal Server Error" });
  }
};
const addBorrowMember = async (req, res) => {
  try {
    const { code } = req.body;
    const walletDetails = await Wallet.findOne({
      userId: req.user._id,
    });

    const memberShipDetails = await BorrowMemberShipPlan.findOne({
      identity: "BORROW_IDENTITY",
    });
    const leaderDetails = await Referral.findOne({ code: code });

    if (!leaderDetails) {
      return res.status(500).json({ message: "No leader found" });
    }
    console.log(walletDetails.balance);
    if (walletDetails.balance < memberShipDetails.amount) {
      return res.status(500).json({
        message: "Sorry but cannot process because of your wallet Balance",
      });
    }
    const newBorrowMember = new borrowMember({
      userId: req.user._id,
      leader: leaderDetails.userId,
      due_amount: 5000 - walletDetails.balance,
    });
    await newBorrowMember.save();
    return res.status(200).json({ message: "Completed successfully" });
  } catch (error) {
    return res
      .status(500)
      .json({ message: error.message + " Internal Server Error" });
  }
};

const getAllLeader = async (req, res) => {
  try {
    const leaderDetails = await Leader.find({
      admin_approval: "pending",
    }).populate("userId");
    if (!leaderDetails) {
      return res.status(500).json({ message: " No member" });
    }
    const membersWithDetails = await Promise.all(
      leaderDetails.map(async (member) => {
        const userId = member.userId;
        try {
          const totalSpendData = await totalSpendOfMember(userId);
          const referralDetailsData = await getReferralDetails(userId);
          return {
            ...member._doc,
            totalSpend: totalSpendData.totalSpend,
            referralDetails: referralDetailsData.referralDetails,
          };
        } catch (error) {
          console.error(`Error fetching details for userId ${userId}:`, error);
          return {
            ...member._doc,
            totalSpend: 0,
            referralDetails: null,
          };
        }
      })
    );
    return res.status(200).json({
      membersWithDetails: membersWithDetails,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: error.message + " Internal Server Error" });
  }
};
const getAllApprovedLeader = async (req, res) => {
  try {
    const leaderDetails = await Leader.find({
      admin_approval: "approved",
    }).populate("userId");
    if (!leaderDetails) {
      return res.status(500).json({ message: " No member" });
    }
    const membersWithDetails = await Promise.all(
      leaderDetails.map(async (member) => {
        const userId = member.userId;
        try {
          const totalSpendData = await totalSpendOfMember(userId);
          const referralDetailsData = await getReferralDetails(userId);
          return {
            ...member._doc,
            totalSpend: totalSpendData.totalSpend,
            referralDetails: referralDetailsData.referralDetails,
          };
        } catch (error) {
          console.error(`Error fetching details for userId ${userId}:`, error);
          return {
            ...member._doc,
            totalSpend: 0,
            referralDetails: null,
          };
        }
      })
    );
    return res.status(200).json({
      membersWithDetails: membersWithDetails,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: error.message + " Internal Server Error" });
  }
};
const getAllBorrowLIst = async (req, res) => {
  try {
    const borrowMemberDetails = await borrowMember
      .find({
        admin_approval: "pending",
      })
      .populate("userId");

    if (!borrowMemberDetails) {
      return res.status(500).json({ message: " No member" });
    }
    const membersWithDetails = await Promise.all(
      borrowMemberDetails.map(async (member) => {
        const userId = member.userId;
        try {
          const totalSpendData = await totalSpendOfMember(userId);
          const referralDetailsData = await getReferralDetails(userId);
          return {
            ...member._doc,
            totalSpend: totalSpendData.totalSpend,
            referralDetails: referralDetailsData.referralDetails,
          };
        } catch (error) {
          console.error(`Error fetching details for userId ${userId}:`, error);
          return {
            ...member._doc,
            totalSpend: 0,
            referralDetails: null,
          };
        }
      })
    );
    return res.status(200).json(membersWithDetails);
  } catch (error) {
    return res
      .status(500)
      .json({ message: error.message + " Internal Server Error" });
  }
};
const totalSpendOfMember = async (userId) => {
  try {
    const orderDetails = await order.find({
      status: "Completed",
      userId: userId,
    });

    if (!orderDetails || orderDetails.length === 0) {
      return { totalSpend: 0 };
    }

    const totalSpend = orderDetails.reduce(
      (acc, order) => acc + (order.totalPrice || 0),
      0
    );

    return { totalSpend: totalSpend };
  } catch (error) {
    console.error(`Error in totalSpendOfMember for userId ${userId}:`, error);
    throw new Error(error.message + " Internal Server Error");
  }
};

const getReferralDetails = async (userId) => {
  try {
    let referralDetails = await Referral.findOne({
      userId: userId,
    }).populate("referred_by");
    if (referralDetails && referralDetails.referred_user.length > 0) {
      referralDetails = await referralDetails.populate({
        path: "referred_user",
        model: "user",
      });
    }
    if (!referralDetails) {
      return { referralDetails: null };
    }

    return { referralDetails: referralDetails };
  } catch (error) {
    console.error(`Error in getReferralDetails for userId ${userId}:`, error);
    throw new Error(error.message + " Internal Server Error");
  }
};

const getAllMemberList = async (req, res) => {
  try {
    const memberList = await User.find({
      is_utsav: true,
    });

    if (!memberList || memberList.length === 0) {
      return res.status(404).json({ message: "No members found" });
    }

    const membersWithDetails = await Promise.all(
      memberList.map(async (member) => {
        const userId = member._id;
        try {
          const totalSpendData = await totalSpendOfMember(userId);
          const referralDetailsData = await getReferralDetails(userId);

          return {
            ...member._doc,
            totalSpend: totalSpendData.totalSpend,
            referralDetails: referralDetailsData.referralDetails,
          };
        } catch (error) {
          console.error(`Error fetching details for userId ${userId}:`, error);
          return {
            ...member._doc,
            totalSpend: 0,
            referralDetails: null,
          };
        }
      })
    );

    return res.status(200).json({ memberList: membersWithDetails });
  } catch (error) {
    console.error("Error in getAllMemberList:", error);
    return res
      .status(500)
      .json({ message: error.message + " Internal Server Error" });
  }
};

const getMemberShipPlan = async (req, res) => {
  try {
    const planDetails = await MemberShipPlan.findOne({
      identity: "PLAN_IDENTITY",
    });
    return res.status(200).json({ planDetails });
  } catch (error) {
    return res
      .status(500)
      .json({ message: error.message + " Internal Server Error" });
  }
};
const getBorrowMemberShipPlan = async (req, res) => {
  try {
    const memberShipDetails = await BorrowMemberShipPlan.findOne({
      identity: "BORROW_IDENTITY",
    });
    return res.status(200).json({ memberShipDetails: memberShipDetails });
  } catch (error) {
    return res
      .status(500)
      .json({ message: error.message + " Internal Server Error" });
  }
};
const getMemberById = async (req, res) => {
  try {
    const userData = await User.findById(req.params.userId);
    const address = await Address.findOne({
      userId: req.params.userId,
      isDefault: true,
    });
    const walletTransactionDetails = await walletTransaction
      .find({
        userId: req.params.userId,
      })
      .populate("userId");
    const referralDetails = await Referral.findOne({
      userId: req.params.userId,
    })
      .populate("referred_by")
      .populate({
        path: "referred_user",
        model: "user",
      });

    let membersWithDetails = [];

    if (referralDetails && referralDetails.referred_user) {
      membersWithDetails = await Promise.all(
        referralDetails.referred_user.map(async (member) => {
          const userId = member._id;
          try {
            const totalSpendData = await totalSpendOfMember(userId);

            return {
              ...member._doc,
              totalSpend: totalSpendData.totalSpend,
            };
          } catch (error) {
            console.error(
              `Error fetching details for userId ${userId}:`,
              error
            );
            return {
              ...member._doc,
              totalSpend: 0,
            };
          }
        })
      );
    }

   const response = {};

   if (userData) {
     response.userData = userData;
   }
   if (address) {
     response.address = address;
   }
   if (walletTransactionDetails) {
     response.walletTransactionDetails = walletTransactionDetails;
   }
   if (referralDetails) {
     response.referralDetails = {
       ...referralDetails._doc,
       referred_user: membersWithDetails,
     };
   }

   return res.status(200).json(response);
  } catch (error) {
    return res
      .status(500)
      .json({ message: error.message + " Internal Server Error" });
  }
};

const totalSpendOfMemberSingle = async (req, res) => {
  try {
    const orderDetails = await order.find({
      status: "Completed",
      userId: req.params.userId,
    });

    if (!orderDetails || orderDetails.length === 0) {
      return { totalSpend: 0 };
    }

    const totalSpend = orderDetails.reduce(
      (acc, order) => acc + (order.totalPrice || 0),
      0
    );

    return res.status(500).json({ totalSpend: totalSpend });
  } catch (error) {
    return res
      .status(500)
      .json({ message: error.message + " Internal Server Error" });
  }
};

const getReferralDetailsSingle = async (req, res) => {
  try {
    const referralDetails = await Referral.findOne({
      userId: req.params.userId,
    }).populate("referred_by");
    // .populate({
    //   path:referred_user,
    //   model:"user"
    // })

    if (!referralDetails) {
      return { referralDetails: null };
    }

    return res.status(200).json({ referralDetails: referralDetails });
  } catch (error) {
    return res
      .status(500)
      .json({ message: error.message + " Internal Server Error" });
  }
};
const getAllWalletTransaction = async (req, res) => {
  try {
    const membersWithDetails = await walletTransaction
      .find({
        type: "debit",
      })
      .populate("userId","fullName");
    const detailsTransaction = await Promise.all(
      membersWithDetails.map(async (member) => {
        const userId = member.userId;
        try {
          const referralDetailsData = await getReferralDetails(userId);

          return {
            ...member._doc,

            referralDetails: referralDetailsData.referralDetails,
          };
        } catch (error) {
          console.error(`Error fetching details for userId ${userId}:`, error);
          return {
            ...member._doc,

            referralDetails: null,
          };
        }
      })
    );
    return res.status(200).json({ detailsTransaction: detailsTransaction });
  } catch (error) {
    return res
      .status(500)
      .json({ message: error.message + " Internal Server Error" });
  }
};
const approveBorrowRequest = async (req, res) => {
  try {
    const borrowMemberDetails = await borrowMember.findById(
      req.params.requestId
    );
    if (!borrowMemberDetails) {
      return res.status(500).json({ message: " No member" });
    }
    borrowMemberDetails.admin_approval = req.body.approval;
    await borrowMemberDetails.save();
    return res.status(200).json(borrowMemberDetails);
  } catch (error) {
    return res
      .status(500)
      .json({ message: error.message + " Internal Server Error" });
  }
};

const approveLeaderRequest = async (req, res) => {
  try {
    const memberDetails = await Leader.findById(req.params.requestId);
    if (!memberDetails) {
      return res.status(500).json({ message: " No member" });
    }
    memberDetails.admin_approval = req.body.approval;
    await memberDetails.save();
    return res.status(200).json(memberDetails);
  } catch (error) {
    return res
      .status(500)
      .json({ message: error.message + " Internal Server Error" });
  }
};

module.exports = {
  isUtsabApplicable,
  addMembershipPlan,
  totalOrderOfUtsav,
  addBorrowMember,
  addLeader,
  getAllBorrowLIst,
  getAllLeader,
  addBorrowMembershipPlan,
  getAllMemberList,
  totalSpendOfMemberSingle,
  getReferralDetailsSingle,
  getMemberShipPlan,
  getBorrowMemberShipPlan,
  getMemberById,
  getAllWalletTransaction,
  approveBorrowRequest,
  approveLeaderRequest,
  getAllApprovedLeader,
  getLeaderDetails,
};
