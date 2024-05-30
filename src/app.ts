import express, {Application, Express, Request, Response} from 'express'
import rateLimit, {RateLimitRequestHandler} from 'express-rate-limit'
import fs from 'fs'
import dotenv from 'dotenv'
import cors from 'cors'

import routes from './routes'
import {connectToDatabase} from './utils/database'
import {usersRouter} from "./routes/users.router";
import * as https from "https";

const privateKey  = fs.readFileSync(__dirname + '/certs/privateKey.key', 'utf8');
const certificate = fs.readFileSync(__dirname + '/certs/certificate.crt', 'utf8');

const credentials = {key: privateKey, cert: certificate};

dotenv.config()

const app: Express = express()
const port: number | string | undefined = process.env.API_PORT || 8000

var server = https.createServer(credentials, app);

const limiter: RateLimitRequestHandler = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
})

app.use(cors({
    origin: '*',
}))

app.use(limiter)
app.use('/images', express.static('./public/images'));

// Change app. to server. to use HTTPS (with the certificates)
app.listen(port, async function () {
    console.log(`Server is running on port ${port}`);
    const db = connectToDatabase();

    /**
    * Documented Routes
    */
    routes(app, db);

    /**
    * Undocumented Routes
    */
    app.use("/api/users", usersRouter);
    
})