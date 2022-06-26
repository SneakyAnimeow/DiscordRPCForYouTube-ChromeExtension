//SETUP SERVICE WORKER START
let lifeline;

keepAlive();

function keepAliveForced() {
  lifeline?.disconnect();
  lifeline = null;
  keepAlive();
}

async function keepAlive() {
  if (lifeline) return;
  for (const tab of await chrome.tabs.query({ url: '*://*/*' })) {
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: () => chrome.runtime.connect({ name: 'keepAlive' }),
      });
      chrome.tabs.onUpdated.removeListener(retryOnTabUpdate);
      return;
    } catch (e) {}
  }
  chrome.tabs.onUpdated.addListener(retryOnTabUpdate);
}

async function retryOnTabUpdate(tabId, info, tab) {
  if (info.url && /^(file|https?):/.test(info.url)) {
    keepAlive();
  }
}

chrome.runtime.onConnect.addListener(port => {
  if (port.name === 'keepAlive') {
    lifeline = port;
    setTimeout(keepAliveForced, 295e3);
    port.onDisconnect.addListener(keepAliveForced);
  }
});
//SETUP SERVICE WORKER END

// const getVideoDetails = () => {
//   return {title: document.getElementsByClassName("title")[2].getElementsByTagName("yt-formatted-string")[0].innerHTML,
//     channel: document.getElementById("channel-name").getElementsByTagName("a")[0].innerHTML
//   };
// }

setInterval(() => {
  chrome.tabs.query({audible: true, muted: false}, (tabs) => {
    let author = "";
    let title = tabs[0].title.replace("- YouTube", "");

    if(title.includes("-")){
      author = title.split(/-(.*)/s)[0];
      title = title.split(/-(.*)/s)[1];
    }

    fetch('http://localhost:36789/api/presence/post', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        author: author,
        title: title,
        link: tabs[0].url,
      }),
    });
  });
}, 2000);