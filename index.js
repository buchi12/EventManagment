const express = require('express');
const { ObjectId, MongoClient } = require('mongodb');
const cors = require('cors');
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const app = express();


app.use(express.json());
app.use(cors());

let client;
const initializeDBAndServer = async () => {
  

    
    const uri = `mongodb+srv://buchichowdary2002:sevika123@cluster0.omrg6a6.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

    client = new MongoClient(uri);


    try {
        await client.connect();
        console.log("Connected to MongoDB.....");
        app.listen(3001, ﻿() => {
            console.log('Server running on port: 3000');
        });
    } catch (error) {
        console.error("Error connecting to MongoDB:", error);
        process.exit(1);
    }
};

initializeDBAndServer();

const authenticateToken = (request, response, next) => {
    let jwtToken;
    const authHeader = request.headers["authorization"];
    if (authHeader !== undefined) {
        jwtToken = authHeader.split(" ")[1];
    }
    if (jwtToken === undefined) {
        response.status(401);
        response.send("Invalid JWT Token");
    } else {
        // Replace 'MY_SECRET_TOKEN' with your JWT secret key
        jwt.verify(jwtToken, "MY_SECRET_TOKEN", async (error, payload) => {
            if (error) {
                response.status(401);
                response.send({ "Invalid JWT Token": error });
            } else {
                request.userId = payload.userId;
                next();
            }
        });
    }
};

app.post('/register', async (request, response) => {
    try {
        // Replace 'database' with your database name and 'collection' with your collection name
        const collection = client.db('database').collection('collection'); 
        const userDetails = request.body; 
        const { email } = userDetails;
        const isUserExist = await collection.find({ email }).toArray();
        if (isUserExist.length === 0) {
            const hashedPassword = await bcrypt.hash(userDetails.password, 10);
            userDetails.password = hashedPassword;
            const result = await collection.insertOne(userDetails);
            response.status(200)
            response.send({ yourId: result.insertedId, message: "User registered successfuly" });
        } else {
            response.status(401);
            response.send({ errorMsg: 'User with this Email ID already exists' })
        }
    } catch (error) {
        response.status(500)
        response.send({ "Internal server error:": error });
    }
});

app.post('/login', async (request, response) => {
    try {
        // Replace 'database' with your database name and 'collection' with your collection name
        const collection = client.db('database').collection('collection'); 
        const userDetails = request.body;
        const { email, password } = userDetails;
        const isUserExist = await collection.findOne({ email });
        if (!isUserExist) {
            response.status(401)
            response.send({ errorMsg: "User with this Email ID doesn't exist" });
            return;
        }
        const isPasswordMatched = await bcrypt.compare(password, isUserExist.password);
        if (isPasswordMatched) {
            // Replace 'MY_SECRET_TOKEN' with your JWT secret key
            const token = jwt.sign({ userId: isUserExist._id }, "MY_SECRET_TOKEN");
            response.status(200)
            response.send({ jwtToken: token, userId: isUserExist._id });
        } else {
            response.status(401)
            response.send({ errorMsg: "Incorrect password" });
        }
    } catch (error) {
        response.status(500)
        response.send({ "Internal server error:": error });
    }
});

// app.use('/login',loginRouter)
// app.use('/register',registerRouter)
////// events post dada////

app.post('/events', async (req, res) => {
    try {
        // Replace 'database' with your actual database name
        // Replace 'events' with the name of your collection
        const collection = client.db('database').collection('collection');

        const eventData = req.body;  // The event data sent from the frontend
        const result = await collection.insertOne(eventData);

        res.status(201).send({ message: 'Event created successfully', eventId: result.insertedId });
    } catch (error) {
        console.error('Error creating event:', error);
        res.status(500).send({ errorMsg: 'Internal server error' });
    }
});


/// getting all events data 

app.get('/events', async (req, res) => {
    try {
       
        const collection = client.db('database').collection('collection');
        const events = await collection.find({}).toArray();
        res.status(200).send(events);
    } catch (error) {
        console.error('Error fetching events:', error);
        res.status(500).send({ errorMsg: 'Internal server error' });
    }
});



