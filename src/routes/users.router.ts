import express, { Request, Response } from "express";
import bcrypt from "bcrypt";
import User from "../models/users.model";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import {validateToken} from "../middlewares/validateToken";
import {connectToDatabase, buildSqlQuery, checkQueryParameters} from "../utils/database";
import {isAdmin} from "../middlewares/isAdmin";

dotenv.config();

export const usersRouter = express.Router();

usersRouter.use(express.json());
const connection = connectToDatabase();
const acceptedParameters = ["username"]

usersRouter.post("/register", async (req: Request, res: Response) => {
    const user: User = new User(req.body.email,  req.body.username, req.body.password);

    // Check if all fields are filled
    if(user.isValid()) return res.status(400).json({ message: "Please fill all fields" });

    connection.query("SELECT * FROM users WHERE email = ?", [user.email],  async function (error, results, fields) {
        if (error) throw error;
        if(results.length > 0) return res.status(400).json({ message: "User already exists" });

        const hashPassword = await bcrypt.hash(user.password, 10);
        const newUser: User = new User(user.email, user.username, hashPassword);

        const result = connection.query("INSERT INTO users SET ?", [newUser], function (error, results, fields) {
            if (error) throw error;
            if(!result) return res.status(500).json({ message: "Something went wrong" });
            const accessToken = jwt.sign({
                user: {
                    email: user.email
                },
            }, process.env.ACCESS_TOKEN_SECRET as string, { expiresIn: "100h" });
            res.status(201).json({ message: "User created", email: user.email, accessToken: accessToken})
        });
    });
});

usersRouter.post("/login", async (req: Request, res: Response) => {
    const user: User = req.body as User;
    if(!user.email || !user.password) return res.status(400).json({ message: "Please fill all fields" });

    connection.query("SELECT * FROM users WHERE email = ?", [user.email], async function (error, results, fields) {
        if(error) throw error;

        if(results.length > 0) {
            const isMatch = await bcrypt.compare(user.password, results[0].password);
            if(isMatch) {
                const accessToken = jwt.sign({
                    user: {
                        email: results[0].email
                    },
                }, process.env.ACCESS_TOKEN_SECRET as string, { expiresIn: "100h" });
                res.status(200).json({ accessToken: accessToken })
            } else {
                res.status(401).json({ message: "Invalid credentials" });
            }
        } else {
            res.status(401).json({ message: "User doesn't exists" });
        }
    })
});


usersRouter.get("/current", validateToken, async (req: Request, res: Response) => {
    // @ts-ignore
    let retUser;

    // @ts-ignore
    connection.query("SELECT users.id, users.email, users.username, roles.name as role FROM users JOIN roles ON roles.id = users.role_id WHERE email = ?", [req.user.email], async function (error, results, fields) {
        if(error) throw error;
        if(results.length > 0) {
            retUser = {
                id: results[0].id,
                email: results[0].email,
                username: results[0].username,
                role: results[0].role
            }
            res.status(200).json(retUser);
        } else {
            res.status(401).json({ message: "No current user" });
        }
    });
});

usersRouter.get("/all", isAdmin, async (req: Request, res: Response) => {
    //TO DO: Add pagination, joint request with roles
    connection.query("SELECT U.id, roles.name as `role`, email, username FROM `users` as U JOIN roles ON roles.id = U.role_id;", async function (error, results, fields) {
        if(error) throw error;
        if(results.length > 0) {
            res.status(200).json(results);
        }
    });
});

usersRouter.get("/username/:id", async (req: Request, res: Response) => {
    const id = req?.params?.id;
    if(!id) return res.status(400).json({ message: "Missing user username" });
    connection.query("SELECT users.id, users.email, users.username, roles.name as role FROM users JOIN roles ON roles.id = users.role_id WHERE users.username = ?", [id],  async function (error, results, fields) {
        if (error) throw error;
        if(results.length > 0) {
            if (!results) return res.status(500).json({message: "Something went wrong"});
            res.status(200).json({message: "User found", id: results[0].id, email: results[0].email, username: results[0].username, role: results[0].role})
        } else {
            res.status(404).json({message: "User not found"});
        }
    });
});

usersRouter.get("/:id",  async (req: Request, res: Response) => {
    const id = req?.params?.id;
    if(!id) return res.status(400).json({ message: "Missing user ID" });
    connection.query("SELECT users.id, users.email, users.username, roles.name as role FROM users JOIN roles ON roles.id = users.role_id WHERE users.id = ?", [id],  async function (error, results, fields) {
        if (error) throw error;
        if(results.length > 0) {
            if (!results) return res.status(500).json({message: "Something went wrong"});
            res.status(200).json({message: "User found", email: results[0].email, username: results[0].username, role: results[0].role})
        } else {
            res.status(404).json({message: "User not found"});
        }
    });
});


usersRouter.patch("/:id", validateToken, async (req: Request, res: Response) => {
    const id = req?.params?.id;
    const user = req.body as User;
    if(!id) return res.status(400).json({ message: "Missing user ID" });
    connection.query("SELECT * FROM users WHERE id = ?", [id],  async function (error, results, fields) {
        if (error) throw error;
        if(results.length > 0) {
            if(!user.email) user.email = results[0].email;
            if(!user.username) user.username = results[0].username;

            user.password = results[0].password;

            const newUser: User = new User(user.email, user.username, user.password);
            const result = connection.query("UPDATE users SET ? WHERE id = ?", [newUser, id]);
            if (!result) return res.status(500).json({message: "Something went wrong"});
            res.status(201).json({message: "User updated", email: user.email})
        }
    });
});

usersRouter.delete("/:id", validateToken, async (req: Request, res: Response) => {
    const id = req?.params?.id;
    if(!id) return res.status(400).json({ message: "Missing user ID" });
    connection.query("SELECT * FROM users WHERE id = ?", [id], function(error, results, fields) {
        if(error) throw error;
        if(results.length > 0) {
            const result = connection.query("DELETE FROM users WHERE id = ?", [id])
            if(!result) return res.status(500).json({message: "Something went wrong"})
            res.status(201).json({message: "User deleted"})
        }
    })

});
