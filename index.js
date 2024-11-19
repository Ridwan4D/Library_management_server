const express = require("express");
const cors = require("cors");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 8000;

app.use(express.json());
app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:5174"],
  })
);

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = `mongodb+srv://${process.env.MONGODB_USER}:${process.env.MONGODB_PASS}@cluster0.yyjvuyt.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const bookCollection = client
      .db("rtLibraryManagementSystem")
      .collection("allBooks");
    const categoryCollection = client
      .db("rtLibraryManagementSystem")
      .collection("categories");
    const borrowBookCollection = client
      .db("rtLibraryManagementSystem")
      .collection("borrowBooks");

    // ========================================   books collection start    ========================================
    app.get("/books", async (req, res) => {
      const result = await bookCollection.find().toArray();
      res.send(result);
    });

    app.post("/books", async (req, res) => {
      const bookInfo = req.body;
      const result = await bookCollection.insertOne(bookInfo);
      res.send(result);
    });

    app.put("/books/:id", async (req, res) => {
      const id = req.params.id;
      const bookInfo = req.body;
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updateBook = {
        $set: {
          image: bookInfo.image,
          book: bookInfo.book,
          author: bookInfo.author,
          bookCategory: bookInfo.bookCategory,
          rating: bookInfo.rating,
          quantity: bookInfo.quantity,
          bookDescription: bookInfo.bookDescription,
        },
      };
      const result = await bookCollection.updateOne(
        filter,
        updateBook,
        options
      );
      res.send(result);
    });
    
    app.patch("/books/:id", async (req, res) => {
      const id = req.params.id;
      const quantityInfo = req.body;
      const filter = { _id: new ObjectId(id) };
      const updateBook = {
        $set: {
          quantity: quantityInfo,
        },
      };
      const result = await bookCollection.updateOne(filter, updateBook);
      res.send(result);
    });
    // ========================================   books collection end    ========================================

    // ========================================   category collection start    ========================================
    app.get("/categories", async (req, res) => {
      const result = await categoryCollection.find().toArray();
      res.send(result);
    });

    app.post("/categories", async (req, res) => {
      const bookInfo = req.body;
      const result = await categoryCollection.insertOne(bookInfo);
      res.send(result);
    });
    // ========================================   category collection end    ========================================

    // ========================================   borrow collection start    ========================================
    app.get("/borrowBooks", async (req, res) => {
      const result = await borrowBookCollection.find().toArray();
      res.send(result);
    });
    app.post("/borrowBooks", async (req, res) => {
      const borrowInfo = req.body;
      const result = await borrowBookCollection.insertOne(borrowInfo);
      res.send(result);
    });
    // ========================================   borrow collection end    ========================================

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", async (req, res) => {
  res.send("Library Management server is running");
});

app.listen(port, () => {
  console.log(`Library Management Server is running on port: ${port}`);
});
