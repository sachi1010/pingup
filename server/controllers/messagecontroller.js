import fs from 'fs';
import imagekit from '../configs/imagekit.js';
import Message from '../models/message.js';



//create an empty object to store as 
const connections = {};

//controller function for the sse endpoint
export const sseController = (req,res)=>{
    const {userId} = req.parms
    console.log('new client connected:',userId)

    res.setHeader('Content-type','text/event-stream');
    res.setHeader('Cache-Control','no-cache');
    res.setHeader('Connection','keep-alive');
    res.setHeader('Access-Control-Allow-Origin','*');

    // add the clients res obj to the con obj
    conections[userId] = res;

    //send a initial eve to the client
    res.write('log:Connected to sse stream\n\n')

    //handle client discon
    req.on('close',()=>{
        delete conections[userId];
        console.log('client disconnected');                                                                                                                                                                                                                                                                                                                                                                                 
    })
}

//send message
export const sendMessage = async(req,res) => {
        try {
            const {userId} = req.auth();
            const {to_user_id,text} = req.body;
            const image = req.file;

            let media_url = ''
            let message_type = image? 'image':'text';

            if (message_type === 'image') {
                const fileBuffer = fs.readFileSync(image.path);
                const response = await imagekit.upload({
                    file: fileBuffer,
                    fileName: image.originalname,
                });
                media_url = imagekit.url({
                    path : response.filePath,
                    transformation:[
                        {quality:'auto'},
                        {format:'webp'},
                        {width:1280}
                    ]
                })
            }
            const message = Message.create({
                from_user_id:userId,
                to_user_id,
                text,
                media_url,
                message_type
            })
            res.json({success:true,message});

            //send message to to_user_id using sse
            const messageWithUserData = await Message.findById(message._id).populate('from_user_id');

            if (connections[to_user_id]) {
                connections[to_user_id].write(`data:${JSON.stringify(messageWithUserData)}\n\n`)
            }

        } catch (error) {
             console.log(error)
        res.json({success:false,message:error.message})
        }
}


//get chat messages
export const getChatMessages = async(req,res) => {
      try {
          const {userId} = req.auth();
         const {to_user_id} = req.body;

         const messages = await Message.find({
            $or: [
                {from_user_id:userId,to_user_id},
                {from_user_id:to_user_id,to_user_id:userId}
            ]
         }).sort({created_at:-1})

         await Message.updateMany({from_user_id:to_user_id,to_user_id:userId},{seen:true})
         res.json({success:true,messages})
      } catch (error) {
        //  console.log(error)
        res.json({success:false,message:error.message})
      }
}

export const getUserRecentMessages = async(req,res)=>{
    try{
        const {userId} = req.auth();
        const messages = await Message.find({to_user_id:userId}.populate('from_user_id to_user_id')).sort({created_at:-1});
        res.json({success:true,messages})
        }catch(error){
            res.json({success:false,message:error.message})
            }
}