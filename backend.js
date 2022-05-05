const express = require('express')
const { Client } = require("pg")
const cors = require("cors")
const axios = require("axios")

const PORT = process.env.PORT || 3000

let client = new Client({
  // connectionString: process.env.DATABASE_URL,
  connectionString: "postgres://messhxxixwivua:65f04feeeafb47dac1d4c1fec83a22044be279971f057d8d88c2b2726b826d40@ec2-3-224-125-117.compute-1.amazonaws.com:5432/dci6j7v4a8g10",
  ssl: {
    rejectUnauthorized: false
  }
})

client.connect()

let app = express()
app.use(cors())
app.use(express.json())

app.get("/query", async (req, res) => {
  
  try {
    console.log(req.body)
    
    await client.query(req.body.query)

    res.json({
      success: true
    })

  } catch (error) {
    res.json({
      success: false
    })

    console.error(error)
  }
})

app.get("/", (req, res) => {
  res.send("Welcome to my REST api.")
})

// create account
app.post("/newpostofficeuser/:username/:password/:postofficename" , async (req, res) => {
  try {
    let { username, password, postofficename } = req.params

    let listofdistrict = req.body.districts

    if (await (await client.query("SELECT * FROM postofficeuser WHERE postofficename = $1;", [postofficename])).rows.length > 0){
      res.json({
        success: false,
        postofficenameexist: true
      })
    } else {
      await (await client.query("INSERT INTO postofficeuser (username, password, postofficename) VALUES ($1, $2, $3);", [username, password, postofficename]))

      let id = await (await client.query("SELECT * FROM postofficeuser WHERE username = $1 AND password = $2 AND postofficename = $3;", [username, password, postofficename])).rows[0].user_id
      
      for (let i = 0; i < listofdistrict.length; i++){
        client.query("INSERT INTO district (postofficeuser_id, districtname) VALUES ($1, $2);", [id, listofdistrict[i]])
      }

      res.json({
        success: true
      })
    }
  } catch (error) {

    console.error(error)

    res.json({
      success: false
    })
  }
})

// check if account exists
app.get("/postofficeuser/:username/:password/:postoffice", async (req, res) => {

  try {
    let { username, password, postoffice } = req.params
    
    let result = await (await client.query("SELECT * FROM postofficeuser WHERE username = $1 AND password = $2 AND postofficename = $3;", [username, password, postoffice])).rows
  
    console.log(result)

    if (result.length > 0){
      res.json({
        accountexists: true
      })
    } else {
      res.json({
        success: false
      })
    }
  } catch (error) {
    res.json({
      success: false
    })
  }
})


app.get("/postofficename/:district", async (req, res) => {
  try {

    const { district } = req.params
    
    // axios.get(`https://api.myptv.com/geocoding/v1/locations/by-text?searchText=${district}&apiKey=ZjVmOTA2NmQ5YTZkNDk0NWEzNDQzNTIxOWY0MTdlODc6ZTA5YzNjY2QtN2FjOC00NTA5LWE2NjgtYjA1NGE4Nzg1NGY1`)
    //         .then((r) => {
    //             console.log(r.data)
    //         })

    let postofficesids = await (await client.query("SELECT * FROM district WHERE districtname = $1;", [district])).rows

    let postoffices = []

    for (let i = 0 ; i < postofficesids.length; i++){
      // console.log(await (await client.query("SELECT * FROM postofficeuser WHERE user_id = $1;", [postofficesids[i]["postofficeuser_id"]])).rows[0])
      postoffices.push(await (await client.query("SELECT * FROM postofficeuser WHERE user_id = $1;", [postofficesids[i]["postofficeuser_id"]])).rows[0])
    }

    res.json({
      postoffices: postoffices,
      success: true
    })

  } catch (error) {

    console.error(error)

    res.json({
      success: false
    })
  }
})

// gets the price of the paper given
app.get("/paperprice/:postofficename/:paper", async (req, res) => {
  try {
    let { postofficename, paper } = req.params

    let postofficeid = await (await client.query("SELECT * FROM postofficeuser WHERE postofficename = $1;", [postofficename])).rows[0].user_id

    console.log(postofficeid)

    let result = await (await client.query("SELECT * FROM paperprice WHERE postoffice_id = $1 AND papername = $2;", [postofficeid, paper])).rows[0]

    res.json(result)
  } catch (error) {
    res.json({
      success: false
    })
  }
})

// updates/creates a paper price
app.post("/addpaperprice/:postofficename/:paper/:price", async (req, res) => {
  try {
    let { postofficename, paper, price } = req.params

    let postofficeid = await (await client.query("SELECT * FROM postofficeuser WHERE postofficename = $1;", [postofficename])).rows[0].user_id

    console.log(postofficeid)

    console.log(await (await client.query("SELECT * FROM paperprice WHERE papername = $1;", [paper])).rows)

    if (await (await client.query("SELECT * FROM paperprice WHERE papername = $1;", [paper])).rows.length === 1){
      client.query("UPDATE paperprice SET paperprice = $1 WHERE postoffice_id = $2 AND papername = $3;", [price, postofficeid, paper])
    } else {
      client.query("INSERT INTO paperprice (postoffice_id, papername, paperprice) VALUES ($1, $2, $3);", [postofficeid, paper, price])
    }

    res.json({
      success: true
    })
  } catch (error) {
    res.json({
      success: false
    })
  }
})

//6%20Parr%20Close
// https://api.myptv.com/geocoding/v1/locations/by-text?searchText={}&apiKey=ZjVmOTA2NmQ5YTZkNDk0NWEzNDQzNTIxOWY0MTdlODc6ZTA5YzNjY2QtN2FjOC00NTA5LWE2NjgtYjA1NGE4Nzg1NGY1
// app.get("/ordereruser/:username/:password/")

app.post("/newordereruser/:username/:password/:locationlat/:locationlong/:postofficename", async (req, res) => {
  try {
    let { username, password, locationlat, locationlong, postofficename } = req.params
    let location = req.body.location

    let postofficeid = await (await client.query("SELECT * FROM postofficeuser WHERE postofficename = $1;", [postofficename])).rows[0].user_id

    // console.log(postofficeid)

    client.query("INSERT INTO ordereruser (houselocationlat, houselocationlong, location, password, postoffice_id, username) VALUES ($1, $2, $3, $4, $5, $6);", [locationlat, locationlong, location, password, postofficeid, username])

    res.json({
      success: true
    })    
  } catch (error) {
    res.json({
      success: false
    })
  }
})

app.get("/ordereruser/:username/:password", async (req, res) => {
  try {
    let { username, password } = req.params

    if (await (await client.query("SELECT * FROM ordereruser WHERE username = $1 AND password = $2;", [username, password])).rows.length > 0){
      res.json({
        accountexists: true,
        success: true
      })
    } else {
      res.json({
        accountexists: false,
        success: false
      })
    }
  } catch (error) {
    res.json({
      success: false
    })
  }
})

app.post("/newdeliveruser/:username/:password/:postofficename", async (req, res) => {
  try {
    let { username, password, postofficename } = req.params

    let postofficeid = await (await client.query("SELECT * FROM postofficeuser WHERE postofficename = $1;", [postofficename])).rows[0].user_id
    
    await client.query("INSERT INTO deliveruser (username, password, postoffice_id) VALUES ($1, $2, $3);", [username, password, postofficeid])
    
    res.json({
      success: true
    })
  } catch (error) {
    res.json({
      success: false
    })
  }
})

app.get("/deliveruser/:username/:password", async (req, res) => {
  try {
    let { username, password } = req.params

    if (await (await client.query("SELECT * FROM deliveruser WHERE username = $1 AND password = $2;", [username, password])).rows.length > 0){
      res.json({
        accountexists: true,
        success: true
      })
    } else {
      res.json({
        accountexists: false,
        success: false
      })
    }
  } catch (error) {
    res.json({
      success: false
    })
  }
})

app.post("/newpaper/:username/:password/:postofficename/:papername/:locationlat/:locationlong", async (req, res) => {
  try {
    let { username, password, postofficename, papername, locationlat, locationlong } = req.params

    let postofficeid = await (await client.query("SELECT * FROM postofficeuser WHERE postofficename = $1;", [postofficename])).rows[0].user_id

    let ordererid = await (await client.query("SELECT * FROM ordereruser WHERE username = $1 AND password = $2;", [username, password])).rows[0].id

    client.query("INSERT INTO papertodeliver (houselocationlat, houselocationlong, papername, postoffice_id, ordereruser_id, deliver_id) VALUES ($1, $2, $3, $4, $5, $6);", [locationlat, locationlong, papername, postofficeid, ordererid, 0])

    res.json({
      success: true
    })
  } catch (error) {
    res.json({
      success: false
    })
  }
})

app.get("/getallpapers/:username/:password", async (req, res) => {
  try {
    let { username, password } = req.params

    let ordererid = await (await client.query("SELECT * FROM ordereruser WHERE username = $1 AND password = $2;", [username, password])).rows[0].id

    let papers = await (await client.query("SELECT * FROM ordereruser WHERE ordereruser_id = $1;", [ordererid])).rows

    res.json({
      papers: papers,
      success: true
    })
  } catch (error) {
    res.json({
      papers: [],
      success: false
    })
  }
})

app.post("/addpaper/:username/:password/:papername", async (req, res) => {
  try {
    
    let { username, password, papername } = req.params
    
    let ordererid = await (await client.query("SELECT * FROM ordereruser WHERE username = $1 AND password = $2;", [username, password])).rows[0].id
    
    await client.query("INSERT INTO pap")
    
    res.json({
      success: true
    })
  } catch (error){
    res.json({
      success: false
    })
  }
}

app.put("/adddeliverusertopaper/:username/:postofficename", (req, res) => {
    try {

        let { username, postofficename } = req.params
        
        let ordererid = await (await client.query("SELECT * FROM ordereruser WHERE username = $1 AND password = $2;", [username, password])).rows[0].id

        client.query("UPDATE papertodeliver SET deliver_id)

        res.json({
            success: true
        })
    } catch (error){
        res.json({
            success: false 
        })
    }
})

// CREATE TABLE ordereruser (postoffice_id INT, username VARCHAR(40), password VARCHAR(40), location VARCHAR(75), houselocationlong FLOAT(20), houselocationlat FLOAT(20), id SERIAL PRIMARY KEY);

app.listen(PORT)
