const Banner=require("../../models/Bannner/Banner");
const {getImageLinks}=require("../../utils/fileUpload")
const getImageLink = async (req, res) => {
  try {
    // Extracting file buffer and extension from the request
    const inputImagePath = await req.file.buffer;

    const extension = req.file.originalname.split(".").pop();

    // Define resizing and compression parameters
    const width = 800;
    const compressionQuality = 5;

    // Compress and resize the image
    const imageBuffer = await compressAndResizeImage(
      inputImagePath,
      extension,
      width,
      compressionQuality
    );

    // Generate a new file name
    req.file.originalname =
      req.file.originalname.split(".")[0].split(" ").join("-") +
      "-" +
      Date.now() +
      "." +
      extension;

    // Assuming generateStringOfImageList is a function that uploads the image and generates a link
    await generateStringOfImageList(imageBuffer, req.file.originalname, res);

    // Generate the image URL
    const imgUrl =
      "https://d2w5oj0jmt3sl6.cloudfront.net/" + req.file.originalname;

    return imgUrl;
  } catch (error) {
    console.error("Error in getImageLink:", error);
  }
};
const createBanner=async(req,res)=>{
    try{
        const imgUrl = await getImageLink(req.files)
        const { bannerType, linkUrl, resourceType, valueId } =req.body
        const details = {
          resourceType,
          valueId,
        };
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
const getBannersByBannerTypeAndDetails = async (req, res) => {
  try {
    const { bannerType, resourceType, valueId } = req.query;

    const banners = await Banner.find({
      bannerType,
      "details.resourceType": resourceType,
      "details.valueId": valueId,
    });

    if (!banners || banners.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No banners found",
      });
    }

    return res.status(200).json({
      success: true,
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
  getBannersByBannerTypeAndDetails,
  deleteBanner,
};