<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { Calculator, PanelTop, RefreshCw, Save, Shapes } from 'lucide-vue-next';
import { windowGlassApi } from '../api/resources';

const templates = ref([]);
const designs = ref([]);
const selectedCode = ref('');
const result = ref(null);
const errorMessage = ref('');
const saving = ref(false);
const form = reactive({
  name: '',
  customerName: '',
  remark: '',
  params: {}
});

const selectedTemplate = computed(() => templates.value.find((item) => item.code === selectedCode.value));
const templateFields = computed(() => {
  if (!selectedTemplate.value?.schemaJson) {
    return [];
  }
  try {
    return JSON.parse(selectedTemplate.value.schemaJson).fields || [];
  } catch (error) {
    console.warn('[window-glass] schema parse failed', error);
    return [];
  }
});
const previewPoints = computed(() => buildPreviewPoints(selectedTemplate.value?.shapeType, form.params));

function resetParams() {
  const nextParams = {};
  for (const field of templateFields.value) {
    nextParams[field.key] = field.defaultValue || 0;
  }
  form.params = nextParams;
  result.value = null;
}

function selectTemplate(code) {
  selectedCode.value = code;
}

function buildPayload() {
  return {
    name: form.name,
    templateCode: selectedCode.value,
    customerName: form.customerName,
    params: form.params,
    remark: form.remark
  };
}

async function loadData() {
  errorMessage.value = '';
  try {
    const [templateRows, designRows] = await Promise.all([windowGlassApi.templates(), windowGlassApi.designs()]);
    templates.value = templateRows;
    designs.value = designRows;
    if (!selectedCode.value && templateRows.length) {
      selectedCode.value = templateRows[0].code;
    }
  } catch (error) {
    console.warn('[window-glass] load failed', error);
    errorMessage.value = error.message;
  }
}

async function calculate() {
  errorMessage.value = '';
  try {
    result.value = await windowGlassApi.calculate(buildPayload());
  } catch (error) {
    console.warn('[window-glass] calculate failed', error);
    errorMessage.value = error.message;
  }
}

async function saveDesign() {
  errorMessage.value = '';
  saving.value = true;
  try {
    result.value = await windowGlassApi.create(buildPayload());
    designs.value = await windowGlassApi.designs();
  } catch (error) {
    console.warn('[window-glass] save failed', error);
    errorMessage.value = error.message;
  } finally {
    saving.value = false;
  }
}

function buildPreviewPoints(shapeType, params) {
  if (!shapeType) {
    return '';
  }
  if (shapeType === 'TRIANGLE') {
    return '30,210 170,40 310,210';
  }
  if (shapeType === 'TRAPEZOID') {
    return '70,55 260,55 320,210 25,210';
  }
  if (shapeType === 'L_SHAPE') {
    return '35,35 320,35 320,110 210,110 210,215 35,215';
  }
  if (shapeType === 'CORNER') {
    return '40,45 220,45 310,105 310,215 130,215 40,155';
  }
  return '45,45 315,45 315,215 45,215';
}

function fieldValueLabel(key) {
  return `${form.params[key] || 0} mm`;
}

watch(selectedTemplate, () => {
  resetParams();
});

onMounted(loadData);
</script>

<template>
  <section class="page-section window-page">
    <div class="page-heading">
      <div>
        <h1>玻璃面积计算</h1>
        <p>选择常见窗型模板，输入毫米尺寸，后端复算每块玻璃面积</p>
      </div>
      <button class="secondary-button" type="button" @click="loadData">
        <RefreshCw :size="16" />
        <span>刷新</span>
      </button>
    </div>

    <p v-if="errorMessage" class="error-text">{{ errorMessage }}</p>

    <div class="window-layout">
      <section class="panel window-template-panel">
        <div class="panel-header">
          <strong>窗型模板</strong>
          <span>{{ templates.length }} 个</span>
        </div>
        <button
          v-for="template in templates"
          :key="template.code"
          class="template-card"
          :class="{ active: template.code === selectedCode }"
          type="button"
          @click="selectTemplate(template.code)"
        >
          <span><Shapes :size="18" /></span>
          <strong>{{ template.name }}</strong>
          <small>{{ template.description }}</small>
        </button>
      </section>

      <section class="panel window-form-panel">
        <div class="panel-header">
          <strong>尺寸参数</strong>
          <span>单位：mm</span>
        </div>
        <div class="window-form">
          <label>
            <span>方案名称</span>
            <input v-model="form.name" placeholder="例如：客厅转角窗" />
          </label>
          <label>
            <span>客户名称</span>
            <input v-model="form.customerName" placeholder="可选" />
          </label>
          <label v-for="field in templateFields" :key="field.key">
            <span>{{ field.label }}</span>
            <input v-model.number="form.params[field.key]" type="number" min="1" />
            <small>{{ fieldValueLabel(field.key) }}</small>
          </label>
          <label>
            <span>备注</span>
            <input v-model="form.remark" placeholder="例如：预留损耗后续报价处理" />
          </label>
          <div class="form-actions">
            <button class="secondary-button" type="button" @click="calculate">
              <Calculator :size="16" />
              <span>计算面积</span>
            </button>
            <button class="primary-button" type="button" :disabled="saving" @click="saveDesign">
              <Save :size="16" />
              <span>{{ saving ? '保存中' : '保存方案' }}</span>
            </button>
          </div>
        </div>
      </section>

      <aside class="panel window-preview-panel">
        <div class="panel-header">
          <strong>{{ selectedTemplate?.name || '窗型预览' }}</strong>
          <span>{{ result?.totalArea || '0.0000' }} ㎡</span>
        </div>
        <div class="window-canvas">
          <svg viewBox="0 0 360 260" role="img" aria-label="窗户形状预览">
            <defs>
              <linearGradient id="glassFill" x1="0" x2="1" y1="0" y2="1">
                <stop offset="0%" stop-color="#dbeafe" />
                <stop offset="100%" stop-color="#a7f3d0" />
              </linearGradient>
            </defs>
            <polygon :points="previewPoints" fill="url(#glassFill)" stroke="#2563eb" stroke-width="4" />
            <polyline :points="previewPoints" fill="none" stroke="#0f172a" stroke-width="1.2" opacity="0.18" />
          </svg>
        </div>
        <div class="glass-result">
          <article v-for="piece in result?.pieces || []" :key="piece.sortOrder">
            <span><PanelTop :size="16" /></span>
            <div>
              <strong>{{ piece.name }}</strong>
              <small>{{ piece.shapeType }}</small>
            </div>
            <b>{{ piece.area }} ㎡</b>
          </article>
          <p v-if="!result">先点击“计算面积”，这里会显示每块玻璃面积。</p>
        </div>
      </aside>
    </div>

    <section class="panel table-panel">
      <div class="panel-header">
        <strong>已保存方案</strong>
        <span>共 {{ designs.length }} 条</span>
      </div>
      <table class="data-table">
        <thead>
          <tr>
            <th>方案</th>
            <th>模板</th>
            <th>客户</th>
            <th>面积</th>
            <th>创建时间</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="design in designs" :key="design.id">
            <td>{{ design.name }}</td>
            <td>{{ design.templateName }}</td>
            <td>{{ design.customerName || '-' }}</td>
            <td><strong>{{ design.totalArea }} ㎡</strong></td>
            <td>{{ design.createdAt }}</td>
          </tr>
        </tbody>
      </table>
    </section>
  </section>
</template>
