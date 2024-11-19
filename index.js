const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 8000;

app.use(express.json());
app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:5174"],
    credentials: true,
  })
);
app.use(cookieParser());

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

const logger = (req, res, next) => {
  console.log("log info:", req.method, req.url);
  next();
};

const verifyToken = (req, res, next) => {
  const token = req?.cookies?.token;
  // console.log("Token in middleware:", token);
  if (!token) {
    return res.status(401).send({ message: "unauthorized access" });
  }
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (error, decoded) => {
    if (error) {
      return res.status(401).send({ message: "unauthorized access" });
    }
    req.user = decoded;
    next();
  });
};

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

    // ========================================   jwt api collection start    ========================================
    app.post("/jwt", async (req, res) => {
      const user = req.body;
      // console.log(user);
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "1h"
      });
      res
        .cookie("token", token, {
          httpOnly: true,
          secure: true,
          sameSite: "none",
        })
        .send({ success: true });
    });

    app.post("/logout", async (req, res) => {
      const user = req.body;
      console.log("logging out", user);
      res.clearCookie("token", { maxAge: 0 }).send({ success: true });
    });
    // ========================================   jwt api collection end    ========================================

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
      const updateQuantity = req.body;
      const filter = { _id: new ObjectId(id) };
      const updateBook = {
        $set: {
          quantity: updateQuantity.quantity,
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
    app.get("/borrowBooks", logger, verifyToken, async (req, res) => {
      console.log("token owner info:", req.user);
      if (req?.user?.email === req.query.email) {
        return res.status(403).send({ message: "forbidden access"});
      }
      const result = await borrowBookCollection.find().toArray();
      res.send(result);
    });
    app.post("/borrowBooks", async (req, res) => {
      const borrowInfo = req.body;
      const result = await borrowBookCollection.insertOne(borrowInfo);
      res.send(result);
    });
    app.delete("/borrowBooks/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await borrowBookCollection.deleteOne(query);
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
