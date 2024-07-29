const variationType=require("../../models/product/VariationType")
const createVariation=async(req,res)=>{
    try{
        const {name ,description}=req.body
        const newVariation = new variationType({name, description});
        if(!newVariation){
            return res.status(500).json({ message: "cannot create a variation" });
        }
        await newVariation.save();
         return res.status(200).json({ message: "Created successfully" });
    } catch (err) {
    return res
      .status(500)
      .json({ message: err.message + "Internal Server Error" });
  }
}
const editVariationType = async (req, res) => {
  try {
    const { name, description } = req.body;

    const newVariation = await variationType.findOne({
        _id:req.params.variationTypeId
    })
    if (!newVariation) {
      return res.status(500).json({ message: "cannot create a variation" });
    }
    newVariation.name=name;
    newVariation.description=description
    await newVariation.save();
    return res.status(200).json({ message: "Updated successfully" });
  } catch (err) {
    return res.status(500).json({ message: "Internal Server Error" });
  }
};
const deleteVariationType = async (req, res) => {
  try {
    const newVariation = await variationType.findByIdAndDelete({
      _id: req.params.variationTypeId,
    });
    if (!newVariation) {
      return res.status(500).json({ message: "cannot create a variation" });
    }
  
    return res.status(200).json({ message: "deleted successfully" });
  } catch (err) {
    return res.status(500).json({ message: "Internal Server Error" });
  }
};
const getAllVariation=async(req,res)=>{
   try {
    const newVariation = await variationType.find({
     
    }).populate('name')
    if (!newVariation) {
      return res.status(500).json({ message: "cannot create a variation" });
    }
  
    return res.status(200).json({ newVariation });}
   catch(err) {
    return res.status(500).json({ message: "Internal Server Error" });
  }
}
module.exports = {
  deleteVariationType,
  editVariationType,
  createVariation,
  getAllVariation,
};