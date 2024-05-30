import express, { Request, Response } from "express";
import Game from "../models/games.model";
import dotenv from "dotenv";
import {isAdmin} from "../middlewares/isAdmin";
import {connectToDatabase} from "../utils/database";
import {validateToken} from "../middlewares/validateToken";

dotenv.config();

export const gameRouter = express.Router();

gameRouter.use(express.json());
const connection = connectToDatabase();

gameRouter.get("/", async (req: Request, res: Response) => {
    let sql = "SELECT g.id, g.fen, g.history, g.rounds, g.start_date, g.end_date, gs.name as game_result FROM games AS g JOIN game_scores AS gs WHERE gs.id = g.result_id ORDER BY end_date DESC LIMIT 10";
    connection.query(sql, async function (error, results, fields) {
        if(error) throw error;
        if(results.length > 0) {
            res.status(200).json(results);
        } else {
            res.status(404).json({message: "No results found"});
        }
    });
});

gameRouter.get("/:id/players", async (req: Request, res: Response) => {
    const id = req?.params?.id;
    let sql = "SELECT u.id, u.username, c.name as `color`, gp.game_id FROM `users` AS `u`\n" +
        "JOIN `game_players` AS gp ON gp.user_id = u.id\n" +
        "JOIN `colors` AS c ON c.id = gp.color_id\n" +
        "WHERE gp.game_id = ?;";
    if(!id) return res.status(400).json({ message: "Missing game ID" });
    connection.query(sql, [id], async function (error, results, fields) {
        if(error) throw error;
        if(results.length > 0) {
            res.status(200).json(results);
        }
    });
});

gameRouter.get("/:id", async (req: Request, res: Response) => {
    const id = req?.params?.id;

    if(!id) return res.status(400).json({ message: "Missing game ID" });
    connection.query("SELECT g.id, g.fen, g.history, g.rounds, g.start_date, g.end_date, gs.name as game_result FROM games AS g JOIN game_scores AS gs WHERE gs.id = g.result_id AND g.id = ?", [id], async function (error, results, fields) {
        if(error) throw error;
        if(results.length > 0) {
            res.status(200).json(results[0]);
        }
    });
});

gameRouter.get("/user/:id", async (req: Request, res: Response) => {
    const id = req?.params?.id;
    if(!id) return res.status(400).json({ message: "Missing user ID" });
    connection.query("SELECT g.id, g.fen, g.history, g.rounds, g.start_date, g.end_date, gs.name as game_result, u.username, c.name as played_as, (SELECT u.username FROM game_players as gpp JOIN users AS u ON u.id = gpp.user_id WHERE gpp.user_id != ? AND gpp.game_id = gp.game_id) as opponent FROM games AS g JOIN game_scores AS gs ON gs.id = g.result_id JOIN game_players AS gp ON gp.game_id = g.id JOIN colors AS c ON gp.color_id = c.id JOIN users AS u ON u.id = gp.user_id WHERE gp.user_id = ? ORDER BY end_date DESC", [id, id], async function (error, results, fields) {
        if(error) throw error;
        if(results.length > 0) {
            res.status(200).json(results);
        }
    });
});


// (SELECT gpp.user_id AS opponent_id FROM game_players as gpp WHERE gpp.user_id != 3 AND gpp.game_id = gp.game_id)