import dotenv from "dotenv";
dotenv.config();

export const env = {
  port: process.env.PORT || 5000,
  weatherKey: process.env.WEATHER_API_KEY as string
};
