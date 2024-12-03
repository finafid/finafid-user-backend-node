const nodeMailer=require("nodemailer")

const transporter=nodeMailer.createTransport({
    host: process.env.SMTP_HOST,
    post: process.env.SMTP_PORT,
    secure: false,
    requireTLS: true,
    auth: {
        user:process.env.SMTP_Mail,
        pass:process.env.SMTP_Pass

    }
    
});
const sendMail=async(email,subject,content)=>{
    try{
        var mailOptions={
            from:`"Finafid" <${process.env.SMTP_Mail}>`,
            to:email,
            subject: subject,
            html :content           
        }
        transporter.sendMail(mailOptions,(error,info)=>{
            if(error){
                console.error(error)
            }
             // console.log('Mail sent',info.messageId);
        })
    }catch(error){
         // console.log(error)
    }
}
const oneMinuteExpiry = async (otpTime) => {
    try {
        const newDate = new Date();
        let diffTime = (otpTime - newDate.getTime()) / 1000;
        diffTime /= 60; // Convert difference to minutes
        if (Math.abs(diffTime) > 1) {
            return true; // OTP is expired
        } else {
            return false; // OTP is still valid
        }
    } catch (error) {
         // console.log(error);
        return false; // Error occurred, consider OTP as expired
    }
};

const threeMinuteExpiry = async (otpTime) => {
    try {
        const newDate = new Date();
        let diffTime = (otpTime - newDate.getTime()) / 1000;
        diffTime /= 60; // Convert difference to minutes
        if (Math.abs(diffTime) > 3) {
            return true; // OTP is expired
        } else {
            return false; // OTP is still valid
        }
    } catch (error) {
         // console.log(error);
        return false; // Error occurred, consider OTP as expired
    }
};

module.exports={
    sendMail,
    oneMinuteExpiry,threeMinuteExpiry
}