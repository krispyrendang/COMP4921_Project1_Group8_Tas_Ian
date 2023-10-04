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
const url = include("database/url");
const success = db_utils.printMySQLVersion();
const puny_url = "puny/";
const base_url = ""; //hosted site

const port = process.env.PORT || 3000;

const app = express();

const expireTime = 60 * 60 * 1000; //expires after 1 hour  (hours * minutes * seconds * millis)

/* secret information section */
const cloudinary = require("cloudinary");
cloudinary.config({
	cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
	api_key: process.env.CLOUDINARY_CLOUD_KEY,
	api_secret: process.env.CLOUDINARY_CLOUD_SECRET,
});

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
	// var missingInfo = req.query.missing;
	user_id = req.session.user_id;
	username = req.session.username;

	if (!isValidSession(req)) {
		res.redirect("/");
	} else {
		console.log(
			"user id " + user_id + " " + username + " has successfully logged in!"
		);
		var data = await db_uploads.getAllUpload();

		res.render("home", {
			username,
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
	user_id = req.session.user_id;

	//replace with the users links table info
	var data = await db_uploads.getUserUploadType({
		type: 1,
		user_id: user_id,
	});

	res.render("profile_link", {
		data,
	});
});

app.get("/profile/images", async (req, res) => {
	user_id = req.session.user_id;

	//replace with the users images table info
	var data = await db_uploads.getUserUploadType({
		type: 2,
		user_id: user_id,
	});

	res.render("profile_image", {
		data,
	});
});

app.get("/profile/text", async (req, res) => {
	user_id = req.session.user_id;

	//replace with the users text table info
	var data = await db_uploads.getUserUploadType({
		type: 3,
		user_id: user_id,
	});

	res.render("profile_text", {
		data,
	});
});

app.get("/profile/upload", (req, res) => {
	res.render("upload");
});

app.post("/profile/upload/link", async (req, res) => {
	let long_url = req.body.long_url;
	let user_id = req.session.user_id;
	let short_url = url.url_code();
	let short = puny_url + short_url;
	let curr_date = new Date().toDateString();

	var results = await db_uploads.userUpload({
		long: long_url,
		short: short,
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
