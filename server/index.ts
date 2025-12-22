import express from "express";
import type { Express, Request, Response } from "express";
const port = 8000;

const app: Express = express();


app.get("/", (req: Request, res: Response) => {
    res.send("HELLO WORLD new shit")
})

app.get("/hi", (req, res) => {
    res.send("byeee");
})

app.listen(port, () => {
    console.log("now listening on port ", port)
})