/*
 * @Author: sungaoyong 18523958@qq.com
 * @Date: 2024-12-30 11:00:49
 * @LastEditors: sungaoyong 18523958@qq.com
 * @LastEditTime: 2024-12-30 11:07:17
 * @FilePath: \onlineCheckV1\src\router\routes.js
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
const routes = [{
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [{
      path: '',
      component: () => import('pages/IndexPage.vue')
    }]
  },

  {
    path: '/popup',
    component: () => import('pages/PopupPage.vue'),
  },
  {
    name: 'modal',
    path: '/modal',
    component: () => import('pages/ModalPage.vue'),
  },

  // Always leave this as last one,
  // but you can also remove it
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue')
  }
]

export default routes
