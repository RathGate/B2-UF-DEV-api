import jwt from "jsonwebtoken";
import {NextFunction, Request, Response} from "express";
import dotenv from "dotenv";
import {connectToDatabase} from "../utils/database";

dotenv.config();
const connection = connectToDatabase();


export const isAdmin = async (req: Request, res: Response, next: NextFunction) => {
    let token;
    let authHeader: string | string[] | undefined = req.headers.authorization || req.headers.Authorization;
    if (authHeader && typeof authHeader !== "string" || authHeader?.startsWith("Bearer")) {
        if (typeof authHeader === "string") {
            token = authHeader.split(" ")[1];
            jwt.verify(token, process.env.ACCESS_TOKEN_SECRET as string, async (err: any, decoded: any) => {
                if (err) {
                    console.log("Error: ", err)
                    res.status(401).json({message: "Invalid token"})
                } else {
                    let retUser;
                    // @ts-ignore
                    req.user = decoded.user
                    // @ts-ignore
                    connection.query("SELECT U.id, roles.name as `role`, email FROM `users` as U JOIN roles ON roles.id = U.role_id WHERE email = ?", [req.user.email], async function (error, results, fields) {
                        if (error) throw error;
                        if (results.length > 0) {
                            retUser = {
                                id: results[0].id,
                                email: results[0].email,
                                role: results[0].role,
                            }
                            if (retUser.role === 'Admin') {
                                // @ts-ignore
                                res.status(200)
                                next();
                            } else {
                                console.log("other error", err)
                                res.status(401).json({message: "Unauthorized"})
                            }
                        }
                    });
                }
            })
        }

    }

    if (!token) {
        res.status(401).json({message: "Unauthorized"})
    }
}