require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();
const bodyParser = require("body-parser");
// Basic Configuration

const mongoose = require("mongoose");

app.use(cors());

app.use(bodyParser.urlencoded({ extended: true }));

app.use("/public", express.static(`${process.cwd()}/public`));

//link validation regex
const protocol_regex = /^\D{3,5}:\/\//;

//link validation middleware

const validate_url = (req, res, next) => {
    console.log("------request------------------");
    console.log(req.body.url);
    console.log("------validate------------------");
    console.log("protocol: " + protocol_regex.test(req.body.url));
    console.log("------validate------------------");
    if (protocol_regex.test(req.body.url)) {
        console.log("probs a url");
    } else {
        return res.status(400).json({
            error: "invalid url",
        });
    }
    next();
};

app.use(validate_url);

mongoose.connect(process.env.MONGODB_URI).then((conexion) => {
    console.log("Conectado a " + process.env.MONGODB_URI);
});

const urlShortenerSchema = new mongoose.Schema({
    original_url: String,
    short_url: { type: Number, unique: true },
});

const UrlShortener = mongoose.model("UrlShortener", urlShortenerSchema);
app.get("/", function (req, res) {
    res.sendFile(process.cwd() + "/views/index.html");
});

urlShortenerSchema.set("toJSON", {
    transform: (document, returnedObject) => {
        returnedObject.id = returnedObject._id.toString();
        delete returnedObject._id;
        delete returnedObject.__v;
    },
});

// Your first API endpoint
app.get("/api/hello", function (req, res) {
    res.json({ greeting: "hello API" });
});

app.post("/api/shorturl", async (req, res) => {
    try {
        let url = new URL(req.body.url);
        let originalUrl = req.body.url;

        let shortUrl = Math.floor(Math.random() * 1000);

        if (url.protocol === "ftp:") {
            res.json({
                error: "invalid url",
            });
        } else {
            // saving url
            let savedUrl = await new UrlShortener({
                original_url: originalUrl,
                short_url: shortUrl,
            });
            savedUrl.save();

            res.json({
                original_url: originalUrl,
                short_url: shortUrl,
            });
        }
    } catch (e) {
        if (e instanceof TypeError) {
            res.json({
                error: "invalid url",
            });
        }
    }
});

app.get("/api/shorturl/:short", async (req, res) => {
    let short = req.params.short;

    let search = await UrlShortener.findOne({ short_url: short }).exec();
    res.redirect(search.original_url);
});
let port = process.env.PORT;
if (port == null || port == "") {
    port = 8000;
}
app.listen(port);
