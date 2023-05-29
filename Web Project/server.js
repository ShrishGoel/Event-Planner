var express = require("express");
var path = require("path");
var app = express();
var fs = require('fs');
var mySql = require("mysql");
app.use(express.urlencoded({ extended: true }));
var fileup = require("express-fileupload");
app.use(fileup());
const sqlU = CLOUDFLARE_ENV.EMAIL_USER;
const sqlP = CLOUDFLARE_ENV.EMAIL_USER;
var dbConfigObj = {
    host: "localhost",
    user: sqlU,
    password: sqlP,
    database: "web project - event planner"
}
var dbcon = mySql.createConnection(dbConfigObj);
dbcon.connect(function (err) {
    if (err) {
        console.log(err);
    }
    else {
        console.log("Connection Successful");
    }
});
let alert = require('alert');
app.use(express.static("public"));

var nodemailer = require('nodemailer');
const userE = CLOUDFLARE_ENV.EMAIL_USER;
const passE = CLOUDFLARE_ENV.EMAIL_PASS;
var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: userE,
        pass: passE
    }
});
const PORT = process.env.PORT || 5000
app.listen(PORT, function () {
    console.log("Server Started");
});


var access = false;
app.get("/", function (req, resp) {
    resp.sendFile(__dirname + "/public/index.html");
});


app.post("/profile-client-update", (req, resp) => {
    var filename = "";
    if (req.files == null) {
        filename = req.body.hdn;
        req.body.pic = filename;
    }
    else {
        filename = req.files.picpath.name;
        var num = req.body.userid;
        var data = [num];
        req.body.pic = req.files.picpath.name;
        var uploadsFolder = path.join(path.resolve(), "public", "uploads", req.files.picpath.name);
        req.files.picpath.mv(uploadsFolder);
        dbcon.query("select pic from profileclient where userid=?", data, function (err, results, fields) {
            if (results == "") {
                req.body.pic = "no pic.png";
            }
            else {
                path = "public/uploads/" + results[0].pic;
                fs.unlinkSync(path);;
            }
        });
    }
    var data = [req.body.pic, req.body.uname, req.body.contact, req.body.address, req.body.city, req.body.email];
    dbcon.query("update profileclient set pic=?,name=?,contact=?,address=?,city=? where email=?", data, function (err, results, fields) {
        if (err) {
            resp.send(err.message);
        }
        else {
            alert("Profile Updated Successfully.");
            resp.redirect("dash-client.html");
        }
    })
})


var bodyParser = require('body-parser');
const { response } = require("express");
const { exit } = require("process");
app.use(bodyParser.urlencoded({  //   body-parser to
    extended: true               //   parse data
}));                             //
app.use(bodyParser.json());

app.post("/profile-client-fetch", (req, resp) => {
    var num = req.body.email;
    var data = [num];
    var query = dbcon.query("select * from profileclient where email=?", data, function (err, result, fields) {
        if (err) {
            resp.send(err.message);
        }
        else {
            resp.send(result[0]);
        }
    })

});

app.post("/profile-vendor-update", (req, resp) => {
    var filename = "";
    if (req.files == null) {
        filename = req.body.hdn;
        req.body.pic = filename;
    }
    else {
        var num = req.body.userid;
        var data = [num];
        req.body.pic = req.files.picpath.name;
        var uploadsFolder = path.join(path.resolve(), "public", "ids", req.files.picpath.name);
        req.files.picpath.mv(uploadsFolder);
        dbcon.query("select uploadid from profilevendor where userid=?", data, function (err, results, fields) {
            if (results[0] == null) {
                req.body.pic = "no pic.png";
            }
            else if (results[0].uploadid == "no pic.png") {

            }
            else {
                path = "public/ids/" + results[0].uploadid;
                fs.unlinkSync(path);;
            }
        });
    }
    var data = [req.body.name, req.body.pic, req.body.firm, req.body.estd, req.body.contact, req.body.city, req.body.selser, req.body.other, req.body.email];
    dbcon.query("update profilevendor set name=?,uploadid=?,firm=?,estd=?,phone=?,City=?,service=?,other=? where email=?", data, function (err) {
        if (err) {
            resp.send(err.message);
        }
        else {
            alert("Profile Updated Successfully.");
            resp.redirect("dash-vendor.html");
        }
    })

});

app.post("/profile-vendor-fetch", (req, resp) => {
    var num = req.body.email;
    var data = [num];
    var query = dbcon.query("select * from profilevendor where email=?", data, function (err, result, fields) {
        if (err) {
            resp.send(err.message);
        }
        else {
            resp.send(result[0]);
        }
    })

});


app.post("/signup-save", (req, resp) => {
    var curd = new Date();
    var dos = (curd.getMonth() + 1) + "/" + curd.getDate() + "/" + curd.getFullYear();
    var data = [req.body.email, req.body.password, req.body.type, dos];
    var mailOptions = {
        from: 'shrishgoel001@gamil.com',
        to: (req.body.email + "@gmail.com"),
        subject: 'Welcome to Event Manager',
        text: 'Hi,Thanks for signing up for a account at event manager. Using event manager you can schedule any event that you want to do. You can also see all your vendors which can help you set up the event.'
    };
    dbcon.query("insert into users values(?,?,?,?)", data, function (err) {
        if (err) {
            resp.send("Error");
        }
        else {
            transporter.sendMail(mailOptions, function (error, info) {
                if (error) {
                    console.log(error);
                } else {
                    console.log('Email sent: ' + info.response);
                }
            });
            var data = [req.body.email,"no pic.png"];
            if (req.body.type == "Client") {
                dbcon.query("insert into profileclient(email,pic) values(?,?)", data, function (err, results, fields) {
                    if (err) {
                        resp.send("Invalid");
                    }
                    else {
                        resp.send("ok");
                    }
                })
            }
            else if (req.body.type == "Vendor") {
                dbcon.query("insert into profilevendor(email,uploadid) values(?,?)", data, function (err, results, fields) {
                    if (err) {
                        resp.send("Invalid");
                    }
                    else {
                        resp.send("ok");
                    }
                })
            }
            else {
                resp.send("ok");
            }
        }
    })
});
app.post("/dash-client.html", (req, resp) => {
    console.log("y");
})

app.post("/login", (req, resp) => {
    var data = [req.body.email];
    dbcon.query("select pwd,type from users where email=?", data, function (err, results, fields) {
        if (results[0] == null || results[0].pwd != req.body.password) {
            resp.send("Invalid");
        }
        else {
            resp.send(results[0].type);
        }

    });
})

app.post("/password-change", (req, resp) => {
    var data = [req.body.newpwd, req.body.oldpwd, req.body.email];
    dbcon.query("update users set pwd=? where pwd=? and email=?", data, function (err, results) {
        if (err || results.affectedRows == 0) {
            resp.send("error");
        }
        else {
            resp.send("done");
        }
    });

});

app.get("/fetch-clients", (req, resp) => {
    var data = [];
    dbcon.query("select * from profileclient", data, (err, result) => {
        if (err) {
            resp.send(err.message);
        }
        else {
            resp.send(result);
        }
    });
});

app.post("/client-user-del", function (req, resp) {
    var data = [req.query.userid];
    dbcon.query("delete from profileclient where userid=?", data, function (err, res) {
        if (err)
            resp.send(err.message);
        else {
            if (req.query.pic == "no pic.PNG") {
            }
            else {
                path = "public/uploads/" + req.query.pic;
                fs.unlinkSync(path);
            }
            var data = [req.query.email];
            dbcon.query("delete from users where email=?", data, function (err) {
                if (err) {
                    resp.send(err.message);
                }
                else {
                    dbcon.query("select * from profileclient", data, (err, result) => {
                        if (err) {
                            resp.send(err.message);
                        }
                        else {
                            resp.send(result);
                        }
                    });
                }
            });

        }
    })
});

app.post("/vendor-user-del", function (req, resp) {
    var data = [req.query.userid];
    dbcon.query("delete from profilevendor where userid=?", data, function (err, res) {
        if (err)
            resp.send(err.message);

        else {
            if (req.query.pic == "no pic.PNG") {
            }
            else {
                path = "public/ids/" + req.query.pic;
                fs.unlinkSync(path);
            }
            var data = [req.query.email];
            dbcon.query("delete from users where email=?", data, function (err) {
                if (err) {
                    resp.send(err.message);
                }
                else {
                    dbcon.query("select * from profilevendor", data, (err, result) => {
                        if (err) {
                            resp.send(err.message);
                        }
                        else {
                            resp.send(result);
                        }
                    });
                }
            });

        }

    })
});

app.get("/fetch-vendor", function (req, resp) {
    var data = [];
    dbcon.query("select * from profilevendor", data, (err, result) => {
        if (err) {
            resp.send(err.message);
        }
        else {
            resp.send(result);
        }
    });
});

app.post("/fetch-event-data", function (req, resp) {
    var data = [];
    dbcon.query("select City,service from profilevendor", data, (err, result) => {
        if (err) {
            resp.send(err.message);
        }
        else {
            resp.send(result);
        };
    });
});

app.post("/fetch-clients-event", function (req, resp) {
    var data = [req.query.city, ("%" + req.query.service + "%")];
    dbcon.query("select * from profilevendor where City=? and service LIKE ?", data, (err, result) => {
        if (err) {
            resp.send(err.message);
        }
        else {
            resp.send(result);
        }
    });
});
