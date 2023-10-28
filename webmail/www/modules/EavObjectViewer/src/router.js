import Vue from 'vue';
import Router from 'vue-router';
import ObjectTable from './components/ObjectTable.vue';

Vue.use(Router);

export default new Router({
  routes: [
    // {
    //   path: '/',
    //   name: 'home',
    //   component: ObjectTable,
    // },
    {
      path: '/list/:id/',
      name: 'ObjectTable',
      components: {
        default: ObjectTable,
      },
      props: {
        default: true,
      },
    },
  ],
});
