const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const verifyJwt = require("./jwt");
require("dotenv").config();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
//console.log(process.env.STRIPE_SECRET_KEY);
// middle wares
const app = express();
app.use(cors());
app.use(express.json());

//port
const PORT = process.env.PORT || 5000;

//Mongodb

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.tfzr2.mongodb.net/${process.env.DB_Name}?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

//router function

const userCollection = client.db("IMS").collection("user");
const categoryCollection = client.db("IMS").collection("category");
const productCollection = client.db("IMS").collection("product");
const orderCollection = client.db("IMS").collection("orders");
const paymentsCollection = client.db("IMS").collection("payment");

app.post("/api/user/register", async (req, res) => {
  try {
    const user = req.body;
    //console.log(user);
    const loginUser = await userCollection.findOne({
      email: user.email,
    });
    //console.log(loginUser);
    if (!loginUser) {
      await userCollection.insertOne(user);
      const findNewUser = await userCollection.findOne({
        email: user.email,
      });
      // console.log(findNewUser);
      const payload = {
        user: {
          email: user.email,
        },
      };
      const token = jwt.sign(payload, process.env.JWT_SECRETE, {
        expiresIn: "1d",
      });
      res.status(200).send({
        msg: "Registration Successfully",
        token: token,
        user: findNewUser,
      });
      // console.log(result);
    } else {
      const payload = {
        user: {
          email: user.email,
        },
      };
      const token = jwt.sign(payload, process.env.JWT_SECRETE, {
        expiresIn: "1d",
      });
      res.status(200).send({
        msg: "Registration Successfully",
        token: token,
        user: loginUser,
      });
    }
  } catch (err) {
    res.status(400).send({ error: err.massage });
  }
});
//user post login router
app.post("/api/user/login", async (req, res) => {
  try {
    const user = req.body;
    // console.log(user);
    const loginUser = await userCollection.findOne({
      email: user.email,
    });
    const payload = {
      user: {
        email: user.email,
      },
    };
    const token = jwt.sign(payload, process.env.JWT_SECRETE, {
      expiresIn: "1d",
    });
    res.status(200).send({
      msg: `Login by ${loginUser.name}`,
      token: token,
      user: loginUser,
    });
  } catch (err) {
    res.status(400).send({ error: err.massage });
  }
});
//all user
// app.get("/api/all-user/:id", async (req, res) => {
//   const id = req.params.id;
//   const allUser = await userCollection.findOne({
//     _id: ObjectId(id),
//   });
//   //console.log(allUser);
//   res.status(200).send({ user: allUser });
// });

//all buyer
app.get("/api/all-buyer", async (req, res) => {
  const allBuyer = await userCollection
    .find({
      rol: "buyer",
    })
    .toArray();
  res.status(200).send({ buyer: allBuyer });
});
//buyer delete
app.delete("/api/all-buyer/:id", async (req, res) => {
  const id = req.params.id;
  await userCollection.deleteOne({
    _id: ObjectId(id),
  });
  res.status(200).send({ msg: "Deleted" });
});
//all seller
app.get("/api/all-seller", verifyJwt, async (req, res) => {
  const allSeller = await userCollection
    .find({
      rol: "seller",
    })
    .toArray();
  res.status(200).send({ seller: allSeller });
});
//seller delete
app.delete("/api/all-seller/:id", async (req, res) => {
  const id = req.params.id;
  await userCollection.deleteOne({
    _id: ObjectId(id),
  });
  res.status(200).send({ msg: "Deleted" });
});
//seller verified
app.patch("/api/all-seller/:id", async (req, res) => {
  const id = req.params.id;
  const isVerify = req.body.isVerify;
  const query = { _id: ObjectId(id) };

  // const allProduct = await productCollection
  //   .find({
  //     userId: id,
  //   })
  //   .toArray();
  const query1 = { userId: id };

  const updatedUser = {
    $set: {
      verified: isVerify,
    },
  };
  await userCollection.updateOne(query, updatedUser);
  await productCollection.updateMany(query1, updatedUser);
  res.status(200).send({ msg: isVerify });
});
//ads run
app.patch("/api/seller/ads/:id", async (req, res) => {
  const id = req.params.id;
  const ads = req.body.ads;
  // console.log(ads);
  const query = { _id: ObjectId(id) };
  const updatedUser = {
    $set: {
      ads: ads,
    },
  };
  await productCollection.updateOne(query, updatedUser);
  res.status(200).send({ msg: ads });
});
//reported api
app.patch("/api/user/report/:id", async (req, res) => {
  const id = req.params.id;
  const query = { _id: ObjectId(id) };
  const updatedUser = {
    $set: {
      reported: true,
    },
  };
  await productCollection.updateOne(query, updatedUser);
  res.status(200).send({ msg: "Reported Item" });
});
//category
app.post("/api/category", async (req, res) => {
  try {
    const category = req.body;

    const existCategory = await categoryCollection.findOne({
      category: category.category,
    });
    if (existCategory) {
      res.status(200).send({ error: "Already have a Category" });
    } else {
      await categoryCollection.insertOne(category);
      res.status(200).send({
        msg: "Category Added",
      });
    }
  } catch (err) {
    res.status(400).send({ error: err.massage });
  }
});
app.get("/api/category", async (req, res) => {
  try {
    const catagortList = await categoryCollection.find({}).toArray();
    res.status(200).send({ category: catagortList });
  } catch (err) {
    res.status(400).send({ error: err.massage });
  }
});
app.post("/api/product", async (req, res) => {
  const product = req.body;
  //console.log(product);
  await productCollection.insertOne(product);
  res.status(200).send({ msg: "Product Added" });
});
app.get("/api/all-product", async (req, res) => {
  const allProduct = await productCollection.find({}).toArray();
  res.status(200).send({ product: allProduct });
});
//category product
app.get("/api/category/:id", async (req, res) => {
  const id = req.params.id;
  //console.log(id);

  const category = await categoryCollection.findOne({
    _id: ObjectId(id),
  });
  //console.log(category.category);

  const allProduct = await productCollection
    .find({ category: category.category })
    .toArray();
  //console.log(allProduct);
  res.status(200).send({ product: allProduct });
});
//category delete
app.delete("/api/category/:id", async (req, res) => {
  const id = req.params.id;
  //console.log(id);
  const category = await categoryCollection.findOne({
    _id: ObjectId(id),
  });
  //console.log(category.category);
  await productCollection.deleteMany({ category: category.category });
  await orderCollection.deleteMany({
    productCategpry: category.category,
  });
  await categoryCollection.deleteOne({
    _id: ObjectId(id),
  });

  res.status(200).send({ msg: "deleted category" });
});
//my product
app.get("/api/product/:id", async (req, res) => {
  const id = req.params.id;
  // console.log(id);

  const myProduct = await productCollection
    .find({
      userId: id,
    })
    .toArray();
  res.status(200).send({ product: myProduct });
});
app.delete("/api/product/:id", async (req, res) => {
  const id = req.params.id;
  // console.log(id);
  try {
    await productCollection.deleteOne({
      _id: ObjectId(id),
    });
    await orderCollection.deleteOne({
      ProductId: id,
    });
    res.status(200).send({ msg: "Deleted" });
  } catch (err) {
    res.status(400).send({ error: err.massage });
  }
});
app.post("/api/order", async (req, res) => {
  const order = req.body;
  //console.log(product);
  await orderCollection.insertOne(order);
  res.status(200).send({ msg: "Added! Go to Dashboard and pay fast" });
});
//my order
app.get("/api/all-order", async (req, res) => {
  const allOrder = await orderCollection.find({}).toArray();
  res.status(200).send({ order: allOrder });
});
//single order
app.get("/api/single/order/:id", async (req, res) => {
  const id = req.params.id;
  const singleOrder = await orderCollection.findOne({
    _id: ObjectId(id),
  });
  res.status(200).send({ order: singleOrder });
});
app.get("/api/self-order/:id", verifyJwt, async (req, res) => {
  const id = req.params.id;
  const myOrder = await orderCollection
    .find({
      buyerId: id,
    })
    .toArray();
  res.status(200).send({ myOrder: myOrder });
});
app.delete("/api/self-order/:id", async (req, res) => {
  const id = req.params.id;
  await orderCollection.deleteOne({
    buyerId: id,
  });
  res.status(200).send({ msg: "Deleted" });
});

//test api
app.get("/", (req, res) => {
  res.status(200).send("I am server!");
});

//payment
app.post("/api/create-payment-intent", async (req, res) => {
  const price = req.body.soldPrice;
  //console.log(price);
  const amount = parseInt(price) * 100;

  const paymentIntent = await stripe.paymentIntents.create({
    currency: "usd",
    amount: amount,
    payment_method_types: ["card"],
  });
  res.send({
    clientSecret: paymentIntent.client_secret,
  });
});
app.post("/api/payments", async (req, res) => {
  const payment = req.body;
  const result = await paymentsCollection.insertOne(payment);
  const id = payment.ProductId;
  const query = { _id: ObjectId(id) };
  const query1 = { ProductId: id };
  const updatedDoc = {
    $set: {
      payment: true,
      transactionId: payment.transactionId,
    },
  };
  await productCollection.updateOne(query, updatedDoc);
  await orderCollection.updateOne(query1, updatedDoc);
  res.send({ msg: "Payment successfuly" });
});

app.listen(PORT, () => {
  console.log(`server is running on port ${PORT}`);
});
