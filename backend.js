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

// app.get

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

    let user = await (await client.query("SELECT * FROM ordereruser WHERE username = $1 AND password = $2;", [username, password]))

    if (user.rows.length > 0){

      let postofficename = await (await client.query("SELECT * FROM postofficeuser WHERE user_id = $1;", [user.rows[0].postoffice_id])).rows[0].postofficename

      res.json({
        accountexists: true,
        success: true, 
        postofficename: postofficename
      })
    } else {
      res.json({
        accountexists: false,
        success: false,
        postofficename: ""
      })
    }
  } catch (error) {
    res.json({
      success: false,
      postofficename: ""
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

app.get("/getallpapers/:username/:password", async (req, res) => {
  try {
    let { username, password, } = req.params

    let ordereruser = await (await client.query("SELECT * FROM ordereruser WHERE username = $1 AND password = $2;", [username, password])).rows[0]

    let papers = await (await client.query("SELECT * FROM papertodeliver WHERE ordereruser_id = $1;", [ordereruser.id])).rows

    let paperids = await (await client.query("SELECT paper_id FROM papertodeliver WHERE ordereruser_id = $1 AND postoffice_id = $2;", [ordereruser.id, ordereruser.postoffice_id])).rows

    for (let i = 0; i < paperids.length; i++){

      for (let j = 0; j < papers.length; j++){
        if (paperids[i].paper_id === papers[j].paper_id){
          papers[j].days = await (await client.query("SELECT day FROM daystodeliver WHERE paper_id = $1;", [paperids[i].paper_id])).rows
          break
        }
      }
    }

    res.json({
      papers: papers,
      success: true
    })
  } catch (error) {
    console.error(error)

    res.json({
      papers: [],
      days: [],
      success: false
    })
  }
})

app.post("/addpaper/:username/:password/:papername", async (req, res) => {
  try {
    
    let { username, password, papername } = req.params
    let { days } = req.body
    
    let ordereraccount = await (await client.query("SELECT * FROM ordereruser WHERE username = $1 AND password = $2;", [username, password])).rows[0]
    
    console.log(await (await client.query("SELECT * FROM paperprice WHERE papername = $1 AND postoffice_id = $2;", [papername, 2])).rows.length >= 1)

    if (await (await client.query("SELECT * FROM paperprice WHERE papername = $1 AND postoffice_id = $2;", [papername, 2])).rows.length >= 1){
      let paperid = await (await client.query("INSERT INTO papertodeliver (houselocationlat, houselocationlong, location, ordereruser_id, papername, postoffice_id, deliver_id, cancelpaper) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING paper_id;", [
        ordereraccount.houselocationlat,
        ordereraccount.houselocationlong,
        ordereraccount.location,
        ordereraccount.id,
        papername,
        ordereraccount.postoffice_id,
        0,
        false
      ])).rows[0].paper_id

      console.log(paperid)

      for (let i = 0; i < days.length; i++){
        let key = Object.keys(days[i])
        console.log(key[0])
        console.log(days[i][key[0]])

        if (days[i][key[0]]){
          await client.query("INSERT INTO daystodeliver (paper_id, day) VALUES ($1, $2);", [
            paperid,
            key[0]
          ])
        }
      }
    }
    
    res.json({
      success: true
    })
  } catch (error){

    console.log(error)

    res.json({
      success: false
    })
  }
})

app.put("/changepaperstatus/:username/:password/:papername", async (req, res) => {
  try {
    
    let { username, password, papername } = req.params

    let { postoffice_id, id } = await (await client.query("SELECT * FROM ordereruser WHERE username = $1 AND password = $2;", [username, password])).rows[0]

    console.log(await (await client.query("SELECT * FROM papertodeliver WHERE ordereruser_id = $1;", [id])).rows[0])

    let ispapercencel = await (await client.query("SELECT * FROM papertodeliver WHERE ordereruser_id = $1 AND papername = $2;", [id, papername])).rows[0].cancelpaper

    client.query("UPDATE papertodeliver SET cancelpaper = $1 WHERE ordereruser_id = $2 AND papername = $3;", [
      !ispapercencel,
      id,
      papername
      ]) 

    res.json({
      success: true
    })
  } catch (error) {
    res.json({
      success: false
    })
  }
})

app.put("/adddeliverusertopaper/:username/:postofficename", async (req, res) => {
  try {

      let { 
        username, 
        postofficename 
      } = req.params
      
      let postofficeid
      let deliverid
  
      let message = {
        success: true,
        wrongpostofficeuser: false,
        wrongdeliveruser: false
      }

      try {
        deliverid = await (await client.query("SELECT * FROM deliveruser WHERE username = $1;", [username])).rows[0].user_id
      } catch (error) {
        message.success = false
        message.wrongdeliveruser = true
      }

      try {
        postofficeid = await (await client.query("SELECT * FROM postofficeuser WHERE postofficename = $1;", [postofficename])).rows[0].user_id
      } catch (error) {
        message.success = false
        message.wrongpostofficeuser = true
      }

      if (!message.wrongpostofficeuser && !message.wrongdeliveruser){
        client.query("UPDATE papertodeliver SET deliver_id = $1 WHERE postoffice_id = $2;", [
          deliverid,
          postofficeid
        ])
      }

      res.json(message)
  } catch (error){

      console.error(error)

      res.json({
          success: false 
      })
  }
})

app.get("/getalldaysforpaper/:username/:papername/:postofficeid", async (req, res) => {
  try {
    let { username, papername, postofficeid } = req.params

    // let postofficeid = await (await client.query("SELECT * FROM postofficeuser WHERE postofficename = $1;", [postofficename])).rows[0].user_id

    let orderid = await (await client.query("SELECT * FROM ordereruser WHERE username = $1;", [username])).rows[0].id

    let paperid = await (await client.query("SELECT * FROM papertodeliver WHERE ordereruser_id = $1 AND postoffice_id = $2 AND papername = $3;", [orderid, postofficeid, papername])).rows[0].paper_id

    let days = await (await client.query("SELECT day FROM daystodeliver WHERE paper_id = $1;", [paperid])).rows

    res.json({
      success: true,
      days: days
    })
  } catch (error) {

    console.error(error)

    res.json({
      success: false
    })
  }
})

app.get("/paperexist/:papername/:postofficename", async (req, res) => {

  try {

    let { papername, postofficename } = req.params

    
    try {
      let postofficeid

      postofficeid = await (await client.query("SELECT * FROM postofficeuser WHERE postofficename = $1;", [postofficename])).rows[0].user_id
      
      let paperprice = await (await client.query("SELECT * FROM paperprice WHERE papername = $1 AND postoffice_id = $2;", [papername, postofficeid])).rows
      
      console.log(paperprice)

      res.json({
        success: true,
        paperexist: paperprice.length >= 1
      })
    } catch (error) {
      // postofficeid = 0
      res.json({
        success: false,
        paperexist: false
      })
    }

  } catch (error) {

    console.error(error)

    res.json({
      success: false
    })
  }
})

app.get("/getdaysforpaper/:papername/:postofficename", async (req, res) => {
   
  try {
    try {

      let { papername, postofficename } = req.params

      let postofficeid = await (await client.query("SELECT * FROM postofficeuser WHERE postofficename = $1;", [postofficename])).rows[0].user_id
      
      let days = await (await client.query("SELECT day FROM dayspapercanbedelivered WHERE postoffice_id = $1 AND papername = $2;", [postofficeid, papername])).rows

      console.log(days)

      res.json({
        success: true,
        days: days
      })
    } catch (error) {
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

app.post("/adddayforpaper/:papername/:day/:postofficename", async (req, res) => {
  
  try {
    try {

      let { papername, day, postofficename } = req.params

      let postofficeid = await (await client.query("SELECT * FROM postofficeuser WHERE postofficename = $1;", [postofficename])).rows[0].user_id
      
      await (await client.query("INSERT INTO dayspapercanbedelivered (day, papername, postoffice_id) VALUES ($1, $2, $3);", [day, papername, postofficeid]))

      res.json({
        success: true
      })
    } catch (error) {
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

app.get("/getallpaperdays/:postofficename/:username", async (req, res) => {
  
  try {
    
     let ordereruser = await (await client.query("SELECT * FROM ordereruser WHERE username = $1;")).rows[0]
    
     let dayspapercanbedelivered = await (await client.query("SELECT * FROM dayspapercanbedelivered WHERE postoffice_id = $1;", [ordereruser.postoffice_id]))
     
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

app.listen(PORT, () => {
  console.log("running on port: " + PORT)
})
