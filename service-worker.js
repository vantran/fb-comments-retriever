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
    let params = url.href.split('#')[1];
    let accessToken = params.split('&')[0].split('=')[1];

    await chrome.storage.local.set({ userAccessToken: accessToken });

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
        await chrome.storage.local.set({ pageAccessToken: data.access_token });
        break;
      }
    }
  }
});

