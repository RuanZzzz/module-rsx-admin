<script setup>
import { onMounted, reactive, ref } from 'vue';
import { Plus, RefreshCw, Save, Trash2 } from 'lucide-vue-next';
import { moduleApi } from '../api/resources';

const rows = ref([]);
const editingCode = ref('');
const errorMessage = ref('');
const form = reactive({
  code: '',
  name: '',
  type: 'business',
  status: 'enabled',
  remark: ''
});

function resetForm() {
  editingCode.value = '';
  Object.assign(form, {
    code: '',
    name: '',
    type: 'business',
    status: 'enabled',
    remark: ''
  });
}

async function loadRows() {
  errorMessage.value = '';
  try {
    rows.value = await moduleApi.list();
  } catch (error) {
    console.warn('[modules] load failed', error);
    errorMessage.value = error.message;
  }
}

function editRow(row) {
  editingCode.value = row.code;
  Object.assign(form, row);
}

async function saveRow() {
  try {
    if (editingCode.value) {
      await moduleApi.update(editingCode.value, form);
    } else {
      await moduleApi.create(form);
    }
    resetForm();
    await loadRows();
  } catch (error) {
    console.warn('[modules] save failed', error);
    errorMessage.value = error.message;
  }
}

async function removeRow(code) {
  try {
    await moduleApi.remove(code);
    await loadRows();
  } catch (error) {
    console.warn('[modules] remove failed', error);
    errorMessage.value = error.message;
  }
}

onMounted(loadRows);
</script>

<template>
  <section class="page-section">
    <div class="page-heading">
      <div>
        <h1>模块管理</h1>
        <p>维护系统功能模块</p>
      </div>
      <button class="secondary-button" type="button" @click="loadRows">
        <RefreshCw :size="16" />
        <span>刷新</span>
      </button>
    </div>

    <p v-if="errorMessage" class="error-text">{{ errorMessage }}</p>

    <form class="editor-grid" @submit.prevent="saveRow">
      <input v-model="form.code" placeholder="code" :disabled="Boolean(editingCode)" />
      <input v-model="form.name" placeholder="name" />
      <input v-model="form.type" placeholder="type" />
      <select v-model="form.status">
        <option value="enabled">enabled</option>
        <option value="disabled">disabled</option>
      </select>
      <input v-model="form.remark" placeholder="remark" />
      <button class="primary-button" type="submit">
        <Save v-if="editingCode" :size="16" />
        <Plus v-else :size="16" />
        <span>{{ editingCode ? '保存' : '新增' }}</span>
      </button>
    </form>

    <table class="data-table">
      <thead>
        <tr>
          <th>编码</th>
          <th>名称</th>
          <th>类型</th>
          <th>状态</th>
          <th>备注</th>
          <th>操作</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in rows" :key="row.code">
          <td>{{ row.code }}</td>
          <td>{{ row.name }}</td>
          <td>{{ row.type }}</td>
          <td>{{ row.status }}</td>
          <td>{{ row.remark }}</td>
          <td class="table-actions">
            <button type="button" @click="editRow(row)">编辑</button>
            <button type="button" @click="removeRow(row.code)">
              <Trash2 :size="15" />
            </button>
          </td>
        </tr>
      </tbody>
    </table>
  </section>
</template>
