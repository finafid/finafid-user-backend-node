const semver = require('semver');
const PLAY_STORE_ID = 'com.finafid.user';

const appupdate = async (req, res) => {
  const { currentVersion } = req.query;
  if (!currentVersion) {
    return res.status(400).json({
      success: false,
      message: 'Missing required query parameter: currentVersion.',
    });
  }

  try {
    // dynamically import the ESM module
    const { default: gplay } = await import('google-play-scraper');

    // fetch the Play Store listing
    const { version: latestVersion } = await gplay.app({ appId: PLAY_STORE_ID });

    // coerce to semver and compare
    const cv = semver.coerce(currentVersion);
    const lv = semver.coerce(latestVersion);
    const updateAvailable = semver.lt(cv, lv);

    return res.json({
      success: true,
      currentVersion,
      latestVersion,
      updateAvailable:false,//please change it letter to updateAvailable
    });
  } catch (err) {
    console.error('Version check error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch app details from Play Store.',
      error: err.message,
    });
  }
};

module.exports = {
  appupdate,
};
