const GetAndBuy = require("../../models/Coupons/But_and_get");


const createNewDeal = async (req, res) => {
  const {
    title,
    products,
    banner,
    status,
    buyQuantity,
    getQuantity,
    dealType,
    customConditions,
  } = req.body;

  try {
    const newDeal = new GetAndBuy({
      title,
      products,
      banner,
      status,
      buyQuantity,
      getQuantity,
      dealType,
      customConditions,
    });

    const savedDeal = await newDeal.save();
    res.status(201).json(savedDeal);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getAllDeal = async (req, res) => {
  try {
    const deals = await GetAndBuy.find().populate(
      "products customConditions.buyProducts customConditions.getProducts"
    );
    res.status(200).json(deals);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getDealById = async (req, res) => {
  try {
    const deal = await GetAndBuy.findById(req.params.id).populate(
      "products customConditions.buyProducts customConditions.getProducts"
    );
    if (!deal) {
      return res.status(404).json({ message: "Deal not found" });
    }
    res.status(200).json(deal);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update a deal by ID
const updateDeal = async (req, res) => {
  const {
    title,
    products,
    banner,
    status,
    buyQuantity,
    getQuantity,
    dealType,
    customConditions,
  } = req.body;

  try {
    const updatedDeal = await GetAndBuy.findByIdAndUpdate(
      req.params.id,
      {
        title,
        products,
        banner,
        status,
        buyQuantity,
        getQuantity,
        dealType,
        customConditions,
      },
      { new: true }
    ).populate(
      "products customConditions.buyProducts customConditions.getProducts"
    );

    if (!updatedDeal) {
      return res.status(404).json({ message: "Deal not found" });
    }

    res.status(200).json(updatedDeal);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteDeal = async (req, res) => {
  try {
    const deletedDeal = await GetAndBuy.findByIdAndDelete(req.params.id);
    if (!deletedDeal) {
      return res.status(404).json({ message: "Deal not found" });
    }
    res.status(200).json({ message: "Deal deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createNewDeal,
  getAllDeal,
  getDealById,
  updateDeal,
  deleteDeal,
};
