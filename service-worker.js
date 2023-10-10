const allowedUrl = 'https://www.facebook.com';
const successURL = 'https://www.facebook.com/connect/login_success.html';

// Allows users to open the side panel by clicking on the action toolbar icon
chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error(error));

chrome.tabs.onUpdated.addListener(async (tabId, info, tab) => {
  if (!tab.url) return;
  const url = new URL(tab.url);

  if (url.origin === allowedUrl) {
    await chrome.sidePanel.setOptions({
      tabId,
      path: 'sidepanel.html',
      enabled: true
    });
  } else {
    // Disables the side panel on all other sites
    await chrome.sidePanel.setOptions({
      tabId,
      enabled: false
    });
  }

  if (url.href.startsWith(successURL)) {
    console.log("Found successURL: " + url.href);
    // https://www.facebook.com/connect/login_success.html#access_token=EAAQsvdZBvAQoBOwQackT6rzKvZABtYZCYwR2rbL5TmmDSn0jE8YW9exqqCsE4BhUGo2QBZArMZB3AP8PJNu7epLKrjUb01eKzaxjlXnMZCg6CXYyauW4fS5E10pRi233tfa6MwV3O5Uaidn8guJrgaikZCyN97ta0lFPK8lwyCizTWZCCEAHq0LyixgZCRIuhEOIwH6CtZBtA3bzIX3uMZCY1QxlY9Acx74OWsZD&data_access_expiration_time=1704651997&expires_in=5603
    let params = url.href.split('#')[1];

    let accessToken = params.split('&')[0].split('=')[1];
    console.log("accessToken: " + accessToken);

    chrome.storage.local.set({ userAccessToken: accessToken }).then(() => {
      console.log("User Access Token is set to " + accessToken);
    });

    try {
      chrome.tabs.remove(tab.id);
    } catch (error) {
      console.log("Error: " + error);
    }

    // get the page access token
    const { pageId } = await chrome.storage.sync.get({ pageId: '' });

    const pageAccessTokenUrl = `https://graph.facebook.com/me/accounts?access_token=${accessToken}`;
    const response = await fetch(pageAccessTokenUrl);
    const json = await response.json();
    for (let i = 0; i < json.data.length; i++) {
      const data = json.data[i];
      if (data.id === pageId) {
        chrome.storage.local.set({ pageAccessToken: data.access_token }).then(() => {
          console.log("Page Access Token is set to " + data.access_token);
        });
        break;
      }
    }
  }
});

