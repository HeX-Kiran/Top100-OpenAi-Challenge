import express from "express";
// import cors from "cors"
// import cors

// const dotenv=require('dotenv');
import { createRequire } from "module";
import { config } from "dotenv";
import OpenAI from "openai";
import { createReadStream } from "fs";
import { log } from "console";

const require = createRequire(import.meta.url);
const cors = require("cors");
const multer = require("multer");

config();
const model = "whisper-1";
const openai = new OpenAI({
  apiKey: process.env.OpenAI_API_KEY,
  //   OPENAI_API_KEY=sk-H0cGKN6zDgYbk3z5ZTYqT3BlbkFJYx8hhZzvwAIK1r8tQjp
});

// dotenv.config();
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname + ".mp3");
  },
});

const upload = multer({ storage: storage, preservePath: true });

// upload mp3 file
let filename;
let data;
app.post("/upload", upload.single("file"), async (req, res) => {
  console.log(req.file);
  res.send(`${req.file.path}`);

  filename = `./${req.file.path}`;

  data = await audioFn(filename);
});

app.get("/report", (req, res) => {
  console.log("passing" + data + "to report route");
  res.send(data);
});

app.listen(4002, () => {
  console.log("hi running");
});

// *********************************************************

// Whisper api
async function audioFn(filename) {
  const transcription = await openai.audio.transcriptions.create({
    file: createReadStream(filename),
    model: model,
    language: "en",
    temperature: 0.2,
  });

  console.log(transcription);

  //askQuestion returns a promise
  let answer = askQuestion(
    transcription.text +
      "imagine yourself as the best medical scriber in the world.Now you should creat a medical report with the following Sections. Objectives,introduction,patient history,assessment of current diagnosis(if provided only),treatment methadology,prognosis,closing.The above sections should be an object with key as section and values as respective section values"
  );
  //findAnswer take in a promise and resolve the promise
  findAnswer(answer);
}

function askQuestion(question) {
  // returns a promise
  let pr = openai.chat.completions.create({
    messages: [{ role: "user", content: question }],
    model: "gpt-3.5-turbo",
  });

  return pr;
}

function findAnswer(promise) {
  promise
    .then((data) => {
      let res = data.choices[0].message.content;
      console.log(res);
      return res;
    })
    .catch((err) => {
      console.log("Oops Something went wrong");
      console.log(err);
    });
}
