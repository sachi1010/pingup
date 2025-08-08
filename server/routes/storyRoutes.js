import express from 'express';
import { upload } from '../configs/multer.js';
import { protect } from '../middleware/auth.js';
import { addUserStory, getUserStory } from '../controllers/storycontroller.js';


const storyRouter = express.Router();

storyRouter.post('/create',upload.single('media'),protect,addUserStory)
storyRouter.get('get',protect,getUserStory)

export default storyRouter;