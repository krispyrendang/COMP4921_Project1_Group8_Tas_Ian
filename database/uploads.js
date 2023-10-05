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
        SELECT uploads_id, long_url, short_url, hits, active, createdDate, lastHitDate
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
        SELECT uploads_id, long_url, short_url, hits, active, createdDate, lastHitDate
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

async function getLongURL(postData) {
	let getLongURLSQL = `
        SELECT uploads_id, long_url, active, description
        FROM uploads
        WHERE short_url = :short_url;
    `;

	let params = {
		short_url: postData.short_url,
	};

	try {
		const results = await database.query(getLongURLSQL, params);
		console.log("Successfully got long URL data");
		return results[0];
	} catch (err) {
		console.log("Error getting long URL data");
		console.log(err);
		return false;
	}
}

async function updateHits_Date(postData) {
	let updateHits_DateSQL = `
	update uploads
	set hits = hits + 1,
	lastHitDate = :date
	where uploads_id = :uploads_id;
    `;

	let params = {
		date: postData.curr_date,
		uploads_id: postData.uploads_id,
	};

	try {
		const results = await database.query(updateHits_DateSQL, params);
		console.log("Successfully updated hits and last accessed date");
		console.log(results[0]);
		return true;
	} catch (err) {
		console.log("Error updating hits and last accessed date");
		console.log(err);
		return false;
	}
}

async function getAllUpload() {
	let getAllUploadSQL = `
		SELECT long_url, short_url, hits, createdDate, lastHitDate, active
		FROM uploads
		ORDER BY hits desc
		LIMIT 30;
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
		SELECT long_url, short_url, hits, createdDate, lastHitDate, active
		FROM uploads
		WHERE type = :type
		ORDER BY hits desc
		LIMIT 30;
    `;

	let params = {
		type: postData.type,
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

async function updateActive(postData) {
	let updateActiveSQL = `
		UPDATE uploads
		SET active = :active
		WHERE uploads_id = :uploads_id;
	`;

	let params = {
		active: postData.active,
		uploads_id: postData.uploads_id,
	};

	try {
		const results = await database.query(updateActiveSQL, params);
		console.log("Successfully changed active status");
		return true;
	} catch (err) {
		console.log("Error changing active status");
		console.log(err);
		return false;
	}
}

async function getUploadRow(postData) {
	let getUploadRowSQL = `
		SELECT active
		FROM uploads
		WHERE uploads_id = :uploads_id;
	`;

	let params = {
		uploads_id: postData.uploads_id,
	};

	try {
		const results = await database.query(getUploadRowSQL, params);
		console.log("Successfully grabbed row");
		return results[0];
	} catch (err) {
		console.log("Error grabbing row");
		console.log(err);
		return false;
	}
}

async function getImageRow(postData) {
	let getImageRowSQL = `
		SELECT active
		FROM uploads
		WHERE long_url = :long_url;
	`;

	let params = {
		long_url: postData.long_url,
	};

	try {
		const results = await database.query(getImageRowSQL, params);
		console.log("Successfully grabbed image status");
		return results[0];
	} catch (err) {
		console.log("Error grabbing image status");
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
	getLongURL,
	updateHits_Date,
	updateActive,
	getUploadRow,
	getImageRow,
};
