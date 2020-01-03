//=============================== LOAD ALL LIBRARIES ===============================//
let express = require("express");
let multer = require("multer");
let cors = require("cors");
let MongoClient = require("mongodb").MongoClient;
let ObjectID = require("mongodb").ObjectID;
let cookieParser = require("cookie-parser");
let login = require("./login.js");
let cart = require("./cart.js");

//=============================== INITIALIZE LIBRARIES ===============================//
let app = express();
// setting for multer, for now we are saving upload files to local uploads directory
let upload = multer({
  dest: __dirname + "/uploads"
});
app.use("/uploads", express.static("uploads"));
// setting for cors, do not touch, frontend is on localhost3000
app.use(cors({ credentials: true, origin: "http://localhost:3000" }));
app.use(cookieParser());

// settings for mongo
let dbo;
let url =
  "mongodb+srv://lulul:123@cluster0-jjd2c.mongodb.net/test?retryWrites=true&w=majority";
app.use("/", express.static("build"));

MongoClient.connect(url, { useUnifiedTopology: true }, (err, db) => {
  dbo = db.db("AliBay");
});

//=============================== GET ENDPOINTS ===============================//

//=============================== POST ENDPOINTS ===============================//

app.post("/signup", upload.none(), (req, res) => {
  console.log("accessing");
  login.signup(req, res, dbo);
});

app.post("/login", upload.none(), (req, res) => {
  login.login(req, res, dbo);
});

app.post("/auto-login", upload.none(), (req, res) => {
  login.autoLogin(req, res, dbo);
});

//this endpoint is used to check if a username has been taken
app.post("/username-taken", upload.none(), (req, res) => {
  login.usernameTaken();
});

app.post("/add-product", upload.array("files"), (req, res) => {
  console.log("-------------------------------------");
  console.log("Uploaded PRODUCT");
  let media = req.files;
  let productName = req.body.name;
  let sellerId = req.body.sellerName;
  let sellerName = req.body.sellerName;
  let price = req.body.price;
  let descriptionHeader = req.body.descriptionHeader;
  let descriptionText = req.body.descriptionText;
  let location = req.body.location;
  let inventory = req.body.inventory;
  let date = new Date();
  date = date.toLocaleDateString;
  let ratings = {};
  let posts = [];
  let tags = req.body.tags;
  console.log("tags: ", tags);
  tags = tags.split(" ");
  console.log("tags: ", tags);
  let category = req.body.category;
  // console.log(req);
  console.log("-------------------------------------");
  console.log("MEDIA");
  console.log(media);

  if (media.length === 0) {
    console.log("image is default");
    let frontendPath = "/uploads/default.png";
    posts.push(frontendPath);
  } else if (media.length > 0) {
    for (let i = 0; i < media.length; i++) {
      console.log("Uploaded file " + media[i]);
      let frontendPath = "/uploads/" + media[i].filename;
      posts.push(frontendPath);
    }
  }

  // console.log("posts: ", posts);
  //always push default
  //find sellerID from merchants database
  console.log("seller:", sellerId);
  dbo.collection("merchants").findOne({ username: sellerId }, (err, user) => {
    if (err || user === null) {
      console.log("error", err);
      console.log("user ", user);
      return res.send(JSON.stringify({ success: false }));
    }
    console.log("Found user");
    sellerId = user._id;
    dbo.collection("items").insertOne(
      {
        productName,
        sellerId,
        sellerName,
        price: parseFloat(price),
        descriptionHeader,
        descriptionText,
        location,
        inventory: parseInt(inventory),
        date,
        ratings,
        posts,
        tags,
        category
        // featured:"featured"
      },
      (err, item) => {
        dbo
          .collection("merchants")
          .updateOne(
            { _id: ObjectID(sellerId) },
            { $push: { inventory: item.insertedId } }
          );
      }
    );

    return res.send(JSON.stringify({ success: true }));
  });
});

app.post("/rating", upload.none(), (req, res) => {
  console.log("RATING HIT------------------");
  let rating = req.body.rating;
  let id = req.body.id;
  let userId = req.body.userId;
  if (rating > 5 || rating < 1) {
    return res.send(JSON.stringify({ succes: false }));
  }
  dbo.collection("items").findOne({ _id: ObjectID(id) }, (err, item) => {
    console.log("item: ", item);
    let ratings = { ...item.ratings };
    ratings[userId] = parseInt(rating);
    dbo
      .collection("items")
      .findOneAndUpdate(
        { _id: ObjectID(id) },
        { $set: { ratings } },
        { returnNewDocument: true },
        (err, item) => {
          if (err) {
            return res.send(JSON.stringify({ success: false }));
          }
          console.log("rating", item.value.ratings);
          return res.send(JSON.stringify({ success: true, ratings: ratings }));
        }
      );
  });
});

app.post("/add-to-cart", upload.none(), (req, res) => {
  cart.addToCart(req, res, dbo);
});

app.post("/remove-from-cart", upload.none(), (req, res) => {
  cart.removeFromCart(req, res, dbo);
});

app.post("/cart", upload.none(), (req, res) => {
  cart.cart(req, res, dbo);
});

app.post("/search", upload.none(), (req, res) => {
  let tags = req.body.tags;
  tags = tags.split(" ");
  console.log("tags after split:", tags);
  tags = tags.map(tag => {
    return new RegExp(tag, "i");
  });
  console.log("tags after map:", tags);
  dbo
    .collection("items")
    .find({ $or: [{ productName: { $in: tags } }, { tags: { $in: tags } }] })
    .toArray((err, array) => {
      if (err) {
        return res.send(JSON.stringify({ success: false }));
      }
      console.log("item: ", array);
      return res.send(JSON.stringify({ array }));
    });
});

app.post("/render-category", upload.none(), (req, res) => {
  //name of the category
  let category = req.body.category;
  // //page number of items being displayed
  // let pageNo = req.body.offset;
  // //max number of items being displayed
  // let max = req.body.max;
  // //give the sort parameter (quantity, price, whatever). Has to match the parameter name in the database
  // let sortParam = req.body.sortParam;
  // //give sort direction. Asc is 1, desc is -1
  // let direction = req.body.direction;
  // let currentPage = pageNo * max;
  // let sort = {};
  // sort[sortParam] = direction;
  dbo
    .collection("items")
    .find({ category }) // .sort(sort)
    // .limit(max)
    // .skip(currentPage)
    .toArray((err, items) => {
      if (err) {
        console.log("Error getting product list", err);
        return res.send(JSON.stringify({ success: false }));
      }
      return res.send(JSON.stringify({ items }));
    });
});

app.post("/render-featured", upload.none(), (req, res) => {
  let featured = req.body.featured;
  dbo
    .collection("items")
    .find({ featured }) // .sort(sort)
    // .limit(max)
    // .skip(currentPage)
    .toArray((err, items) => {
      if (err) {
        console.log("Error getting product list", err);
        return res.send(JSON.stringify({ success: false }));
      }
      return res.send(JSON.stringify({ items }));
    });
});

app.post("/merchant-dashboard", upload.none(), (req, res) => {
  let userId = req.body.userId;
  dbo
    .collections("items")
    .find({ _id: userId })
    .toArray((err, items) => {
      if (err) {
        console.log("Error getting merchant product list");
        return res.send(JSON.stringify({ success: false }));
      }
      return res.send(JSON.stringify({ success: true, items }));
    });
});

app.post("/product-page", upload.none(), (req, res) => {
  let id = req.body.id;
  console.log("id: ", id);
  dbo.collection("items").findOne({ _id: ObjectID(id) }, (err, item) => {
    if (err) {
      console.log("Error returning item from database");
      return res.send(JSON.stringify({ success: false }));
    }
    console.log("Item: ", item);
    res.send(JSON.stringify({ success: true, item }));
  });
});

//app.post("/merchant-inventory");

//see the list of sold things
//app.post("/sales-record")

app.post("/confirm-payment", upload.none(), async (req, res) => {
  console.log("in confirm-payment");
  console.log(req.body.id);

  let id = req.body.id;

  let cart = JSON.parse(req.body.cart);

  let purchaseOrder = [];
  let ids = cart.map(item => {
    // purchaseOrder[key] = cart[i][key];
    return ObjectID(item.itemId);
  });
  console.log("ids: ", typeof ids);
  await Promise.all(
    ids.map((id, i) => {
      console.log("========== is this a number", cart);
      return new Promise(res => {
        dbo
          .collection("items")
          .findOneAndUpdate(
            { _id: id },
            { $inc: { inventory: cart[i].quantity * -1 } },
            (err, item) => {
              console.log(item);
              purchaseOrder.push({
                item: item.value,
                quantity: cart[i].quantity
              });
              res(
                dbo
                  .collection("merchants")
                  .updateOne(
                    { _id: ObjectID(item.value.sellerId) },
                    { $push: { salesHistory: cart[i] } }
                  )
              );
            }
          );
      });
    })
  );

  let purchased;

  dbo.collection("purchase-orders").insertOne({ purchaseOrder }, (err, PO) => {
    purchaseOrder[id] = PO.insertedId;
    dbo.collection("users").findOneAndUpdate(
      { _id: ObjectID(id) },
      {
        $set: { cart: [] },
        $push: { purchased: PO.insertedId }
      },
      { returnOriginal: false },
      (err, user) => {
        console.log("value:", user.value.purchased);
        purchased = user.value.purchased;
        console.log("purchased", purchased);
        return res.send(
          JSON.stringify({ success: true, cart: [], purchaseOrder, purchased })
        );
      }
    );
  });
});

app.post("/merchant-page", upload.none(), (req, res) => {
  let id = req.body.sellerId;
  dbo
    .collection("merchants")
    .findOne({ _id: ObjectID(id) }, (err, merchant) => {
      if (err || merchant === null) {
        return res.send(JSON.stringify({ success: false }));
      }
      return res.send(JSON.stringify({ success: true, merchant }));
    });
});

app.post("/purchase-history", upload.none(), (req, res) => {
  let purchaseOrders = JSON.parse(req.body.purchaseOrders);
  purchaseOrders = purchaseOrders.map(order => {
    return ObjectID(order);
  });
  dbo
    .collection("purchase-orders")
    .find({ _id: { $in: purchaseOrders } })
    .toArray((err, POs) => {
      if (err) {
        return res.send(JSON.stringify({ success: false }));
      }
      res.send(JSON.stringify({ success: true, POs }));
    });
});

app.post("/sales-record", upload.none(), (req, res) => {
  console.log("in sales record");
  let salesRecord = JSON.parse(req.body.salesRecord);
  console.log("in sales record");
  salesRecord = salesRecord.map(order => {
    return ObjectID(order.itemId);
  });

  dbo
    .collection("items")
    .find({ _id: { $in: salesRecord } })
    .toArray((err, POs) => {
      if (err) {
        return res.send(JSON.stringify({ success: false }));
      }
      res.send(JSON.stringify({ success: true, POs }));
    });
});

app.post("/inventory", upload.none(), (req, res) => {
  if (req.body.items === undefined) {
    res.send(JSON.stringify({ success: false }));
    return;
  }
  let items = req.body.items;
  if (!items) {
    return res.send(JSON.stringify({ success: false }));
  }

  items = items.split(",");
  console.log("ITEMS IS: *******", items);

  items = items.map(item => {
    return ObjectID(item);
  });
  dbo
    .collection("items")
    .find({ _id: { $in: items } })
    .toArray((err, items) => {
      if (err) {
        return res.send(JSON.stringify({ success: false }));
      }
      console.log("superduper items", items);

      return res.send(JSON.stringify({ success: true, items }));
    });
});

app.post("/update-password", upload.none(), (req, res) => {
  let id = req.body.id;
  let password = req.body.password;
  let signupType = req.body.signupType;

  dbo
    .collection(signupType)
    .updateOne({ _id: ObjectID(id) }, { $set: { password } }, (err, user) => {
      if (err || user === null) {
        return res.send(JSON.stringify({ success: false }));
      }
      res.send(JSON.stringify({ success: true }));
    });
});

app.post("/update-email", upload.none(), (req, res) => {
  let id = req.body.id;
  let email = req.body.email;
  let signupType = req.body.signupType;
  console.log("username: ", id);
  console.log("email: ", email);
  console.log("signupType: ", signupType);
  dbo
    .collection(signupType)
    .updateOne({ _id: ObjectID(id) }, { $set: { email } }, (err, user) => {
      if (err || user === null) {
        return res.send(JSON.stringify({ success: false }));
      }
      console.log("user:", user);
      res.send(JSON.stringify({ success: true }));
    });
});

app.post("/update-item-description-header", upload.none(), (req, res) => {
  console.log("Update item desc header HIT::::::::::");
  let id = req.body.id;
  let descriptionHeader = req.body.shortDescription;
  console.log("Item Id:", id);
  dbo
    .collection("items")
    .updateOne(
      { _id: ObjectID(id) },
      { $set: { descriptionHeader } },
      (err, item) => {
        if (err || item === null) {
          return res.send(JSON.stringify({ success: false }));
        }
        console.log("item:", item);
        res.send(JSON.stringify({ success: true }));
      }
    );
});

app.post("/update-item-description-text", upload.none(), (req, res) => {
  console.log("Update item desc header HIT::::::::::");
  let id = req.body.id;
  let descriptionText = req.body.longDescription;
  console.log("Item Id:", id);
  dbo
    .collection("items")
    .updateOne(
      { _id: ObjectID(id) },
      { $set: { descriptionText } },
      (err, item) => {
        if (err || item === null) {
          return res.send(JSON.stringify({ success: false }));
        }
        console.log("item:", item);
        res.send(JSON.stringify({ success: true }));
      }
    );
});

app.post("/update-item-price", upload.none(), (req, res) => {
  console.log("Update item desc header HIT::::::::::");
  let id = req.body.id;
  let price = req.body.price;
  price = parseFloat(price);
  console.log("Item Id:", id);
  dbo
    .collection("items")
    .updateOne({ _id: ObjectID(id) }, { $set: { price } }, (err, item) => {
      if (err || item === null) {
        return res.send(JSON.stringify({ success: false }));
      }
      console.log("item:", item);
      res.send(JSON.stringify({ success: true }));
    });
});

//=============================== LISTENER ===============================//
app.listen("4000", () => {
  console.log("Server up");
});
