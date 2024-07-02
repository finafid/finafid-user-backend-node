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
        
    } catch {
      return res.status(500).json({
        success: false,
        message: error.message + " Internal server error",
      });
    }
}
module.exports = {
  createBanner,
  editBanner,
};