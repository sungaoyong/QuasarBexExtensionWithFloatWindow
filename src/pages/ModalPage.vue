<!--
 * @Author: sungaoyong 18523958@qq.com
 * @Date: 2024-12-19 14:32:11
 * @LastEditors: sungaoyong 18523958@qq.com
 * @LastEditTime: 2025-01-09 16:47:45
 * @FilePath: \onlinecheck\src\pages\ModalPage.vue
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
-->
<template>
  <q-layout>
    <!-- <q-page-sticky position="bottom-right" :offset="windowPos"> -->
    <!-- <div style="box-shadow: 5px 5px 10px rgba(0, 0, 0, 0.3)"> -->
    <q-card flat class="my-card">
      <q-card-section class="flex column">
        <div class="q-gutter-y-xs">
          <div class="fit row">
            <q-btn
              size="sm"
              color="primary"
              class="col"
              push
              label="CHECK"
              @click="handleSendToBackgroundCheck"
            />
          </div>
        </div>
      </q-card-section>
    </q-card>
    <q-card class="my-card">
      <q-card-section>
        <div v-html="result"></div>
      </q-card-section>
    </q-card>
    <!-- </div> -->
    <!-- </q-page-sticky> -->
  </q-layout>
</template>

<script lang="js" setup>
import { useQuasar } from 'quasar';
import { ref, onMounted, onBeforeUnmount } from 'vue';


const $q = useQuasar();
let result = ref();


onMounted(() => {
  // Mousetrap.bind('up', handleSendToBackgroundPre);
  // Mousetrap.bind('down', handleSendToBackgroundNext);
  // Mousetrap.bind('left', handleSendToBackgroundPreImg);
  // Mousetrap.bind('right', handleSendToBackgroundNextImg);
});

// 在组件销毁前解绑快捷键，避免内存泄漏等问题
onBeforeUnmount(() => {
  // Mousetrap.unbind('up');
  // Mousetrap.unbind('down');
  // Mousetrap.unbind('left');
  // Mousetrap.unbind('right');
});
// 下一个
const handleSendToBackgroundCheck = async () => {
  if(! $q.bex.isConnected){
   await $q.bex.connectToBackground();
  }
  $q.bex.off('handle.toFrontResult');
  $q.bex.on('handle.toFrontResult', async ({ payload }) => {
      result.value = payload;
  });
  $q.bex.off('handle.modalClear');
  $q.bex.on('handle.modalClear', async () => {
      result.value = '';
  });

  //await $q.bex.send('to.background.check');
  $q.bex.send({
  event: 'to.background.check',
  to: 'background'
  }).then(responsePayload => {
    console.log(responsePayload);
  }).catch(err => {
    console.log(err)
  });

};


</script>
<style lang="scss" scoped>
.my-card {
  //border-top: 4px solid gray;
  width: 100%;
  max-width: 350px;
  min-width: 350px;
  height: auto;
  //border-radius: 4px;
  box-shadow: none;
  p {
    margin: 1px;
  }
}
</style>
