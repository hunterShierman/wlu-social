import express from "express";
const port = 8000;
const app = express();
app.get("/", (req, res) => {
    res.send("HELLO WORLD new shit");
});
app.get("/hi", (req, res) => {
    res.send("byeee");
});
app.listen(port, () => {
    console.log("now listening on port ", port);
});
//# sourceMappingURL=index.js.map