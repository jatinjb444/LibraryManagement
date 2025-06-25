const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const mongoose = require("mongoose");
const session=require("express-session");
let alert = require('alert'); 
var moment = require('moment');

mongoose.connect("mongodb://localhost:27017/librarydb");

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(session({
  secret:"mysecret",
  saveUninitialized:false,
  resave:false
}));
app.use(bodyParser.json());

const bookSchema = new mongoose.Schema({
  bid: {
    type: String,
    require: [true, "bid is required"],
  },
  bname: {
    type: String,
    require: [true, "bookname is required"],
  },
  author: {
    type: String,
  },
  copies: {
    type: Number,
    require: [true, "copies is required"],
  },
});

const memberSchema = new mongoose.Schema({
  memid: {
    type: String,
    require: [true, "id must be specified"],
  },
  memname: {
    type: String,
    require: [true, "name should be specified"],
  },
  dept: {
    type: String,
  },
  memtype: {
    type: String,
  },
  password: {
    type: String,
    require: [true, "password is required"],
  },
  issuebooks: [{
    nameb:String,
    idb:String,
    issuedate:String,
    returndate:String,
  }],
});

const Book = mongoose.model("Book", bookSchema);

const Member = mongoose.model("Member", memberSchema);

app.post("/signupsubmit", function (req, res) {

  const name = req.body.name;
  const pass = req.body.password;
  const login = req.body.login;
  const dept = req.body.dept;
  const repass = req.body.repassword;
  const mtype = req.body.member;

  var msg = "";
  if (pass != repass) {
    msg = "Confirm you password";
    return res.render("signup-success", {
      displaymsg: msg,
      redirectlink: "/",
      pagename: "Sign-up",
    });
  }
  Member.find({ memid: login }, function (err, foundItems) {
    if (err) {
      console.log(err);
    } else {
      if (foundItems.length !== 0) {
        msg = "User Already Exists";
        return res.render("signup-success", {
          displaymsg: msg,
          redirectlink: "/",
          pagename: "Sign-up",
        });
      }
    }
  });

  const member = new Member({
    memid: login,
    memname: name,
    dept: dept,
    memtype: mtype,
    password: pass,
  });

  member.save();
  msg = "Sign-up successful ";
  res.render("signup-success", {
    displaymsg: msg,
    redirectlink: "/login",
    pagename: "Log-in",
  });
});

app.get("/", function (req, res) {
  res.render("login");
});

app.get("/signup",function(req,res){
  res.render("signup");
})

app.get("/login", function (req, res) {
  res.render("login");

});

app.get("/adminlogin", function (req, res) {
   res.render("admin-login");
});

app.post("/adminloginsubmit",function(req,res){

  const login = req.body.alogin;
  const password = req.body.apass;

  if (password === "1234" && login === "admin123") {
    res.redirect("/adbook");
  }
  else {
    alert("enter correct id and password");
    res.render("admin-login");}
})

 app.get("/adbook",function(req,res){
   res.render("adbook");
 })


app.post("/ad-book", function (req, res) {

  const bookname = req.body.bookname;
  const bookid = req.body.bookid;
  const author = req.body.author;
  var newcopies = parseInt(req.body.copies);
  const action = req.body.work;
  //creating a new book instacne

  const book = new Book({
    bid: bookid,
    bname: bookname,
    author: author,
    copies: newcopies,
  });

  if (action === "add") { 

    Book.find({ bid:bookid }, function (err, foundbook) {
      if (err) {
        console.log(err);
      } else {
        if (foundbook.length != 0) {
          newcopies+= parseInt(foundbook[0].copies);
          foundbook[0].copies = newcopies;
          foundbook[0].save();
        } else {
          book.save();
        }
        return res.redirect("/adbook");
      }
    });
  } else {
    Book.find({ bid:bookid }, function (err, foundbook) {
      if (err) {
        console.log(err);
      } else {
        if (foundbook.length != 0) {
          if(foundbook[0].copies>newcopies){
          (foundbook[0].copies)-=newcopies;
          //foundbook[0].copies = newcopies;
          foundbook[0].save();
          }
          else{
            console.log("number of copies to be removed are more.");
          }
        } else {
          console.log("dont do this");
        }
        return res.redirect("/adbook");
      }
    });
  }
});

app.get("/showbook",function(req,res){
  if(req.session.user){
    const m=req.session.user;
    Member.find({memid:m},function(err,foundmem){
      if(err)
      {
        console.log(err);
      }
      else{
        res.render("showbook",{Name:req.session.user,newListItems:foundmem[0].issuebooks});
      }
    })
//res.render("showbook",{Name:req.session.user});
  }
  else{
    return res.redirect("/login");
  }
})

app.post("/showbook",function(req,res){
  console.log(req.body.search);
  const rbname=req.body.search;
  const issue=req.body.issuename;
  if(req.body.search)
  {
  Book.find({bname:rbname},function(err,found){
    if(err)
    {
      console.log(err);
    }
    else{
      if(found.length!=0){
        if(found[0].copies>0){
      console.log(found[0].bid);
      alert("available");}
      else{
        alert("copies not available");
      }
      }
      else{
        console.log("not found");
        alert("not available");
      }
    }
  })
}

if(issue){
  console.log(req.session.user);
  const m=req.session.user;
  Book.find({ bname:issue }, function (err, foundbook) {
    if (err) {
      console.log(err);
    } else 
    {
      if (foundbook.length != 0) {
        console.log(issue);
        let bi=foundbook[0].bid;
        let nc=foundbook[0].copies;
        Member.find({memid:m},function(err,foundmem){
          if(err){
            console.log(err);
          }
          else
          {
            console.log("member");
            if(nc>0)
            {
            if(foundmem[0].issuebooks.length<4){
              //date logic
            var todayDate = new Date(); 
            var aftertenDays = new Date(new Date().getTime() + (10 * 24 * 60 * 60 * 1000));
            var todayDateFormat = moment(todayDate, 'DD-MM-YYYY').format('DD-MM-YYYY');
            var aftertenDaysFormat = moment(aftertenDays, 'DD-MM-YYYY').format('DD-MM-YYYY');
            console.log(todayDateFormat);
            console.log(aftertenDaysFormat);
            foundmem[0].issuebooks.push({nameb:issue,idb:bi,issuedate:todayDateFormat,returndate:aftertenDaysFormat});//add date
            foundmem[0].save();
            }
            (foundbook[0].copies)-=1;
            foundbook[0].save();
          }
          else{
            alert("copies not available!");
          }
        }
        })
      }
      else{
        alert("book not available!");
      }
    }
});
}
  res.redirect("/showbook");
})

app.post("/delete",function(req,res){
  const checkeditemid=req.body.return;
  const m=req.session.user;
  Member.find({memid:m},function(err,foundmem){
    if(err)
    {
      console.log(err);
    }
    else{
      for(var i=0;i<foundmem[0].issuebooks.length;i++){
        if(foundmem[0].issuebooks[i].idb === checkeditemid){
          foundmem[0].issuebooks.splice(i, 1);
        }
      }
      Book.find({ bid:checkeditemid }, function (err, foundbook) {
        if (err) {
          console.log(err);
        } else {
          if (foundbook.length != 0) {
            foundbook[0].copies +=1;
            foundbook[0].save();
          } 
        }
      });
      foundmem[0].save();
    }
  })
  return res.redirect("/showbook");
});

app.post("/checklogin",function(req,res){
  const login=req.body.login;
  const pass=req.body.password;
  const mem=req.body.member;

  Member.find({memid:login,memtype:mem,password:pass},function(err,founduser){
    if(err)
    {
      console.log(err);
    }else{
      if(founduser.length===0)
      {
        return res.render("loginfail");
      }
      else{
        req.session.user=login;
        console.log(req.session.user);
        res.redirect("/showbook");
      }
    }
  })
});

app.get("/logout",function(req,res){
  req.session.destroy(function(err){
    if(err){
      console.log(err);
    }else{
      return res.redirect("/login");
    }
  })
})
// app.post("/",function(req,res){
//     res.send("hello");
// });

app.listen(3000, function (err) {
  console.log("listening to port 3000");
});

