/**
 * Importing the file below initializes the extension background.
 *
 * Warnings:
 * 1. Do not remove the import statement below. It is required for the extension to work.
 *    If you don't need createBridge(), leave it as "import '#q-app/bex/background'".
 * 2. Do not import this file in multiple background scripts. Only once!
 * 3. Import it in your background service worker (if available for your target browser).
 */
import {
  createBridge
} from '#q-app/bex/background'

function openExtension() {
  // chrome.tabs.create({
  //     url: chrome.runtime.getURL('www/index.html')
  //   },
  //   ( /* newTab */ ) => {
  //     // Tab opened.
  //   }
  // )

  chrome.runtime.onConnect.addListener(function (port) {
    port.onDisconnect.addListener(function () {
      // console.log("消息通道已关闭，尝试重新连接或进行相应处理");
      // // 这里可以添加重新建立连接的代码逻辑，比如调用某个初始化函数等
      // if (port.name.startsWith('content@')) {
      //   port.connectToBackground();
      // }
    });
  });

  // chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
  //   if (changeInfo.status === 'complete' && tab.active) {

  //     chrome.tabs.query({
  //       active: false
  //     }, function (tabs) {
  //       tabs.forEach(function (tab) {
  //         chrome.tabs.sendMessage(tab.id, {
  //           isCurrent: false
  //         });
  //       });
  //     });

  //     console.log('当前活动id：', tabId)
  //     chrome.tabs.sendMessage(tabId, {
  //       isCurrent: true
  //     });

  //   }
  // });
  // chrome.tabs.onActivated.addListener(function (activeInfo) {
  //   let activeTabId = activeInfo.tabId;
  //   chrome.tabs.query({
  //     active: false
  //   }, function (tabs) {
  //     tabs.forEach(function (tab) {
  //       chrome.tabs.sendMessage(tab.id, {
  //         isCurrent: false
  //       });
  //     });
  //   });

  //   console.log('当前活动id：', activeTabId)
  //   chrome.tabs.sendMessage(activeTabId, {
  //     isCurrent: true
  //   });
  // });
}

chrome.runtime.onInstalled.addListener(openExtension)
chrome.action.onClicked.addListener(openExtension)

/**
 * Call useBridge() to enable communication with the app & content scripts
 * (and between the app & content scripts), otherwise skip calling
 * useBridge() and use no bridge.
 */
const bridge = createBridge({
  debug: false
})

bridge.on('log', ({
  from,
  payload
}) => {
  console.log(`[BEX] @log from "${ from }"`, payload)
})

bridge.on('getTime', () => {
  return Date.now()
})

bridge.on('storage.get', ({
  payload
}) => {
  return new Promise(resolve => {
    if (payload === void 0) {
      chrome.storage.local.get(null, items => {
        // Group the values up into an array to take advantage of the bridge's chunk splitting.
        resolve(Object.values(items))
      })
    } else {
      chrome.storage.local.get([payload], items => {
        resolve(items[payload])
      })
    }
  })
})
// Usage:
// bridge.send({
//   event: 'storage.get',
//   to: 'background',
//   payload: key
// }).then(responsePayload => { ... }).catch(err => { ... })

bridge.on('storage.set', async ({
  payload
}) => {
  console.log('receive storage.set')
  await chrome.storage.local.set({
    [payload.key]: payload.value
  })
})
// Usage:
// bridge.send({
//   event: 'storage.set',
//   to: 'background',
//   payload: { key: 'someKey', value: 'someValue' }
// }).then(responsePayload => { ... }).catch(err => { ... })

bridge.on('storage.remove', async ({
  payload
}) => {
  await chrome.storage.local.remove(payload)
})


bridge.on('to.background', async ({
  payload
}) => {
  console.log('reached background script');


  bridge.portList.forEach(portName => {
    bridge.send({
      event: 'handle.modal',
      to: portName,
      payload: payload
    })
  })
});

bridge.on('to.background.check', async () => {

  bridge.portList.forEach(portName => {
    bridge.send({
      event: 'handle.check',
      to: portName
    })
  })
});

bridge.on('handle.modalClear', async () => {
  bridge.send({
    event: 'handle.modalClear',
    to: 'app'
  });
})
