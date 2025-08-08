import express from 'express';
import { getChatMessages, sendMessage, sseController } from '../controllers/messagecontroller.js';
import { upload } from '../configs/multer.js';
import { protect } from '../middleware/auth.js';


const messageRouter = express.Router();

messageRouter.get('/:userId',sseController)
messageRouter.post('/send',upload.single('image'),protect,sendMessage)
messageRouter.post('/get',protect,getChatMessages)

export default messageRouter;