const admin = require("firebase-admin");
const serviceAccount = require("../../finafid-a37bc-firebase-adminsdk-9icoq-22543df655.json");


admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});


