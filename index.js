const express = require('express');
const { MongoClient, ObjectId} = require('mongodb');
const cors = require('cors');
require('dotenv').config();

const app = express();

const URI = process.env.MONGO_URI;
const PORT = process.env.PORT_NUMBER;
const DB = process.env.DB;
const COL_TUT = process.env.COLLECTION_TUTORS;
const COL_STU = process.env.COLLECTION_STUDENTS;
const COL_BK = process.env.COLLECTION_BOOK;


let db,col_tut, col_stu, col_bk;

app.use(cors());
app.use(express.json());


MongoClient.connect(URI).then(async (client) => {
    console.log('Successfully connected to MongoDB');
    db = client.db(DB);
    col_tut = db.collection(COL_TUT);
    col_stu = db.collection(COL_STU);
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
// //u
// app.put('/items/:id', async (req, res) => {
//     try {
//         const { id } = req.params;
//         const update = req.body;

//         // Validate the ObjectId format
//         if (!ObjectId.isValid(id)) {
//             return res.status(400).json({ error: "Invalid ID format" });
//         } else {
//             console.log(id);
//         }

//         // Validate that the update contains a name
//         if (!update.name) {
//             return res.status(400).json({ error: "Update request is invalid. Name is required." });
//         } else {
//             console.log(update);
//         }

//         // Perform the update
//         const result = await col.updateOne({_id : new ObjectId(id)}, {$set: {name: update.name}});

//         if(!result) {
//             return res.status(400).json({UpdateError: "Unable to fulfill update request"})
//         }

//         res.status(200).json(result.value);
//     } catch (err) {
//         console.error("Error updating item:", err);
//         res.status(500).json({ error: "Server failed to respond. Please try again later!" });
//     }
// });

// //d
// app.delete('/items/:id', async(req, res) => {
//     try {
//         const { id } = req.params;
//         const result = await col.deleteOne({_id: new ObjectId(id)});

//         if(result.deletedCount === 0) {
//             return res.status(400).json({error: "Unable to satisfy Delete request.. Please try again later"});
//         }
//         res.status(200).json({message: "Successfully deleted entry"});
//     }catch(err) {
//         console.error("Something went wrong.. Please try again later.")
//         res.status(500).json({error: "Error fulfilling deletion request"});
//     }
// })

app.listen(PORT, () => {
    console.log(`App is listening to PORT: ${PORT}`);
});
