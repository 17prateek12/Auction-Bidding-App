const asyncHandler = require('express-async-handler');
const Event = require('../models/Event.js')

//Middleware logic if user is creator of event or not then only he/she can view event room, to protect event room because of security purpose 
const verifyEventCreator = asyncHandler(async(req , res , next) =>{
    try {
        const {eventId} = req.params;
        const userId = req.user.id;

        const event = await Event.findById(eventId);
        if(!event){
            return res.status(404).json({message:"Event Not Found"});
        }

        if(event.createdBy.toString()!=userId){
            return res.status(403).json({message:"Access Denied: Not the Event creator"});
        }

        req.event= event;
        next();

    } catch (error) {
        res.status(500).json({message:"Server Error",error:error.message});
    }
});

module.exports = verifyEventCreator;