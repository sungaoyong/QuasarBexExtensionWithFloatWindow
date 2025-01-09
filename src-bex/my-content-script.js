/**
 * Importing the file below initializes the content script.
 *
 * Warning:
 *   Do not remove the import statement below. It is required for the extension to work.
 *   If you don't need createBridge(), leave it as "import '#q-app/bex/content'".
 */
import {
  createBridge
} from '#q-app/bex/content'

// The use of the bridge is optional.
const bridge = createBridge({
  debug: false
})

//let isCurentRunTab = false


bridge.connectToBackground()
  .then(() => {
    console.log('Connected to background')
    // chrome.runtime.onMessage.addListener(function (message) {
    //   if (message.isCurrent) {
    //     console.log("当前页面的内容脚本正在运行");
    //   }
    //   isCurentRunTab = message.isCurrent

    // });
  })
  .catch(err => {
    console.error('Failed to connect to background:', err)
  })

async function checkReConnect() {
  if (bridge.isConnected == false) {
    console.log('内容脚本丢失连接，重新连接到后台脚本');
    await bridge.connectToBackground();
  }
}

function createDraggableWindow() {
  // 创建可拖动窗口的DOM元素
  const draggableWindow = document.createElement('div');
  draggableWindow.id = 'draggable-window-quasar';
  draggableWindow.style.visibility = 'hidden';
  draggableWindow.style.position = 'absolute';
  draggableWindow.style.width = '350px';
  draggableWindow.style.height = '500px';
  draggableWindow.style.border = '1px solid gray';
  draggableWindow.style.backgroundColor = 'white';
  draggableWindow.style.zIndex = '100003';
  draggableWindow.style.overflow = 'hidden';

  // 创建标题栏元素
  const titleBar = document.createElement('div');
  titleBar.id = 'title-bar';
  titleBar.style.backgroundColor = 'lightgray';
  titleBar.style.padding = '5px';
  titleBar.style.cursor = 'move';
  titleBar.style.height = '25px';

  // 创建关闭按钮元素
  const closeBtn = document.createElement('span');
  closeBtn.id = 'close-btn';
  // closeBtn.textContent = '×';
  closeBtn.className = "btnClose";
  closeBtn.style.float = 'right';
  closeBtn.style.cursor = 'pointer';

  // 标题
  const caption = document.createElement('span');
  caption.id = 'title';
  caption.textContent = 'Bex FloatWindow';
  caption.style.float = 'left';

  // 创建用于调整大小的区域元素
  const resizeHandle = document.createElement('div');
  resizeHandle.className = 'resize-handle';

  // 创建iframe元素
  const iframe = document.createElement('iframe');
  iframe.src = chrome.runtime.getURL('www/index.html#/modal');
  iframe.width = '100%';
  iframe.height = '100%';

  // 将关闭按钮添加到标题栏
  titleBar.appendChild(closeBtn);
  titleBar.appendChild(caption);
  // 将标题栏添加到可拖动窗口
  draggableWindow.appendChild(titleBar);
  // 将调整大小的区域添加到可拖动窗口
  draggableWindow.appendChild(resizeHandle);
  // 将iframe添加到可拖动窗口
  draggableWindow.appendChild(iframe);

  // 将可拖动窗口添加到网页的body元素中（也可以选择其他合适的父元素）
  //document.body.appendChild(draggableWindow);
  document.body.prepend(draggableWindow);

  // 以下是拖动相关的逻辑代码，和之前类似

  let offsetX, offsetY;
  let initialWidth, initialHeight;
  let resizeOffsetX, resizeOffsetY;

  const handleMouseDown = (e) => {
    if (e.target === titleBar) {
      e.preventDefault();
      offsetX = e.clientX - draggableWindow.offsetLeft;
      offsetY = e.clientY - draggableWindow.offsetTop;
      // initialX = draggableWindow.offsetLeft;
      // initialY = draggableWindow.offsetTop;
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    } else if (e.target === resizeHandle) {
      e.preventDefault();
      initialWidth = draggableWindow.offsetWidth;
      initialHeight = draggableWindow.offsetHeight;
      resizeOffsetX = e.clientX;
      resizeOffsetY = e.clientY;
      document.addEventListener('mousemove', handleResizeMouseMove);
      document.addEventListener('mouseup', handleResizeMouseUp);
    }
  };

  const handleMouseMove = (e) => {
    if (e.buttons === 1) {
      e.preventDefault();
      if (e.clientX - offsetX >= 0) {
        draggableWindow.style.left = e.clientX - offsetX + 'px';
      }
      if (e.clientY - offsetY >= 0) {
        draggableWindow.style.top = e.clientY - offsetY + 'px';
      }
    }
  };

  const handleResizeMouseMove = (e) => {
    if (e.buttons === 1) {
      e.preventDefault();
      const newWidth = initialWidth + (e.clientX - resizeOffsetX);
      const newHeight = initialHeight + (e.clientY - resizeOffsetY);
      if (newWidth > 0 && newHeight > 0) {
        draggableWindow.style.width = newWidth + 'px';
        draggableWindow.style.height = newHeight + 'px';
      }
    }
  };

  const handleResizeMouseUp = () => {
    document.removeEventListener('mousemove', handleResizeMouseMove);
    document.removeEventListener('mouseup', handleResizeMouseUp);
  };

  const handleMouseUp = () => {
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };

  const handleCloseClick = async () => {
    draggableWindow.style.display = 'none';
    await checkReConnect();
    bridge.send({
      event: 'handle.modalClear',
      to: 'background'
    });
  };

  titleBar.addEventListener('mousedown', handleMouseDown);
  closeBtn.addEventListener('click', handleCloseClick);
  resizeHandle.addEventListener('mousedown', handleMouseDown);
}

(function () {
  // When the page loads, insert our browser extension app.
  //document.body.prepend(iframe);
  createDraggableWindow();
  // 定时器保证桥接的正常连接
  setInterval(async function () {
    await checkReConnect();
  }, 10000);
})();

// 显示隐藏
const setIFrameHeight = (height) => {
  // iframe.height = height;

  // Object.assign(iframe.style, {
  //   height: height,
  // });
  const draggableWindow = document.getElementById('draggable-window-quasar');
  if (draggableWindow) {
    if (height === '0') {
      draggableWindow.style.visibility = 'hidden';
      draggableWindow.style.display = 'none';
    } else {
      draggableWindow.style.visibility = 'visible';
      draggableWindow.style.display = 'block';
    }
  }
};

bridge.on('handle.modal', async ({
  payload
}) => {
  // if (!isCurentRunTab) {
  //   return;
  // }
  await checkReConnect();
  console.log('reached content script');
  console.log('data: ', payload);

  if (payload.open) {
    setIFrameHeight('100vh');
  } else {
    setIFrameHeight('0');
  }
});
//检查功能
bridge.on('handle.check', async () => {
  await checkReConnect();
  console.log('reached content handle.check');

  const result = `Result from Content Script `;

  bridge.send({
    event: 'handle.toFrontResult',
    to: 'app',
    payload: result
  });
});
