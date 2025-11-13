import { Request, Response } from "express";

export default {
  home: (_req: Request, res: Response) => {
    res.send(`
      <html>
        <head>
          <title>Server Status</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              background: #f5f5f5;
              padding: 40px;
              text-align: center;
            }
            h1 {
              color: #2d8fdd;
            }
            p {
              font-size: 18px;
              color: #444;
            }
          </style>
        </head>
        <body>
          <h1>🚀 Server is Online</h1>
          <p>Your Express server is running successfully.</p>
        </body>
      </html>
    `);
  },
};
