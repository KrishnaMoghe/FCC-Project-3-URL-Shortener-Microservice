require('dotenv').config();
const bodyParser = require("body-parser");
const express = require('express');
const cors = require('cors');
const mongoose = require("mongoose");
const dns = require("dns");
const url = require("url");
const crypto = require("crypto");

const app = express();

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());
app.use('/public', express.static(`${process.cwd()}/public`));
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

mongoose.connect(process.env.MONGO_URL, 
  { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));


const urlSchema = new mongoose.Schema({
  original_url: {
    type: String,
    required: true,
  },
  short_url:{
    type: String,
    required: true
  }
});

const URL = mongoose.model("URL", urlSchema);

app.post("/api/shorturl", (req, res) => {
  // res.send(req.body);
  const inputUrl = req.body.url;
  const parsedUrl = url.parse(inputUrl);
  if (!parsedUrl.hostname) {
    return res.json({ error: "Invalid URL" })
  }
  dns.lookup(parsedUrl.hostname, (err) => {
    if (err) {
      return res.json({ error: "Invalid URL" });
    }
    URL.findOne({ original_url: inputUrl })
      .then((existingUrl) => {
        if (existingUrl) {
          return res.json({
            original_url: existingUrl.original_url,
            short_url: existingUrl.short_url
          });
        }

        const randomString = crypto.randomBytes(4).toString("hex");
        const newUrl = new URL({
          original_url: inputUrl,
          short_url: randomString
        });

        return newUrl
          .save()
          .then((savedUrl) => {
            return res.json({
              original_url: savedUrl.original_url,
              short_url: savedUrl.short_url
            })
          })
      })
      .catch((err)=>{
        return res.status(500).json({error: "Database error"});
      })
  })
})

app.get("/api/shorturl/:short_url", (req, res)=>{
  const short_url = req.params.short_url;
  // res.send(short_url)
  URL.findOne({short_url})
  .then((urlDoc)=>{
    if(!urlDoc){
      return res.status(404).json({error: "No short url found"})
    }
    res.redirect(urlDoc.original_url)
  })
  .catch((err)=>{
    console.error("Database error:", err);
    res.status(500).json({error: "Internal server error"})
  })
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
// mongodb+srv://Krishnaa:SrE3x41lcII2a3aq@cluster0.nbvzl.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
// SrE3x41lcII2a3aq