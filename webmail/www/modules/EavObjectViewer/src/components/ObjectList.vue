<template>
  <div class="list">
    <div class="ui input fluid">
      <input
        v-model="apiUrlInput"
        type="text"
        @keypress.13="onApiUrlEnter"
      >
    </div>
    <ul>
      <li
        v-for="(item, index) in items"
        :key="index"
        :class="{'selected': currObject === item.value}"
        @click="openList(item)"
      >
        {{ item.name }}
      </li>
    </ul>
  </div>
</template>

<script>
import _ from 'lodash';

export default {
  name: 'ObjectList',
  data() {
    return {
      apiUrlInput: '',
      items: [],
      currObject: null,
    };
  },
  watch: {
    // eslint-disable-next-line func-names
    '$store.state.currentObjectName': function (v) {
      console.log(this);
      this.currObject = v;
    },
    // eslint-disable-next-line func-names
    '$store.state.objectsList': function (v) {
      this.createObjectList(v);
    },
  },
  mounted() {
    this.apiUrlInput = this.$store.state.apiUrl;
    this.currObject = this.$store.state.currentObjectName;
  },
  methods: {
    createObjectList(v) {
      if (v) {
        const list = [];
        _.each(v, (item) => {
          list.push({
            name: item.replace('Aurora_Modules', '').replace(/_/g, ' '),
            value: item,
          });
        });
        this.items = list;
      }
    },
    openList(item) {
      this.$router.push({ name: 'ObjectTable', params: { id: item.value } });
    },
    onApiUrlEnter() {
      this.$store.dispatch('setAppUrl', this.apiUrlInput);
    },
  },
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style lang="scss" scoped>
.list {
  padding: 20px 0px 20px;
  background: #eee;
  min-width: 300px;
  overflow-y: auto;
  flex-shrink: 0;

  .input {
    margin: 0px 10px 20px;
  }

  ul {
    list-style-type: none;
    margin: 0px;
    padding: 0px;

    li {
      cursor: pointer;
      margin: 0px;
      padding: 4px 16px;
      white-space: nowrap;

      &:hover {
        background: #ddd;
      }

      &.selected {
        background: #ccc;
      }
    }
  }
}
</style>
