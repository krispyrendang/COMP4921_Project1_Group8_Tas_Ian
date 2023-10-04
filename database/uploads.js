const database = include("database_connection");

async function userUpload(postData) {
	let userUploadSQL = `
        INSERT INTO uploads
        (long_url, short_url, description, type, active, createdDate, user_id)
        VALUES
        (:long, :short, :desc, :type, :active, :createdDate, :user_id);
    `;

	let params = {
		long: postData.long,
		short: postData.short,
		desc: postData.desc,
		type: postData.type,
		active: 1,
		createdDate: postData.createdDate,
		user_id: postData.user_id,
	};

	try {
		const results = await database.query(userUploadSQL, params);
		console.log("Upload is successful!");
		console.log(results[0]);
		return true;
	} catch (err) {
		console.log("Error with upload!");
		console.log(err);
		return false;
	}
}

async function getUserUploadType(postData) {
	let getUserUploadTypeSQL = `
        SELECT *
        FROM uploads
        JOIN user USING (user_id)
        WHERE user_id = :user_id AND type = :type;
    `;

	let params = {
		type: postData.type,
		user_id: postData.user_id,
	};

	try {
		const results = await database.query(getUserUploadTypeSQL, params);
		console.log("Successfully got user upload data type");
		return results[0];
	} catch (err) {
		console.log("Error getting user upload data type");
		console.log(err);
		return false;
	}
}

async function getUserUpload(postData) {
	let getUserUploadSQL = `
        SELECT *
        FROM uploads
        JOIN user USING (user_id)
        WHERE user_id = :user_id;
    `;

	let params = {
		user_id: postData.user_id,
	};

	try {
		const results = await database.query(getUserUploadSQL, params);
		console.log("Successfully got user uploads data");
		return results[0];
	} catch (err) {
		console.log("Error getting user uploads data");
		console.log(err);
		return false;
	}
}

async function getAllUpload() {
	let getAllUploadSQL = `
        SELECT *
        FROM uploads;
    `;

	try {
		const results = await database.query(getAllUploadSQL);
		console.log("Successfully got uploads table");
		return results[0];
	} catch (err) {
		console.log("Error getting uploads table");
		console.log(err);
		return false;
	}
}

async function getAllUploadType(postData) {
	let getAllUploadTypeSQL = `
        SELECT *
        FROM uploads
        WHERE type = :type;
    `;

	let params = {
		type: postData,
	};

	try {
		const results = await database.query(getAllUploadTypeSQL, params);
		console.log("Successfully got upload data type");
		return results[0];
	} catch (err) {
		console.log("Error getting upload data type");
		console.log(err);
		return false;
	}
}

module.exports = {
	userUpload,
	getUserUploadType,
	getAllUpload,
	getUserUpload,
	getAllUploadType,
};
