import { Inngest } from "inngest"
import { User } from "../models/User.js"
import Connection from "../models/Connection.js"
import sendEmail from "../configs/nodemailer.js";
import Story from "../models/Story.js";
import Message from "../models/message.js";


// Create a client to send and receive events
export const inngest = new Inngest({ id: "pingup-app" });


//inngest fuction to save user
const syncUserCreation = inngest.createFunction(
    { id: 'sync-user-from-clerk' },
    { event: 'clerk/user.created' },
    async ({ event }) => {
        const { id, first_name, last_name, email_addresses, image_url } = event.data
        let username = email_addresses[0].email_address.split('@')[0]

        //check availability of username
        const user = await User.findOne({ username })

        if (user) {
            username = username + Math.floor(Math.random() * 10000)
        }

        const userData = {
            _id: id,
            email: email_addresses[0].email_address,
            full_name: first_name + ' ' + last_name,
            profile_picture: image_url,
            username
        }
        await User.create(userData)
    }
)

// inngest function to update user
const syncUserUpdation = inngest.createFunction(
    { id: 'update-user-from-clerk' },
    { event: 'clerk/user.updated' },
    async ({ event }) => {
        const { id, first_name, last_name, email_addresses, image_url } = event.data

        const updatedUserData = {
            email: email_addresses[0].email_address,
            full_name: first_name + ' ' + last_name,
            profile_picture: image_url
        }
        await User.findByIdAndUpdate(id, updatedUserData)
    }
)

// inngest function to delete user
const syncUserDeletion = inngest.createFunction(
    { id: 'delete-user-with-clerk' },
    { event: 'clerk/user.deleted' },
    async ({ event }) => {
        const { id } = event.data
        await User.findByIdAndDelete(id)
    }
)


//inngest function to send remainder when a new connection req
const syncNewConnectionRequestRemainder = inngest.createFunction(
    { id: 'send-new-connection-request-remainder' },
    { event: 'app/connection.requested' },
    async ({ event, step }) => {
        const { connectionId } = event.data;

        await step.run('send-connection-request-mail', async () => {
            const connection = await Connection.findById(connectionId).populate('from_user_id to_user_id')
            const subject = `New connection request`;
            const body = `
                    <p>Hi ${connection.to_user_id.full_name},</p>
                    <p>There is a new connection request from ${connection.from_user_id.full_name}.</p>
                    <p>Click <a href="${process.env.FRONTEND_URL}/connections">here</a> to view the request.</p
                        <p>Best regards</p>
                        `;

            await sendEmail({
                to: connection.to_user_id.email,
                subject,
                body
            })
        })
        const in24Hours = new Date(Date.now() + 24 * 60 * 60 * 1000);
        await step.sleepUntil("wait-for-24-hours",in24Hours);
        await step.run('send-connection-request-remainder' , async () => {
               const connection = await Connection.findById(connectionId).populate('from_user_id to_user_id')

               if (connection.status === 'accepted') {
                 return {message:"already accepted"}
               }
                const subject = `New connection request`;
            const body = `
                    <p>Hi ${connection.to_user_id.full_name},</p>
                    <p>There is a new connection request from ${connection.from_user_id.full_name}.</p>
                    <p>Click <a href="${process.env.FRONTEND_URL}/connections">here</a> to view the request.</p
                        <p>Best regards</p>
                        `;

            await sendEmail({
                to: connection.to_user_id.email,
                subject,
                body
            })
            return {message:"remainder sent"}
        })
    }
)


//inngest fuction delete the story in 24 houes
const deleteStory= inngest.createFunction(
    {id:'story-delete'},
    {event:'app/story.delete'},
    async ({event,step}) => {
         const {storyId} = event.data;
         const in24Hours = new Date(Date.now() + 24 * 60 * 60 *1000)
         await step.sleepUntil("wait-for-24-hours",in24Hours);
         await step.run('delete-story',async () => {
              await Story.findByIdAndDelete(storyId)
              return {message:"Story deleted"}
         })
    }
)

const sendNotificationofUnseenMessages=inngest.createFunction(
    {id:'send-unseen-messages-notification'},
    {cron:"TZ=America/New_York 0 9 * * *"},//run every day at 9am
    async ({step}) => {
        const messages = await Message.find({seen:false}).populate('to_user_id');
        const unseenCount = {}

        messages.map(message => {
            unseenCount[message.to_user_id._id] = (unseenCount[message.to_user_id._id] || 0) + 1;

        })

        for(const userId in unseenCount){
            const user = await User.findById(userId);
            const subject =`You have ${unseenCount[userId]} unseen messages`;
            const body =`
            <p>Hi ${user.full_name},</p>
            <p>You have ${unseenCount[userId]} unseen messages.</p>
            <p>Click <a href="${process.env.FRONTEND_URL}/messages">here</
            <p>Best regards</p>
            `;

            await sendEmail({
                to: user.email,
                subject,
                body
            })
        }
        return {message:"Notification sent"}
    }
)

// Create an empty array where we'll export future Inngest functions
export const functions = [
    syncUserCreation,
    syncUserUpdation,
    syncUserDeletion,
    syncNewConnectionRequestRemainder,
    deleteStory,
    sendNotificationofUnseenMessages
];