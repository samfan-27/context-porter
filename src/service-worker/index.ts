chrome.runtime.onInstalled.addListener(() => {
  // This is the extension event hub. It does not access the DOM.
  console.log('ContextPorter installed');
});
