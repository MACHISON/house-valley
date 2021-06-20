const path = require('path');
const express = require('express'); // tool for creating HTTP server
const dotenv = require('dotenv'); // global variables
const cors = require('cors'); // Cross-origin resource sharing
const connectDB = require('./scripts/config/db');
const bodyParser = require("body-parser");


//load environment variables
dotenv.config({path: 'scripts/config/config.env'});

//Connect database
connectDB();

const app = express();
//Body parser
app.use(express.json());

//Enable cors
app.use(cors());

// Static folders
app.use(express.static(path.join(__dirname, 'public/')))

//Routes 
app.use('/api/v1/apartments', require('./routes/apartments'))



//--------Search apartments--------------------------------
//create data schema - probabil nu mai trebuie la nimic, dar las sa fie ca bucura ochiul
// Credits: AndreeaCvl

app.use(express.urlencoded({extended: false}));
app.use(express.json());

let region;
let offert;
let additional;

//app.post
app.post("/", function(req, res) {
    //BREEED
    var date = req.body.region;
    reg = date.split(", ");
    date = req.body.offert;
    ofrt = date.split(", ");
    date = req.body.additional;
    additional = date.split(", ");

    //MODIF
        if (reg == "") reg = [ "Botanica", "Buiucani", "Centru", "Ciocana", "Riscani"]
        if (ofrt =="") ofrt = ["buy", "rent"]
        //if (additional == "") additional = [ "Internet", "Electricity", "Heating", "Telephone line", "Alarm System", "Elevator", "Parking lot"]
        console.log(reg, " ", ofrt, " ", additional);
    //END

    res.redirect("/");

//NEWCODE

    const { MongoClient } = require("mongodb");
    const uri = process.env.MONGO_URI;
    const client = new MongoClient(uri);
    async function run() {
    try {
        await client.connect();
        const database = client.db("ME_project");
        const apartments = database.collection("apartments");
        var query;
        if (additional == "") {
            additional = [ "Internet", "Electricity", "Heating", "Telephone line", "Alarm System", "Elevator", "Parking lot"]
             query = { region: {$in:  reg}, offert: {$in: ofrt}, utilities: { $in: additional } };
        }
        else {
             query = { region: {$in:  reg}, offert: {$in: ofrt}, utilities: { $all: additional } };
        }
        const options = {
        sort: { region: 1 }
    };
    
    const apartment = apartments.find(query, options);
    
    if ((await apartment.count()) === 0) {
        console.log("No documents found!");
       // window.alert("No documents found!");
    }
    // replace console.dir with your callback to access individual elements
    await apartment.forEach(console.dir);
    } finally {
        await client.close();
    }
  }
  run().catch(console.dir);
//STOP
})


//-----------------------------------------------
const PORT = process.env.PORT || 5000;

app.listen(PORT, ()=>console.log(`Server running in ${process.env.NODE_ENV}
         mode on port ${PORT}`));