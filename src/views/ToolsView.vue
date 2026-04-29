<script setup>
import { onMounted, reactive, ref } from 'vue';
import { Plus, RefreshCw, Save, Trash2 } from 'lucide-vue-next';
import { toolApi } from '../api/resources';

const rows = ref([]);
const editingId = ref(null);
const errorMessage = ref('');
const form = reactive({
  name: '',
  category: '',
  url: '',
  description: '',
  status: 'enabled'
});

function resetForm() {
  editingId.value = null;
  Object.assign(form, {
    name: '',
    category: '',
    url: '',
    description: '',
    status: 'enabled'
  });
}

async function loadRows() {
  errorMessage.value = '';
  try {
    rows.value = await toolApi.list();
  } catch (error) {
    console.warn('[tools] load failed', error);
    errorMessage.value = error.message;
  }
}

function editRow(row) {
  editingId.value = row.id;
  Object.assign(form, row);
}

async function saveRow() {
  try {
    if (editingId.value) {
      await toolApi.update(editingId.value, form);
    } else {
      await toolApi.create(form);
    }
    resetForm();
    await loadRows();
  } catch (error) {
    console.warn('[tools] save failed', error);
    errorMessage.value = error.message;
  }
}

async function removeRow(id) {
  try {
    await toolApi.remove(id);
    await loadRows();
  } catch (error) {
    console.warn('[tools] remove failed', error);
    errorMessage.value = error.message;
  }
}

onMounted(loadRows);
</script>

<template>
  <section class="page-section">
    <div class="page-heading">
      <div>
        <h1>教学工具</h1>
        <p>维护课堂工具入口</p>
      </div>
      <button class="secondary-button" type="button" @click="loadRows">
        <RefreshCw :size="16" />
        <span>刷新</span>
      </button>
    </div>

    <p v-if="errorMessage" class="error-text">{{ errorMessage }}</p>

    <form class="editor-grid" @submit.prevent="saveRow">
      <input v-model="form.name" placeholder="name" />
      <input v-model="form.category" placeholder="category" />
      <input v-model="form.url" placeholder="url" />
      <select v-model="form.status">
        <option value="enabled">enabled</option>
        <option value="disabled">disabled</option>
      </select>
      <input v-model="form.description" placeholder="description" />
      <button class="primary-button" type="submit">
        <Save v-if="editingId" :size="16" />
        <Plus v-else :size="16" />
        <span>{{ editingId ? '保存' : '新增' }}</span>
      </button>
    </form>

    <table class="data-table">
      <thead>
        <tr>
          <th>ID</th>
          <th>名称</th>
          <th>分类</th>
          <th>地址</th>
          <th>状态</th>
          <th>操作</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in rows" :key="row.id">
          <td>{{ row.id }}</td>
          <td>{{ row.name }}</td>
          <td>{{ row.category }}</td>
          <td>{{ row.url }}</td>
          <td>{{ row.status }}</td>
          <td class="table-actions">
            <button type="button" @click="editRow(row)">编辑</button>
            <button type="button" @click="removeRow(row.id)">
              <Trash2 :size="15" />
            </button>
          </td>
        </tr>
      </tbody>
    </table>
  </section>
</template>
