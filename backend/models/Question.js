const mongoose = require('mongoose');
// express handle API requests , so when we have to use API requests we will reqiuire express
//mongoose handle MongoDB database, so when we have to use MongoDB database we will require mongoose
// here we have to deal with data so we will use mongoose to create a schema for the data and then we will use that schema to create a model for the data and then we will use that model to interact with the database

const questionSchema = new mongoose.Schema(
    {
        interview:{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Interview',
            required: true
        },
        question:{
            type: String,
            required: true
        },
        topic:{
            type:String,
            required:true
        },
        difficulty:{
            type: String,
            enum: ['Easy', 'Medium', 'Hard'],
            default: 'Medium'
        },
        order:{//wee need to know the order of the questions in the interview
            type: Number,
            required: true 
        }
    },
    {
        timestamps: true
    }
);
module.exports=mongoose.model('Question', questionSchema);