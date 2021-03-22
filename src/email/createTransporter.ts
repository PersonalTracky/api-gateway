import nodemailer from "nodemailer";
import { google } from "googleapis";
import SMTPTransport from "nodemailer/lib/smtp-transport";

const OAuth2 = google.auth.OAuth2;

export const createTransporter = async () => {
  const oauth2Client = new OAuth2(
    process.env.CLIENT_ID,
    process.env.CLIENT_SECRET,
    "https://developers.google.com/oauthplayground"
  );

  oauth2Client.setCredentials({
    refresh_token: process.env.REFRESH_TOKEN,
  });

  const accessToken: string = await new Promise((resolve, reject) => {
    oauth2Client.getAccessToken((err, token) => {
      if (err) {
        reject();
      }
      resolve(token!);
    });
  });

  const nodemailerOptions: SMTPTransport.Options = {
    service: "gmail",
    auth: {
      type: "OAuth2",
      user: process.env.EMAIL,
      accessToken,
      clientId: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
      refreshToken: process.env.REFRESH_TOKEN,
    },
  };

  const transporter = nodemailer.createTransport(nodemailerOptions);

  return transporter;
};
