const express = require('express');
const { MongoClient, ObjectId} = require('mongodb');
const cors = require('cors');
require('dotenv').config();

const app = express();

const URI = process.env.MONGO_URI;
const PORT = process.env.PORT_NUMBER;
const DB = process.env.DB;
const COL_TUT = process.env.COLLECTION_TUTORS;
const COL_USER = process.env.COLLECTION_USER;
const COL_BK = process.env.COLLECTION_BOOK;


let db,col_tut, col_user, col_bk;

app.use(cors());
app.use(express.json());


MongoClient.connect(URI).then(async (client) => {
    console.log('Successfully connected to MongoDB');
    db = client.db(DB);
    col_tut = db.collection(COL_TUT);
    col_user = db.collection(COL_USER);
    col_bk = db.collection(COL_BK);
}).catch((err) => console.error(err));


//get all tutors from tutor collection
app.get('/tutors', async(req,res) => {
    if(!col_tut) {
        console.warn("Tutors collection is empty! This could indicate a problem.");
        return res.status(500).json({issue: "Contact was succesful. Tutor collection is empty or internal server error."})  
    }
    try {
        const tutors = await col_tut.find().toArray(); //return contents of tutor collection as an array.
        res.status(200).json(tutors)
    }
    catch(e) {
        console.error(e)
    }
})
app.post('/booking', async(req,res) => {
    try {
        const entry = req.body;
        const result = await col_bk.insertOne(entry);
        const latest_entry = await col_bk.findOne({_id: result.insertId});
        res.status(200).json(latest_entry);
    } catch(e) {
        console.log("Internal Server Error: " + e);
        res.status(500).json({error: "Something went wrong, but that's on us. Sorry lol."})
    }
})
app.get('/get-bookings', async(req, res) => {
    try {
        const bookings = await col_bk.find().toArray();
        return res.status(200).json(bookings)
    }
    catch(e) {
        console.log("Internal Server Error: " + e)
        res.status(500).json({error: "Something went wrong, but that's on us. Sorry lol."})
    }
})
app.get('/settings', async(req, res) => {
    try{
        const settings = await col_user.findOne(); //in production, there is only one user. In real application, this would instead look for find({_id: id}) (passed through params)
        return res.status(200).json(settings);
    } catch(e) {
        console.error("Something went wrong " + e);
        res.status(500).json({error: "Something went wrong internally"});
    }
})

app.put('/user/:id', async(req, res) => {
    try {
        const { id } = req.params;

        if (!ObjectId.isValid(id)) {
            return res.status(400).json({ error: 'Invalid user ID format' });
        }
        const { user } = req.body;

        const event = await col_user.updateOne({_id: new ObjectId(id)} , {$set: {
            "user.first" : user.first,
            "user.last" : user.last
        }});

        if(event.matchedCount === 0) {
            return res.status(400).json({error: "User not found. Please try again"})
        }
        res.status(200).json({message : "User updated successfully!"});
    } catch(e) {
        console.log("Internal Server Error " + e);
        res.status(500).json({error: "Something went wrong, but its on us. Sorry lol"});
    }
});

app.put('/update-book/:id', async (req, res) => {
    try {
        const { id } = req.params;

        if (!ObjectId.isValid(id)) {
            return res.status(400).json({ error: "Invalid ID. Either it doesn't exist, or the format is wrong!" });
        }

        const { name } = req.body;

        if (!name) {
            return res.status(400).json({ error: "Name is required for update." });
        }

        const booking_change = await col_bk.updateOne(
            { _id: new ObjectId(id) },
            { $set: { "tutor.name": name } }
        );

        if (booking_change.matchedCount === 0) {
            return res.status(404).json({ error: "Booking not found or no changes made." });
        }

        if (booking_change.modifiedCount === 0) {
            return res.status(304).json({ message: "No changes were made." });
        }

        res.status(200).json({ message: "Booking updated successfully." });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Internal Server Error." });
    }
});
app.delete('/bookings/:id', async(req, res) => {
    try{
        const {id} = req.params;
        const result = await col_bk.deleteOne({_id : new ObjectId(id)});

        if(result.deletedCount === 0) {
            return res.status(400).json({error : "Unable to satisy Delete reques"});
        }
        res.status(200).json({message: "Successfully deleted entry"});
    } catch(e) {
        console.log("Something went wrong internally " + e)
        res.status(500).json({error: "Something went wrong, but that's on us. Sorry lol."})
    }
})

app.listen(PORT, () => {
    console.log(`App is listening to PORT: ${PORT}`);
});
