//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

mongoose.connect(
  "mongodb+srv://admin_tarun:Test123@cluster0.2lqqixt.mongodb.net/todolistDB",
  {
    useNewUrlParser: true,
  }
);
const itemsSchema = new mongoose.Schema({
  name: String,
});
const Item = mongoose.model("Item", itemsSchema);
const one = new Item({
  name: "Welcome to your todolist!",
});
const two = new Item({
  name: "Hit the + button to add a new item.",
});
const three = new Item({
  name: "<-- Hit this to delete an item.",
});
const defaultItems = [one, two, three];

const listSchema = {
  name: String,
  items: [itemsSchema], //List of items doc associated with items schema
};

const List = mongoose.model("List", listSchema);

app.get("/", function (req, res) {
  Item.find({})
    .then(function (foundItems) {
      if (foundItems.length === 0) {
        Item.insertMany(defaultItems)
          .then(function () {
            console.log("Successfully saved default items to DB");
          })
          .catch(function (err) {
            console.log(err);
          });

        res.redirect("/");
      } else {
        res.render("list", { listTitle: "Today", newListItems: foundItems });
      }
    })
    .catch(function (err) {
      console.log(err);
    });
   
});

app.get("/:customListName", function (req, res) {
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({ name: customListName }, { strictQuery: false })
    .then((foundList) => {
      if (!foundList) {
        const list = new List({
          name: customListName,
          items: defaultItems,
        });

        list.save(); //save it into the lists collection
      } else {
        res.render("list", { listTitle: foundList.name, newListItems: foundList.items });
      }
    })
    .catch(function (err) {});
});

app.post("/", function (req, res) {
  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName,
  });

  if (listName === "Today")
  {
    item.save();
    res.redirect("/");
  }
  else{
    List.findOne({name: listName})
    .then((foundList) => {
      if(item.name!= ""){
       
        foundList.items.push(item);
        foundList.save();
        res.redirect("/" + listName);
      }
    })
     .catch(function(err) {
      console.log(err);
     });  
    }
  });

app.post("/delete", function (req, res) {
  const checkedItemid = req.body.checkbox;
  const listName = req.body.listName;

  if(listName === "Today"){
     Item.findByIdAndRemove(checkedItemid)
       .then(function () {
         console.log("successfully deleted checked item");
         res.redirect("/");
       })
       .catch(function (err) {
         console.log(err);
       });
  }
  else{
    List.findOneAndUpdate({name: listName}, { $pull: {items: {_id: checkedItemid }}})
    .then( foundList => {
      res.redirect("/"+listName);
    })
    .catch(function (err){
      
       
    })
  }

 
});

app.get("/about", function (req, res) {
  res.render("about");
});

app.listen(3000, function () {
  console.log("Server started on port 3000");
});
