require("./utils");
require("dotenv").config();

const express = require("express");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const bcrypt = require("bcrypt");
const saltRounds = 12;

const database = include("database_connection");
const db_utils = include("database/db_utils");
const db_users = include("database/users");
const db_uploads = include("database/uploads");
const valid_url = require("valid-url");
const url = include("database/url");
const success = db_utils.printMySQLVersion();
// const puny_url = "puny/";
const base_url = "https://mcjxbrvtkd.us18.qoddiapp.com"; //hosted site

const port = process.env.PORT || 8080;

const app = express();

const expireTime = 60 * 60 * 1000; //expires after 1 hour  (hours * minutes * seconds * millis)

/* secret information section */
const cloudinary = require("cloudinary");
cloudinary.config({
	cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
	api_key: process.env.CLOUDINARY_CLOUD_KEY,
	api_secret: process.env.CLOUDINARY_CLOUD_SECRET,
});

const multer = require("multer");
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const { v4: uuid } = require("uuid");

const mongodb_user = process.env.MONGODB_USER;
const mongodb_password = process.env.MONGODB_PASSWORD;
const mongodb_session_secret = process.env.MONGODB_SESSION_SECRET;

const node_session_secret = process.env.NODE_SESSION_SECRET;
/* END secret section */

app.set("view engine", "ejs");

app.use(
	express.urlencoded({
		extended: false,
	})
);

//!! Need to include both MongoDB accounts? !!
var mongoStore = MongoStore.create({
	mongoUrl: `mongodb+srv://${mongodb_user}:${mongodb_password}@cluster0.o0kpuux.mongodb.net/?retryWrites=true&w=majority`,
	crypto: {
		secret: mongodb_session_secret,
	},
});
app.use(
	session({
		secret: node_session_secret,
		store: mongoStore, //default is memory store
		saveUninitialized: false,
		resave: true,
	})
);

app.get("/", (req, res) => {
	res.render("index");
});

app.get("/signup", (req, res) => {
	var missingInfo = req.query.missing;
	res.render("createUser", {
		missing: missingInfo,
	});
});

app.post("/submitUser", async (req, res) => {
	var username = req.body.username;
	var email = req.body.email;
	var password = req.body.password;

	var hashedPassword = bcrypt.hashSync(password, saltRounds);

	if (!username) {
		res.redirect("/signup?missing=username");
	} else if (!email) {
		res.redirect("/signup?missing=email");
	} else if (!password) {
		res.redirect("/signup?missing=password");
	} else {
		var success = await db_users.createUser({
			username: username,
			email: email,
			hashedPassword: hashedPassword,
		});
		console.log(username);
		console.log(email);
		console.log(hashedPassword);

		if (success) {
			var results = await db_users.getUser({
				email: email,
				hashedPassword: password,
			});
			req.session.authenticated = true;
			req.session.user_type = results[0].user_type;
			req.session.username = results[0].username;
			req.session.user_id = results[0].user_id;
			req.session.cookie.maxAge = expireTime;
			console.log(results[0].user_id);

			res.redirect("/home");
		} else {
			res.render("errorMessage", {
				error: "Failed to create user.",
			});
		}
	}
});

app.get("/admin", async (req, res) => {
	username = req.session.username;
	var results = await db_users.getUsers();

	if (!isAdmin(req)) {
		res.redirect("/");
	} else {
		res.render("admin", {
			users: results,
			username,
		});
	}
});

app.get("/login", (req, res) => {
	res.render("login", {
		error: "none",
	});
});

app.post("/loggingin", async (req, res) => {
	var email = req.body.email;
	var password = req.body.password;

	var results = await db_users.getUser({
		email: email,
		hashedPassword: password,
	});

	if (results) {
		if (results.length == 1) {
			//there should only be 1 user in the db that matches
			if (bcrypt.compareSync(password, results[0].hashedPassword)) {
				req.session.authenticated = true;
				req.session.user_type = results[0].user_type;
				req.session.username = results[0].username;
				req.session.user_id = results[0].user_id;
				req.session.cookie.maxAge = expireTime;

				if (!isAdmin(req)) {
					res.redirect("/home");
				} else {
					res.redirect("/admin");
				}

				return;
			} else {
				console.log("invalid password");
			}
		} else {
			console.log(
				"invalid number of users matched: " + results.length + " (expected 1)."
			);
			res.render("login", {
				error: "User and password not found.",
			});
			return;
		}
	}

	console.log("user not found");
	//user and password combination not found
	res.render("login", {
		error: "User and password not found.",
	});
});

app.post("/logout", (req, res) => {
	req.session.authenticated = false;
	req.session.destroy();
	res.redirect("/");
});

app.get("/home", async (req, res) => {
	username = req.session.username;
	user_id = req.session.user_id;

	if (!isValidSession(req)) {
		res.redirect("/");
	} else {
		console.log(
			"user id " + user_id + " " + username + " has successfully logged in!"
		);
		var data = await db_uploads.getAllUpload();

		res.render("home", {
			data,
		});
	}
});

app.get("/home/links", async (req, res) => {
	//replace with the links table info
	var data = await db_uploads.getAllUploadType({
		type: 1,
	});

	res.render("home_link", {
		data,
	});
});

app.get("/home/images", async (req, res) => {
	//replace with the images table info
	var data = await db_uploads.getAllUploadType({
		type: 2,
	});

	res.render("home_image", {
		data,
	});
});

app.get("/home/text", async (req, res) => {
	//replace with the text table info
	var data = await db_uploads.getAllUploadType({
		type: 3,
	});

	res.render("home_text", {
		data,
	});
});

app.get("/profile", async (req, res) => {
	username = req.session.username;
	user_id = req.session.user_id;

	var data = await db_uploads.getUserUpload({
		user_id: user_id,
	});

	if (!isValidSession(req)) {
		res.redirect("/");
	} else {
		res.render("profile", {
			username,
			data,
		});
	}

});

app.get("/profile/links", async (req, res) => {
	username = req.session.username;
	user_id = req.session.user_id;

	//replace with the users links table info
	var data = await db_uploads.getUserUploadType({
		type: 1,
		user_id: user_id,
	});

	res.render("profile_link", {
		username,
		data,
	});
});

app.get("/profile/images", async (req, res) => {
	username = req.session.username;
	user_id = req.session.user_id;

	//replace with the users images table info
	var data = await db_uploads.getUserUploadType({
		type: 2,
		user_id: user_id,
	});

	res.render("profile_image", {
		username,
		data,
	});
});

app.get("/profile/text", async (req, res) => {
	username = req.session.username;
	user_id = req.session.user_id;

	//replace with the users text table info
	var data = await db_uploads.getUserUploadType({
		type: 3,
		user_id: user_id,
	});

	res.render("profile_text", {
		username,
		data,
	});
});

app.get("/profile/upload", (req, res) => {
	res.render("upload");
});

app.post("/profile/upload/image", upload.single("image"), async (req, res) => {
	let short = url.url_code();
	let short_url = puny_url + short;
	let curr_date = new Date().toDateString();
	let buf64 = req.file.buffer.toString("base64");
	user_id = req.session.user_id;

	stream = cloudinary.uploader.upload(
		"data:image/octet-stream;base64," + buf64,
		async (result) => {
			try {
				console.log(result);

				let long_url = base_url + `/image/${result.public_id}`;

				const success = await db_uploads.userUpload({
					long: long_url,
					short: short_url,
					desc: "image",
					type: 2,
					createdDate: curr_date,
					user_id: user_id,
				});

				if (!success) {
					console.log("Error inserting image data");
				} else {
					res.redirect("/profile");
				}
			} catch (err) {
				console.log(err);
			}
		}
	);
});

app.get("/image/:image_uuid", (req, res) => {
	res.render("image", {
		image_uuid: req.params.image_uuid,
	});
});

app.post("/profile/upload/link", async (req, res) => {
	let long_url = req.body.long_url;
	let user_id = req.session.user_id;
	let short_url = base_url + "/" + url.url_code();
	let curr_date = new Date().toDateString();

	var results = await db_uploads.userUpload({
		long: long_url,
		short: short_url,
		desc: "link",
		type: 1,
		createdDate: curr_date,
		user_id: user_id,
	});

	if (results) {
		res.render("upload_status", {
			status: "Successful",
		});
	} else {
		res.render("upload_status", {
			status: "Unsuccessful.",
		});
	}
});

app.get("/redirect", (req, res) => {
	console.log(req.body.long_url);

	setTimeout(() => {
		window.location.replace(req.body.long_url);
		// res.redirect(req.body.long_url);
	}, 3000);
});

//Does not require session validation
app.get("/:code", async (req, res) => {
	try {
		var results = await db_uploads.getLongURL({
			short_url: base_url + "/" + req.params.code,
		});

		if (results) {
			console.log("results.active: " + results[0].active);
			if (results[0].active == 1) {
				let long_url = results[0].long_url;
				let uploads_id = results[0].uploads_id;
				let curr_date = new Date().toDateString();

				await db_uploads.updateHits_Date({
					uploads_id: uploads_id,
					curr_date: curr_date,
				});

				res.redirect(301, "/redirect", {
					status: "ACTIVE",
					timer: 3,
					longURL: long_url,
				});
				// res.redirect("/redirect");

				// setTimeout(() => {
				// 	location.replace(longURL);
				// }, 3000);
			} else {
				res.render("inactive");
				// setTimeout(() => {
				// 	res.redirect("/profile");
				// }, 3000);
			}
		} else {
			res.render("404");
		}
	} catch (err) {
		console.log(err);
	}
});

app.post("/profile/update/active/:uploads_id", async (req, res) => {

	let data = await db_uploads.getUploadRow({
		uploads_id: req.params.uploads_id
	})

	if (data[0].active == 1) {
		await db_uploads.updateActive({
			active: 0,
			uploads_id: req.params.uploads_id
		})
		res.redirect("/profile")

	} else {
		await db_uploads.updateActive({
			active: 1,
			uploads_id: req.params.uploads_id
		})
		res.redirect("/profile")
	}
})

app.get("/createTables", async (req, res) => {
	const create_tables = include("database/create_tables");

	var success = create_tables.createTables();
	if (success) {
		res.render("successMessage", {
			message: "Created tables.",
		});
	} else {
		res.render("errorMessage", {
			error: "Failed to create tables.",
		});
	}
	res.render("home_link", {
		data,
	});
});

function isValidSession(req) {
	if (req.session.authenticated) {
		return true;
	}
	return false;
}

function sessionValidation(req, res, next) {
	if (!isValidSession(req)) {
		req.session.destroy();
		res.redirect("/");
		return;
	} else {
		next();
	}
}

function isAdmin(req) {
	if (req.session.user_type == "admin") {
		return true;
	}
	return false;
}

function adminAuthorization(req, res, next) {
	if (!isAdmin(req)) {
		res.status(403);
		res.render("errorMessage", {
			error: "Not Authorized",
		});
		return;
	} else {
		next();
	}
}

app.use("/home", sessionValidation);
app.use("/profile", sessionValidation);

app.use("/admin", adminAuthorization);
app.use(express.static("public"));
app.use(express.static(__dirname + "/public"));

app.get("*", (req, res) => {
	res.status(404);
	res.render("404");
});

app.listen(port, () => {
	console.log("Node application listening on port " + port);
});
