import jwt from "jsonwebtoken";
import {NextFunction, Request, Response} from "express";
import dotenv from "dotenv";

dotenv.config();

export const validateToken = async (req: Request, res: Response, next: NextFunction) => {
    let token;
    let authHeader: string | string[] | undefined = req.headers.authorization || req.headers.Authorization;
    if (authHeader && typeof authHeader !== "string" || authHeader?.startsWith("Bearer")) {
        if (typeof authHeader === "string") {
            token = authHeader.split(" ")[1];
            jwt.verify(token, process.env.ACCESS_TOKEN_SECRET as string, (err: any, decoded: any) => {
                if(err) {
                    res.status(401).json({ message: "Invalid token" })
                } else {
                    // @ts-ignore
                    req.user = decoded.user
                    next();
                }
            })
        }

    }

    if(!token) {
        res.status(401).json({message: "No token provided"})
    }
}