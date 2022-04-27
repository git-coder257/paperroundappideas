import express, { response } from "express"
import pkg from 'pg';
import cors from "cors"

const app = express()
app.use(cors())
app.use(express.json())

const { Pool } = pkg;

const pool = new Pool({
  host: "localhost",
  user: "postgres",
  password: "password",
  database: "orsomworld",
  port: "5433",
})

const query = (text, params) => pool.query(text, params)

app.get("/users/:username/:password/:postoffice", async(req, res) => {
    let { username, password, postoffice } = req.params
    query("SELECT * FROM postofficeuser WHERE postofficename = $1;", [postoffice])
})
