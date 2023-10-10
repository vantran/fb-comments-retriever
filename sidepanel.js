async function getCurrentTab() {
  let queryOptions = { active: true, lastFocusedWindow: true };
  // `tab` will either be a `tabs.Tab` instance or `undefined`.
  let [tab] = await chrome.tabs.query(queryOptions);
  return tab;
}

document.addEventListener('DOMContentLoaded', async () => {
  chrome.storage.local.get(['userAccessToken', 'pageAccessToken'], function (result) {
    if (result.userAccessToken) {
      document.getElementById("user-access-token").innerHTML = result.userAccessToken;
    }

    if (result.pageAccessToken) {
      document.getElementById("page-access-token").innerHTML = result.pageAccessToken;
    }
  });

  const tab = await getCurrentTab();
  const url = new URL(tab.url);
  const postId = url.href.split("/posts/")[1];
  document.getElementById("post-id").value = postId;
});

chrome.storage.onChanged.addListener((changes, namespace) => {
  for (let [key, { oldValue, newValue }] of Object.entries(changes)) {
    if (key === 'userAccessToken') {
      document.getElementById("user-access-token").innerHTML = newValue;
    }

    if (key === 'pageAccessToken') {
      document.getElementById("page-access-token").innerHTML = newValue;
    }
  }
});


const fbLoginBtn = document.getElementById('fb-login');
fbLoginBtn.addEventListener('click', async () => {
  const { appId } = await chrome.storage.sync.get({ appId: '1175093920071946' });
  const scopes = 'email,openid,pages_show_list,pages_read_engagement,pages_read_user_content,public_profile';
  const redirectUri = 'https://www.facebook.com/connect/login_success.html';
  const url = `https://www.facebook.com/dialog/oauth?client_id=${appId}&response_type=token&scope=${scopes}&redirect_uri=${redirectUri}`;
  // redirect to url
  window.open(url, '_blank');
});

const getCommentsBtn = document.getElementById('get-comments');
getCommentsBtn.addEventListener('click', async () => {
  const results = document.getElementById('results');
  results.innerHTML = 'Getting comments... Please wait...';

  const { pageId } = await chrome.storage.sync.get(['pageId']);
  const { pageAccessToken } = await chrome.storage.local.get(['pageAccessToken']);
  const postId = document.getElementById('post-id').value;
  let url = `https://graph.facebook.com/v18.0/${pageId}_${postId}/comments?limit=30&access_token=${pageAccessToken}`;

  const rows = [
    ["Name", "User ID", "Comment", "Comment ID", "Comment URL", "Created Time"],
  ];

  while (true) {
    const response = await fetch(url);
    const json = await response.json();

    try {
      json.data.forEach(comment => {
        const msg = comment.message.replaceAll('"', '\"');
        const commentId = comment.id.split("_")[1];
        const commentUrl = `https://www.facebook.com/${postId}?comment_id=${commentId}`

        rows.push([
          comment.from.name,
          comment.from.id,
          `"${msg}"`,
          comment.id,
          commentUrl,
          comment.created_time,
        ]);
      });
    } catch (e) {
      results.innerHTML = `Error getting comments: ${e.message}.<br /><strong>Maybe you need to relogin.</strong`;
      return;
    }

    if (json.paging && json.paging.next) {
      url = json.paging.next;
    } else {
      break;
    }
  }

  setTimeout(() => {
    results.innerHTML = '';
  }, 750);

  let csvContent = "data:text/csv;charset=utf16le,\uFEFF" + rows.map(e => e.join("\t")).join("\r\n");
  var encodedUri = encodeURI(csvContent);
  var link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", "my_data.csv");
  document.body.appendChild(link); // Required for FF

  link.click();
});
