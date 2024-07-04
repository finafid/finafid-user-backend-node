const Banner=require("../../models/Bannner/Banner");
const {getImageLinks}=require("../../utils/fileUpload")
const createBanner=async(req,res)=>{
    try{
        const imgUrl = await getImageLinks(req.files["images[]"])
        const { bannerType, details, linkUrl } = req.body;
        const newBanner = new Banner({
          bannerType,
          details,
          linkUrl,
          imgUrl,
        });
        if (!imgUrl){
            return res.status(500).json({
              success: false,
              message: "Cannot create",
            });
        }
         await newBanner.save();
         return res.status(500).json({
           success: true,
           message: " Created successfully",
         });
    }catch{
        return res.status(500).json({
          success: false,
          message: error.message + " Internal server error",
        });
    }
}
const editBanner=async(req,res)=>{
    try {
        const {bannerId}=req.params;
        const bannerDetails=await Banner.findOne({_id:bannerId})
        if(!bannerDetails){
           return res.status(500).json({
             success: false,
             message: "No banner found",
           }); 
        }
        const newImgLinks=[]
        if(req.files){
           newImgLinks=await getImageLinks(req.files["images[]"])
        }
        if(req.body.imgLinks){
          newImgLinks.concat(req.body.imgLinks);
        }
        bannerDetails.getImageLinks = newImgLinks;
        bannerDetails.getImageLinks = req.body.bannerType;
        bannerDetails.getImageLinks = req.body.details;
        bannerDetails.getImageLinks = req.body.linkUrl;
        await bannerDetails.save();
        return res.status(200).json({
          success: true,
          message: "Updated successfully",
        });
        
    } catch {
      return res.status(500).json({
        success: false,
        message: error.message + " Internal server error",
      });
    }
}
const getAllBanners = async (req, res) => {
  try {
    const { bannerType, details } = req.query;

    const query = {};
    if (bannerType) {
      query.bannerType = bannerType;
    }
    if (details) {
      query.details = new RegExp(details, "i"); // Case-insensitive search for details
    }

    const banners = await Banner.find(query);
    return res.status(200).json({
      success: true,
      message: "Banners retrieved successfully",
      data: banners,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message + " Internal server error",
    });
  }
};
const deleteBanner=async(req,res)=>{
  try {
    const bannerDetails=await Banner.findByIdAndDelete({
      _id:req.params.bannerId
    })
    if(!bannerDetails){
      return res.status(500).json({
        success: false,
        message: "No banner found",
      });
    }
    return res.status(200).json({
      success: true,
      message:"Deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message + " Internal server error",
    });
  }
}
module.exports = {
  createBanner,
  editBanner,
  getAllBanners,
  deleteBanner
};