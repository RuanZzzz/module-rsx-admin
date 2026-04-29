<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { ExternalLink, Eye, Plus, RefreshCw, Save, Search, Trash2, Wrench } from 'lucide-vue-next';
import { toolApi } from '../api/resources';

const rows = ref([]);
const editingId = ref(null);
const selectedId = ref(null);
const keyword = ref('');
const errorMessage = ref('');
const form = reactive({
  name: '',
  category: '',
  url: '',
  description: '',
  status: 'enabled'
});

const enabledRows = computed(() => rows.value.filter((row) => row.status === 'enabled'));
const filteredRows = computed(() => {
  const value = keyword.value.trim().toLowerCase();
  if (!value) {
    return rows.value;
  }
  return rows.value.filter((row) =>
    [row.name, row.category, row.description, row.url].some((field) =>
      String(field || '').toLowerCase().includes(value)
    )
  );
});
const selectedTool = computed(() => {
  if (!rows.value.length) {
    return null;
  }
  return rows.value.find((row) => row.id === selectedId.value) || enabledRows.value[0] || rows.value[0];
});
const previewUrl = computed(() => normalizeUrl(selectedTool.value?.url));

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

function normalizeUrl(url) {
  if (!url) {
    return '';
  }
  // 数据库里本地工具只存 /tools/xxx.html，浏览器会按当前前端域名访问静态资源。
  if (url.startsWith('/') || url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  return `/${url}`;
}

function canPreview(url) {
  const value = normalizeUrl(url);
  // 第一阶段只把站内 HTML 工具放进 iframe，外部网站可能因为安全策略禁止嵌入。
  return value.startsWith('/');
}

async function loadRows() {
  errorMessage.value = '';
  try {
    rows.value = await toolApi.list();
    selectedId.value = selectedTool.value?.id || null;
  } catch (error) {
    console.warn('[tools] load failed', error);
    errorMessage.value = error.message;
  }
}

function selectRow(row) {
  selectedId.value = row.id;
}

function editRow(row) {
  editingId.value = row.id;
  Object.assign(form, row);
}

function openTool(row = selectedTool.value) {
  const url = normalizeUrl(row?.url);
  if (url) {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
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
    if (selectedId.value === id) {
      selectedId.value = null;
    }
    await loadRows();
  } catch (error) {
    console.warn('[tools] remove failed', error);
    errorMessage.value = error.message;
  }
}

watch(rows, () => {
  if (!selectedId.value && rows.value.length) {
    selectedId.value = enabledRows.value[0]?.id || rows.value[0].id;
  }
});

onMounted(loadRows);
</script>

<template>
  <section class="page-section tools-page">
    <div class="page-heading">
      <div>
        <h1>教学工具</h1>
        <p>统一维护课堂工具，并在管理端直接预览 HTML 教学页面</p>
      </div>
      <div class="heading-actions">
        <button class="secondary-button" type="button" @click="loadRows">
          <RefreshCw :size="16" />
          <span>刷新</span>
        </button>
        <button class="primary-button" type="button" :disabled="!selectedTool?.url" @click="openTool()">
          <ExternalLink :size="16" />
          <span>新窗口打开</span>
        </button>
      </div>
    </div>

    <p v-if="errorMessage" class="error-text">{{ errorMessage }}</p>

    <div class="tool-workspace">
      <aside class="tool-browser">
        <label class="search-box">
          <Search :size="16" />
          <input v-model="keyword" placeholder="搜索工具、分类或地址" />
        </label>

        <div class="tool-card-list">
          <button
            v-for="row in filteredRows"
            :key="row.id"
            class="tool-card"
            :class="{ active: row.id === selectedTool?.id }"
            type="button"
            @click="selectRow(row)"
          >
            <span class="tool-icon"><Wrench :size="18" /></span>
            <span>
              <strong>{{ row.name }}</strong>
              <small>{{ row.category }} · {{ row.status }}</small>
            </span>
          </button>
        </div>
      </aside>

      <article class="tool-preview-panel">
        <div class="tool-preview-header">
          <div>
            <h2>{{ selectedTool?.name || '暂无工具' }}</h2>
            <p>{{ selectedTool?.description || '请选择一个教学工具进行预览' }}</p>
          </div>
          <span v-if="selectedTool" class="status-pill" :class="selectedTool.status">
            {{ selectedTool.status }}
          </span>
        </div>

        <div v-if="selectedTool && canPreview(selectedTool.url)" class="tool-frame-wrap">
          <iframe :src="previewUrl" :title="selectedTool.name"></iframe>
        </div>
        <div v-else class="empty-preview">
          <Eye :size="34" />
          <p>外部工具可能禁止嵌入页面，请使用新窗口打开。</p>
        </div>
      </article>
    </div>

    <form class="tool-editor panel" @submit.prevent="saveRow">
      <div class="editor-title">
        <strong>{{ editingId ? '编辑工具' : '新增工具' }}</strong>
        <button v-if="editingId" class="secondary-button compact" type="button" @click="resetForm">取消编辑</button>
      </div>
      <input v-model="form.name" placeholder="工具名称，例如：算盘教学" />
      <input v-model="form.category" placeholder="分类，例如：math" />
      <input v-model="form.url" placeholder="访问地址，例如：/tools/abacus-teaching.html" />
      <select v-model="form.status">
        <option value="enabled">enabled</option>
        <option value="disabled">disabled</option>
      </select>
      <input v-model="form.description" placeholder="说明" />
      <button class="primary-button" type="submit">
        <Save v-if="editingId" :size="16" />
        <Plus v-else :size="16" />
        <span>{{ editingId ? '保存' : '新增' }}</span>
      </button>
    </form>

    <section class="panel table-panel">
      <div class="panel-header">
        <strong>工具列表</strong>
        <span>共 {{ rows.length }} 条</span>
      </div>
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
            <td class="url-cell">{{ row.url }}</td>
            <td>
              <span class="status-pill" :class="row.status">{{ row.status }}</span>
            </td>
            <td class="table-actions">
              <button type="button" title="预览" @click="selectRow(row)">
                <Eye :size="15" />
              </button>
              <button type="button" @click="editRow(row)">编辑</button>
              <button type="button" title="删除" @click="removeRow(row.id)">
                <Trash2 :size="15" />
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </section>
  </section>
</template>
