const { string } = require('joi');
const mongoose=require('require');
const addressSchema=new mongoose.Schema({
   user:{
    type:Schema.type.objectId,
    ref:'User',
    required:true
   },
   locality:{
    type:string,

   },
   city:{
    type:string,
    required:true
   },
   street:{
    type:string,
    required:true
   },
   houseNumber: {
    type: String,
    required: true,
    validate: {
        validator: function(value) {
          
            return /^[a-zA-Z0-9]+$/.test(value);
        },
        message: 'House number must be alphanumeric'
    }
    },
    state:{
        type:string,
        required:true
       },
    country:{
        type:string,
        required:true
    }
},{ timestamps: true });


module.exports=mongoose.model('Address',addressSchema)