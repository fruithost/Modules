import Vue from 'vue';
import VueMaterial from 'vue-material';
import 'vue-material/dist/vue-material.min.css';
import { ServerTable, ClientTable } from 'vue-tables-2';
// eslint-disable-next-line import/extensions
import SweetModal from 'sweet-modal-vue/src/plugin.js';

import App from './App.vue';
import router from './router';
import store from './store';

Vue.use(VueMaterial);
Vue.use(ServerTable);
Vue.use(ClientTable);
Vue.use(SweetModal);

Vue.config.productionTip = false;

new Vue({
  router,
  store,
  render: h => h(App),
}).$mount('#app');
