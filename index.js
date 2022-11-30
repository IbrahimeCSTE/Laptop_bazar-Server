const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

//port
const PORT = process.env.PORT || 5000;
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.tfzr2.mongodb.net/${process.env.DB_Name}?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});
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
app.listen(PORT, () => {
  console.log(`server is running on port ${PORT}`);
});
