const database = include('database_connection');

async function imageUpload(postData) {
    let imageUploadSQL = `
        INSERT INTO uploads
        (long, short, desc, type, hits, active, createdDate, lastHitDate, user_id)
        VALUES
        (:long, :short, :desc, :type, :hits, :active, :createdDate, :lastHitDate, :user_id)
    `

    let params = {
		long: postData,
        short: postData,
        desc: postData,
        type: postData,
        hits: postData,
        active: postData,
        createdDate: postData,
        lastHitDate: postData,
        user_id: postData
	}

    try {
		const results = await database.query(imageUploadSQL, params);
		console.log("Successfully uploaded image");
		console.log(results[0]);
		return true;
	} catch (err) {
		console.log("Error uploading image");
		console.log(err);
		return false;
	}
}

async function textUpload(postData) {
    let textUploadSQL = `
        INSERT INTO uploads
        (long, short, desc, type, hits, active, createdDate, lastHitDate, user_id)
        VALUES
        (:long, :short, :desc, :type, :hits, :active, :createdDate, :lastHitDate, :user_id)
    `

    let params = {
		long: postData,
        short: postData,
        desc: postData,
        type: postData,
        hits: postData,
        active: postData,
        createdDate: postData,
        lastHitDate: postData,
        user_id: postData
	}

    try {
		const results = await database.query(textUploadSQL, params);
		console.log("Successfully uploaded text");
		console.log(results[0]);
		return true;
	} catch (err) {
		console.log("Error uploading text");
		console.log(err);
		return false;
	}
}

async function linkUpload(postData) {
    let linkUploadSQL = `
        INSERT INTO uploads
        (long, short, desc, type, hits, active, createdDate, lastHitDate, user_id)
        VALUES
        (:long, :short, :desc, :type, :hits, :active, :createdDate, :lastHitDate, :user_id)
    `

    let params = {
		long: postData,
        short: postData,
        desc: postData,
        type: postData,
        hits: postData,
        active: postData,
        createdDate: postData,
        lastHitDate: postData,
        user_id: postData
	}

    try {
		const results = await database.query(linkUploadSQL, params);
		console.log("Successfully uploaded link");
		console.log(results[0]);
		return true;
	} catch (err) {
		console.log("Error uploading link");
		console.log(err);
		return false;
	}
}

async function getUserImage(postData) {
    let getUserImageSQL = `
        SELECT long, short, desc
        FROM uploads
        WHERE user_id = :user_id AND type = :type
    `

    let params = {
		type: postData,
        user_id: postData
	}

    try {
		const results = await database.query(getUserImageSQL, params);
		console.log("Successfully got user image data");
		console.log(results[0]);
		return true;
	} catch (err) {
		console.log("Error getting user image data");
		console.log(err);
		return false;
	}
}

async function getUserText(postData) {
    let getUserTextSQL = `
        SELECT long, short, desc
        FROM uploads
        WHERE user_id = :user_id AND type = :type
    `

    let params = {
		type: postData,
        user_id: postData
	}

    try {
		const results = await database.query(getUserTextSQL, params);
		console.log("Successfully got user text data");
		console.log(results[0]);
		return true;
	} catch (err) {
		console.log("Error getting user text data");
		console.log(err);
		return false;
	}
}

async function getUserLink(postData) {
    let getUserLinkSQL = `
        SELECT long, short, desc
        FROM uploads
        WHERE user_id = :user_id AND type = :type
    `

    let params = {
		type: postData,
        user_id: postData
	}

    try {
		const results = await database.query(getUserLinkSQL, params);
		console.log("Successfully got user link data");
		console.log(results[0]);
		return true;
	} catch (err) {
		console.log("Error getting user link data");
		console.log(err);
		return false;
	}
}


module.exports = {
	imageUpload,
    textUpload,
    linkUpload,
    getUserImage,
    getUserText,
    getUserLink
};