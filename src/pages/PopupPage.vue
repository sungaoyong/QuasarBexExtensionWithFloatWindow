<!--
 * @Author: sungaoyong 18523958@qq.com
 * @Date: 2024-12-19 14:32:11
 * @LastEditors: sungaoyong 18523958@qq.com
 * @LastEditTime: 2025-01-09 16:45:34
 * @FilePath: \onlinecheck\src\pages\PopupPage.vue
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
-->
<template>
  <q-card class="my-card">
    <q-card-section horizontal>
      <q-card-section class="q-pt-xs">
        <div class="text-h6 q-mt-sm q-mb-xs">Quasar Bex Extension</div>
        <div class="text-caption text-grey">Quasar Bex Extension With FloatWindow</div>
      </q-card-section>
    </q-card-section>
    <q-card-actions align="right">
      <q-btn flat round color="primary" icon="my_location" @click="handleSendToBackgroundScript">
        <q-tooltip transition-show="flip-right" transition-hide="flip-left"> CHECK </q-tooltip>
      </q-btn>
    </q-card-actions>
  </q-card>
</template>

<script lang="js" setup>
import { useQuasar } from 'quasar';

const $q = useQuasar();

const handleSendToBackgroundScript = async () => {
  //await $q.bex.send('to.background', { open: true });
  $q.bex.send({
  event: 'to.background',
  to: 'background',
  payload:  { open: true }
  }).then(responsePayload => {
    console.log(responsePayload);
  }).catch(err => {
    console.log(err)
  })
};
</script>

<style lang="scss" scoped>
.card {
  height: 100px;
  position: relative;
  border-radius: 5px;
}
</style>
