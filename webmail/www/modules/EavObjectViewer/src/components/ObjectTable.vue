<template>
  <div class="main-panel ui">
    <h1>{{ title }}</h1>
    <div class="vuetable-pagination ui basic segment grid">
      <select
        v-model="searchField"
        class="ui dropdown"
        style="width: 250px; min-height:46px;"
      >
        <option value="">
          None
        </option>
        <option
          v-for="(field, index) in fields"
          :key="index"
          :value="field"
        >
          {{ field }}
        </option>
      </select>
      <div class="ui icon input">
        <input
          v-model="searchText"
          type="text"
          placeholder="Search"
          @keypress.13="onEnter"
        >
      </div>
    </div>
    <div
      v-if="!loading"
      class="vuetable-pagination ui basic segment grid"
    >
      <vuetable-pagination-info
        ref="paginationInfo"
      />
      <div class="ui icon input">
        <input
          v-model="perPageInput"
          type="text"
          placeholder="Per page"
          @keypress.13="onEnter"
        >
      </div>
      <vuetable-pagination
        ref="pagination"
        @vuetable-pagination:change-page="onChangePage"
      />
    </div>
    <div v-if="loading">
      Loading...
    </div>
    <div
      v-if="currentObjectName"
      class="table-container"
    >
      <vuetable
        v-show="!loading"
        ref="vuetable"
        :api-url="apiUrl"
        :fields="tableHeaders"
        data-path="result.Values"
        pagination-path="result.pagination"
        http-method="post"
        :http-fetch="getObjectData"
        :per-page="1*perPage"
        track-by="EntityId"
        @vuetable:pagination-data="onPaginationData"
        @vuetable:checkbox-toggled="onCheckboxToggled"
        @vuetable:checkbox-toggled-all="onCheckboxToggled"
        @vuetable:row-dblclicked="onRowClick"
      >
        <template
          slot="actions"
          scope="props"
        >
          <div class="table-button-container">
            <!-- <button class="ui button" @click="editRow(props.rowData, props)">Edit</button> -->
            <button
              class="ui basic red button"
              @click="deleteRow(props.rowData)"
            >
              Delete
            </button>
          </div>
        </template>
      </vuetable>
    </div>
    <div
      v-if="selectedEntityIds.length > 0"
      class="table-button-container"
    >
      Selected items EntityId: {{ selectedEntityIds }}
      <button
        class="ui basic red button"
        @click="deleteRows"
      >
        Delete
      </button>
    </div>
    <sweet-modal
      ref="modalEditor"
      width="800px"
      blocking
      overlay-theme="dark"
    >
      <div>
        <h2>{{ title }}</h2>
        <div class="ui form">
          <div class="buttons">
            <button
              class="ui primary button"
              @click="saveData"
            >
              Save
            </button>
            <button
              class="ui button"
              @click="onCancelEdit"
            >
              Cancel
            </button>
          </div>
          <div class="grid stackable two column ui">
            <div
              v-for="(field,index) in editedRow"
              :key="index"
              class="column field"
            >
              <label>{{ field.name }}</label>
              <input
                v-model="field.value"
                type="text"
              >
            </div>
          </div>
          <div class="buttons">
            <button
              class="ui primary button"
              @click="saveData"
            >
              Save
            </button>
            <button
              class="ui button"
              @click="onCancelEdit"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </sweet-modal>
  </div>
</template>

<script>
import Vuetable from 'vuetable-2/src/components/Vuetable.vue';
import VuetablePagination from 'vuetable-2/src/components/VuetablePagination.vue';
import VuetablePaginationInfo from 'vuetable-2/src/components/VuetablePaginationInfo.vue';
import axios from 'axios';
import _ from 'lodash';

export default {
  name: 'ObjectTable',
  components: {
    Vuetable,
    VuetablePagination,
    VuetablePaginationInfo,
  },
  props: {
    id: {
      type: String,
      default: '',
    },
  },
  data() {
    return {
      currentObjectName: '',
      fields: [],
      tableHeaders: [],
      currPage: 1,
      perPageInput: '10',
      loading: false,
      selectedEntityIds: [],
      searchField: '',
      searchText: '',
      editedRow: [],
      rowNumber: 0,
    };
  },
  computed: {
    // get only
    apiUrl() {
      return `${this.$store.state.apiUrl}-action`;
    },
    title() {
      return this.currentObjectName.replace('Aurora_Modules', '').replace(/_/g, ' ');
    },
    perPage() {
      let newValue = 10;
      const currValue = parseInt(Number(this.perPageInput), 10);
      // eslint-disable-next-line no-restricted-globals
      if (!isNaN(currValue) && currValue > 0) {
        newValue = currValue;
      }

      return newValue;
    },
  },
  watch: {
    // eslint-disable-next-line func-names
    '$store.state.currentObjectName': function (v) {
      this.currentObjectName = v;
      this.currPage = 1;
      this.$refs.vuetable.reload();
    },
    id(v) {
      this.$store.dispatch('setObjectsName', v);
    },
  },
  mounted() {
    console.log('mounted this.$store.state.currentObjectName', this.$store.state.currentObjectName);
    this.currentObjectName = this.$store.state.currentObjectName;
  },
  methods: {
    getObjectData() {
      console.log('this.currentObjectName', this.currentObjectName);
      this.$refs.vuetable.selectedTo = [];
      this.selectedEntityIds = [];

      this.loading = true;
      const iOffset = (this.currPage - 1) * parseInt(this.perPage, 10);
      const self = this;
      const aObj = axios({
        url: `${this.apiUrl}`,
        method: 'post',
        // headers: { 'Content-Type': 'text/plain' },
        data: `action=list&ObjectName=${this.currentObjectName}&offset=${iOffset}&limit=${this.perPage}&searchField=${this.searchField}&searchText=${this.searchText}`,
      });
      aObj.then((response) => {
        self.loading = false;
        self.rowNumber = 0;
        if (response.data && response.data.result) {
          if (response.data.result.Fields) {
            self.setFields(response.data.result.Fields);
          }
          if (response.data.result.Values) {
            self.rowNumber = response.data.result.Values.length;
          }

          self.$nextTick(() => {
            // this is required because vuetable uses tableFields internally, not fields
            self.$refs.vuetable.normalizeFields();
            // self.$refs.vuetable.reload()
          });
        }
      });
      return aObj;
    },
    setFields(data) {
      const fields = _.keys(data);
      this.fields = fields;
      this.tableHeaders = _.concat('__checkbox', '__slot:actions', 'EntityId', fields);
    },
    deleteRow(rowData) {
      // eslint-disable-next-line no-alert, no-restricted-globals
      if (rowData.EntityId > 0 && confirm(`The object with the EntityId: ${rowData.EntityId} will be deleted`)) {
        axios({
          url: `${this.apiUrl}`,
          method: 'post',
          // headers: { 'Content-Type': 'text/plain' },
          data: `action=delete&ids=${rowData.EntityId}`,
        })
          .then(() => {
            this.pagingCorrection(1);
            this.$nextTick(() => {
              this.$refs.vuetable.reload();
            });
          });
      }
    },
    deleteRows() {
      const confirmText = `The objects with the following EntityIds will be deleted: ${this.selectedEntityIds.join()}`;
      // eslint-disable-next-line no-alert, no-restricted-globals
      if (this.selectedEntityIds.length > 0 && confirm(confirmText)) {
        axios({
          url: `${this.apiUrl}`,
          method: 'post',
          // headers: { 'Content-Type': 'text/plain' },
          data: `action=delete&ids=${this.selectedEntityIds.join(',')}`,
        })
          .then(() => {
            this.pagingCorrection(this.selectedEntityIds.length);
            this.$nextTick(() => {
              this.$refs.vuetable.reload();
            });
          });
      }
    },
    pagingCorrection(itemsNumber) {
      const pageData = this.$refs.pagination;
      const remainingItems = this.rowNumber - itemsNumber;
      if (remainingItems === 0 && pageData.isOnLastPage && !pageData.isOnFirstPage) {
        this.onChangePage('prev');
      }
    },
    onCheckboxToggled() {
      this.selectedEntityIds = this.$refs.vuetable.selectedTo;
    },
    onPaginationData(paginationData) {
      if (paginationData) {
        const newPaginationData = _.clone(paginationData);
        newPaginationData.next_page_url = `${this.apiUrl}`;
        newPaginationData.prev_page_url = `${this.apiUrl}`;
        newPaginationData.last_page = Math.ceil(paginationData.total / parseInt(this.perPage, 10));
        newPaginationData.current_page = this.currPage;

        this.$refs.pagination.setPaginationData(newPaginationData);
        this.$refs.paginationInfo.setPaginationData(newPaginationData);
      }
    },
    onChangePage(page) {
      if (page === 'next') {
        this.currPage += 1;
      } else if (page === 'prev') {
        this.currPage -= 1;
      } else {
        this.currPage = page;
      }
      this.$refs.vuetable.changePage(page);
    },
    saveData() {
      const dataForSave = {};
      _.each(this.editedRow, (field) => {
        dataForSave[field.name] = field.value;
      });

      const properties = JSON.stringify(dataForSave);
      axios({
        url: `${this.apiUrl}`,
        method: 'post',
        // headers: { 'Content-Type': 'text/plain' },
        // data: `action=edit&manager=objects&ObjectName=${this.id}&${dataForSave.join('&')}`,
        data: `action=edit&manager=objects&ObjectName=${this.currentObjectName}&properties=${properties}`,
      })
        .then(() => {
          this.$nextTick(() => {
            this.editedRow = [];
            this.$refs.vuetable.reload();
            this.$refs.modalEditor.close();
          });
        });
    },
    onRowClick(row) {
      const rowData = [];
      _.each(row, (value, key) => {
        rowData.push({
          name: key,
          value,
        });
      });

      this.editedRow = rowData;
      this.$refs.modalEditor.open();
    },
    onCancelEdit() {
      this.editedRow = [];
      this.$refs.modalEditor.close();
    },
    onEnter() {
      if (parseInt(Number(this.perPageInput), 10) !== this.perPage) {
        this.perPageInput = this.perPage;
      }
      this.currPage = 1;
      this.$refs.vuetable.reload();
    },
  },
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style lang="scss">
.ui {
  &.form {
    text-align: left;
  }
}
.main-panel {
  padding: 20px 40px;
  overflow: auto;
}
.table-container {
  overflow: auto;
  padding: 1px;
}
.sweet-content-content .buttons {
  text-align: right;
  margin: 0px 0px 10px;
}
</style>
