import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux'
import store from './store'
import './index.css';
import App from './App';
import installAuthInterceptor from './authInterceptor';
import { initStoreBrand } from './components/storeBrand';

installAuthInterceptor(store);
// Paint the store's name and colour straight away, then refresh them from the server.
initStoreBrand();

ReactDOM.render(
  <Provider store={store}>
    <App />
  </Provider>,
  document.getElementById('root')
);
