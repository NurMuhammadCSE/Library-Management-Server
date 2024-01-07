const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const jwt = require("jsonwebtoken");
const port = process.env.PORT || 5000;
const app = express();

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.cai2g.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

const verifyJWT = (req, res, next) => {
  // console.log("Hitting jwt");

  // console.log(req.headers.authorization);
  const authorization = req.headers.authorization;
  if (!authorization) {
    return res
      .status(401)
      .send({ error: true, message: "Unauthorized Access" });
  }

  const token = authorization.split(" ")[1];
  // console.log(token);
  jwt.verify(token, process.env.ACCESS_SECRET_TOKEN, (error, decoded) => {
    if (error) {
      return res.send({ error: true, message: "Unauthorized Access" });
    }
    req.decoded = decoded;
    next();
  });
};

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const bookCollections = client.db("library").collection("books");
    const testimonialCollections = client
      .db("library")
      .collection("testimonials");
    const borrowBookCollections = client
      .db("library")
      .collection("borrowBooks");

    app.post("/jwt", async (req, res) => {
      const user = req.body;
      // console.log(user);
      const token = jwt.sign(user, process.env.ACCESS_SECRET_TOKEN, {
        expiresIn: "1h",
      });
      res.send({ token });
    });

    app.get("/allBorrowBooks", verifyJWT, async (req, res) => {
      // console.log(req.headers.authorization)
      // your token but you want to another data
      const decoded = req.decoded;
      if (decoded.email !== req.query.email) {
        return res.send({ error: 1, message: "Forbidden Access" });
      }

      let query = {};
      if (req.query?.email) {
        query = { email: req.query.email };
      }
      const result = await borrowBookCollections.find(query).toArray();
      res.send(result);
    });

    app.get("/allBooks", async (req, res) => {
      const query = {};
      const options = {
        sort: {
          rating: -1,
        },
      };
      const result = await bookCollections.find(query, options).toArray();
      res.send(result);
    });

    app.get("/allBooksCount", async (req, res) => {
      const count = await bookCollections.estimatedDocumentCount();
      res.send({ count });
    });

    app.get("/testimonials", async (req, res) => {
      const result = await testimonialCollections.find().toArray();
      res.send(result);
    });

    app.post("/addBook", async (req, res) => {
      const book = req.body;
      const result = await bookCollections.insertOne(book);
      res.send(result);
    });

    app.delete("/returnBorrowBook/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };

      const result = await borrowBookCollections.deleteOne(query);
      res.send(result);
    });

    app.delete("/deleteBook/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };

      const result = await bookCollections.deleteOne(query);
      res.send(result);
    });

    app.get("/categories", async (req, res) => {
      const result = await bookCollections.find().toArray();
      // Create a set of unique categories
      const uniqueCategories = new Set();
      const uniqueBooks = result.filter((book) => {
        if (!uniqueCategories.has(book.category)) {
          uniqueCategories.add(book.category);
          return true;
        }
        return false;
      });

      // Extract category, image, and id
      const uniqueData = uniqueBooks.map((book) => ({
        category: book.category,
        image: book.image,
        id: book._id,
      }));

      res.send(uniqueData);
    });

    app.get("/:category", async (req, res) => {
      const { category } = req.params;
      const query = { category: category };
      // console.log(category);
      const result = await bookCollections.find(query).toArray();
      res.send(result);
    });

    app.get("/details/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await bookCollections.findOne(query);
      res.send(result);
    });

    app.get("/updateBook/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await bookCollections.findOne(query);
      res.send(result);
    });
    app.put("/updateBook/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const book = req.body;
      const options = { upsert: true };
      // Specify the update to set a value for the plot field

      const updateDoc = {
        $set: {
          name: book.name,
          image: book.image,
          category: book.category,
          author: book.author,
          rating: parseFloat(book.rating),
        },
      };
      const result = await bookCollections.updateOne(query, updateDoc, options);
      res.send(result);
    });

    app.get("/borrowBooks/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      // const email = req.params
      // const query = {email : email}
      const result = await borrowBookCollections.findOne(query);
      // console.log(result);
      res.send(result);
    });

    app.post("/borrowBook", async (req, res) => {
      const body = req.body;
      const result = await borrowBookCollections.insertOne(body);
      res.send(result);
    });

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

app.get("/", (req, res) => {
  res.send("Library is here");
});

app.listen(port, () => {
  console.log(`Library is Coming Soon....... ${port}`);
});
