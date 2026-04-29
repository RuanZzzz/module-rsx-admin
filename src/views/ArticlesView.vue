<script setup>
import { onMounted, reactive, ref } from 'vue';
import { Plus, RefreshCw, Save, Trash2 } from 'lucide-vue-next';
import { articleApi } from '../api/resources';

const rows = ref([]);
const editingId = ref(null);
const errorMessage = ref('');
const form = reactive({
  title: '',
  summary: '',
  content: '',
  status: 'draft'
});

function resetForm() {
  editingId.value = null;
  Object.assign(form, {
    title: '',
    summary: '',
    content: '',
    status: 'draft'
  });
}

async function loadRows() {
  errorMessage.value = '';
  try {
    rows.value = await articleApi.list();
  } catch (error) {
    console.warn('[articles] load failed', error);
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
      await articleApi.update(editingId.value, form);
    } else {
      await articleApi.create(form);
    }
    resetForm();
    await loadRows();
  } catch (error) {
    console.warn('[articles] save failed', error);
    errorMessage.value = error.message;
  }
}

async function removeRow(id) {
  try {
    await articleApi.remove(id);
    await loadRows();
  } catch (error) {
    console.warn('[articles] remove failed', error);
    errorMessage.value = error.message;
  }
}

onMounted(loadRows);
</script>

<template>
  <section class="page-section">
    <div class="page-heading">
      <div>
        <h1>文章管理</h1>
        <p>维护内容文章</p>
      </div>
      <button class="secondary-button" type="button" @click="loadRows">
        <RefreshCw :size="16" />
        <span>刷新</span>
      </button>
    </div>

    <p v-if="errorMessage" class="error-text">{{ errorMessage }}</p>

    <form class="article-editor" @submit.prevent="saveRow">
      <input v-model="form.title" placeholder="title" />
      <input v-model="form.summary" placeholder="summary" />
      <select v-model="form.status">
        <option value="draft">draft</option>
        <option value="published">published</option>
      </select>
      <textarea v-model="form.content" placeholder="content" rows="4"></textarea>
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
          <th>标题</th>
          <th>摘要</th>
          <th>状态</th>
          <th>操作</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in rows" :key="row.id">
          <td>{{ row.id }}</td>
          <td>{{ row.title }}</td>
          <td>{{ row.summary }}</td>
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
