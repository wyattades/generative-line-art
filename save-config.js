/*
  Saves and loads config from localStorage
*/

const elements = document.getElementById('controls').elements;
const keys = Object.keys(elements);

const getConfig = () => {
  const config = {};
  for (const key of keys) {
    config[key] = elements[key].value;
  }
  return config;
};

const setConfig = (config) => {
  for (const key of keys) {
    if (config.hasOwnProperty(key)) {
      elements[key].value = config[key];
    }
  }
};

// document.getElementById('save-config').onclick = () => {
//   const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(getConfig()));
//   const $download = document.createElement('a');
//   $download.setAttribute('href', dataStr);
//   $download.setAttribute('download', 'line-art-config.json');
//   $download.click();
//   $download.remove();
// };

document.getElementById('save-config').onclick = () => {
  localStorage.setItem('config', JSON.stringify(getConfig()));
};

document.getElementById('load-config').onclick = () => {
  const config = localStorage.getItem('config');
  if (config) {
    try {
      return setConfig(JSON.parse(config));
    } catch(_) {
      // Do nothing
    }
  }

  console.log('Failed to load previous config');
};
