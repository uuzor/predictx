import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "../server/routes";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Initialize routes
let routesInitialized = false;
let server: any;

async function initializeRoutes() {
  if (!routesInitialized) {
    server = await registerRoutes(app);

    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      res.status(status).json({ message });
    });

    routesInitialized = true;
  }
}

// Vercel serverless function handler
export default async function handler(req: any, res: any) {
  await initializeRoutes();
  return app(req, res);
}
