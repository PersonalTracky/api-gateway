import Mail from "nodemailer/lib/mailer";
import { createTransporter } from "./createTransporter";

export const sendEmail = async (emailOptions: Mail.Options) => {
  let emailTransporter = await createTransporter();
  await emailTransporter.sendMail(emailOptions);
};
