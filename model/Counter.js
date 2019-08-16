const mongoose=require('mongoose');

const counterSchema= new mongoose.Schema({
    threadId:{
        type:String,
        default:null,
        min:4
    },
    count : {
        type:String,
        required:true,
        
    }
},
    {timestamps: true});

module.exports=mongoose.model('Counter',counterSchema);