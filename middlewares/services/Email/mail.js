import nodemailer from 'nodemailer';
import {welcomeTemplate} from './welcomeTemplate.js'
import {reminderTemplate} from './reminderTemplate.js'
export const emailSender =async(subject,email,Name,session,content)=>{
    let transporter = nodemailer.createTransport({
        service:"gmail",
        auth:{
            user:"hagershams800@gmail.com",
            pass:"qsvl ajyf wivv kzds"
        }
    })
    if(subject == 'welcome email'){
        let receiver = await transporter.sendMail({
            from:'"Bashmohands👻"<hagershams800@gmail.com>',
            to:email,
            subject:"Welcome Email",
            html:welcomeTemplate(Name)
        })
    }
    else if (subject == 'reminder'){
        let receiver = await transporter.sendMail({
            from:'"Bashmohands👻"<hagershams800@gmail.com>',
            to:email,
            subject:"Reminder Email",
            html:reminderTemplate(Name,session,content)
        })
    }
    else{
        let title = obj.subject
        let receiver = await transporter.sendMail({
            from:'"Bashmohands👻"<hagershams800@gmail.com>',
            to:obj.email,
            subject:title,
            // html:reminderTemplate(Name,token)
            // need to pass an email function to the html.
        })
    }
}