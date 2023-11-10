<template>
  <vuetable
    ref="vuetable"
    :api-mode="false"
    :data="gridData"
    :fields="fields"
  >
    <template
      slot="inputField"
      scope="props"
    >
      <div class="custom-actions">
        <input @click="function () {props;}">
      </div>
    </template>
  </vuetable>
</template>
<script>
import Vuetable from 'vuetable-2';

export default {
  components: {
    Vuetable,
  },
  data() {
    return {
      gridData: [
        {
          id: 1,
        },
      ],
      fields: [
        {
          name: '__slot:inputField',
          title: 'Input Field',
        },
      ],
    };
  },

};
</script>
