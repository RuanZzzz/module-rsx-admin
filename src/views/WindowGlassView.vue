<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { Calculator, PanelTop, RefreshCw, RotateCcw, Save, Shapes, Trash2 } from 'lucide-vue-next';
import { windowGlassApi } from '../api/resources';

const unitOptions = [
  { code: 'cm', label: '厘米 cm', toCm: 1 },
  { code: 'mm', label: '毫米 mm', toCm: 0.1 },
  { code: 'm', label: '米 m', toCm: 100 }
];
const templates = ref([]);
const designs = ref([]);
const selectedCode = ref('');
const selectedUnit = ref('cm');
const lastUnit = ref('cm');
const result = ref(null);
const errorMessage = ref('');
const saving = ref(false);
const customPoints = ref([]);
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
const isCustomPolygon = computed(() => selectedTemplate.value?.shapeType === 'CUSTOM_POLYGON');
const customEdges = computed(() => {
  if (customPoints.value.length < 2) {
    return [];
  }
  return customPoints.value.map((point, index) => {
    const nextIndex = index === customPoints.value.length - 1 ? 0 : index + 1;
    const next = customPoints.value[nextIndex];
    return {
      key: `length${index + 1}`,
      label: `边 ${index + 1}`,
      from: `P${index + 1}`,
      to: `P${nextIndex + 1}`,
      drawnLength: Math.hypot(point.x - next.x, point.y - next.y)
    };
  });
});

function resetParams() {
  const nextParams = {};
  for (const field of templateFields.value) {
    nextParams[field.key] = field.defaultValue || 0;
  }
  if (isCustomPolygon.value) {
    customPoints.value = [];
    Object.assign(nextParams, buildCustomPointParams());
  } else {
    customPoints.value = [];
  }
  form.params = nextParams;
  result.value = null;
}

function selectTemplate(code) {
  selectedCode.value = code;
}

function buildPayload() {
  const params = isCustomPolygon.value ? buildCustomPointParams() : buildCommonParams();
  if (isCustomPolygon.value) {
    Object.assign(form.params, params);
  }
  return {
    name: form.name,
    templateCode: selectedCode.value,
    customerName: form.customerName,
    params,
    remark: form.remark
  };
}

function buildCustomPointParams() {
  const params = { pointCount: customPoints.value.length, unitToCm: activeUnit().toCm };
  customPoints.value.forEach((point, index) => {
    params[`x${index + 1}`] = point.x || 0;
    params[`y${index + 1}`] = point.y || 0;
    params[`length${index + 1}`] = form.params[`length${index + 1}`] || Number(edgeDefaultLength(index).toFixed(1));
  });
  return params;
}

function buildCommonParams() {
  const unitToCm = activeUnit().toCm;
  return Object.fromEntries(Object.entries(form.params).map(([key, value]) => [key, Number(value || 0) * unitToCm]));
}

function activeUnit() {
  return unitOptions.find((item) => item.code === selectedUnit.value) || unitOptions[0];
}

function edgeDefaultLength(index) {
  if (customPoints.value.length < 2) {
    return 0;
  }
  const point = customPoints.value[index];
  const next = customPoints.value[index === customPoints.value.length - 1 ? 0 : index + 1];
  return Math.hypot(point.x - next.x, point.y - next.y);
}

function handleCanvasClick(event) {
  if (!isCustomPolygon.value || customPoints.value.length >= 12) {
    return;
  }
  const rect = event.currentTarget.getBoundingClientRect();
  const x = ((event.clientX - rect.left) / rect.width) * 360;
  const y = ((event.clientY - rect.top) / rect.height) * 260;
  customPoints.value.push({ x: Number(x.toFixed(1)), y: Number(y.toFixed(1)) });
  syncCustomEdgeLengths();
  result.value = null;
}

function removePoint(index) {
  if (customPoints.value.length <= 3) {
    return;
  }
  customPoints.value.splice(index, 1);
  syncCustomEdgeLengths(true);
  result.value = null;
}

function clearCustomPoints() {
  customPoints.value = [];
  result.value = null;
}

function syncCustomEdgeLengths(reset = false) {
  customPoints.value.forEach((_, index) => {
    const key = `length${index + 1}`;
    if (reset || !form.params[key]) {
      form.params[key] = Number(edgeDefaultLength(index).toFixed(1));
    }
  });
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
  if (shapeType === 'CUSTOM_POLYGON') {
    return customPoints.value.map((point) => `${point.x},${point.y}`).join(' ');
  }
  if (shapeType === 'RECTANGLE') {
    return scalePoints([
      { x: 0, y: 0 },
      { x: Number(params.width || 1), y: 0 },
      { x: Number(params.width || 1), y: Number(params.height || 1) },
      { x: 0, y: Number(params.height || 1) }
    ]);
  }
  if (shapeType === 'TRIANGLE') {
    return scalePoints([
      { x: 0, y: Number(params.height || 1) },
      { x: Number(params.base || 1) / 2, y: 0 },
      { x: Number(params.base || 1), y: Number(params.height || 1) }
    ]);
  }
  if (shapeType === 'TRAPEZOID') {
    const topWidth = Number(params.topWidth || 1);
    const bottomWidth = Number(params.bottomWidth || 1);
    const offset = Math.max((bottomWidth - topWidth) / 2, 0);
    return scalePoints([
      { x: offset, y: 0 },
      { x: offset + topWidth, y: 0 },
      { x: bottomWidth, y: Number(params.height || 1) },
      { x: 0, y: Number(params.height || 1) }
    ]);
  }
  if (shapeType === 'L_SHAPE') {
    const width = Number(params.width || 1);
    const height = Number(params.height || 1);
    const cutWidth = Math.min(Number(params.cutWidth || 1), width - 1);
    const cutHeight = Math.min(Number(params.cutHeight || 1), height - 1);
    return scalePoints([
      { x: 0, y: 0 },
      { x: width, y: 0 },
      { x: width, y: height - cutHeight },
      { x: width - cutWidth, y: height - cutHeight },
      { x: width - cutWidth, y: height },
      { x: 0, y: height }
    ]);
  }
  if (shapeType === 'CORNER') {
    const frontWidth = Number(params.frontWidth || 1);
    const sideWidth = Number(params.sideWidth || 1);
    const height = Number(params.height || 1);
    return scalePoints([
      { x: 0, y: 0 },
      { x: frontWidth, y: 0 },
      { x: frontWidth + sideWidth * 0.45, y: height * 0.25 },
      { x: frontWidth + sideWidth * 0.45, y: height },
      { x: sideWidth * 0.45, y: height },
      { x: 0, y: height * 0.75 }
    ]);
  }
  return '';
}

function scalePoints(points) {
  if (!points.length) {
    return '';
  }
  const width = 280;
  const height = 180;
  const offsetX = 40;
  const offsetY = 40;
  const maxX = Math.max(...points.map((point) => Number(point.x) || 0));
  const maxY = Math.max(...points.map((point) => Number(point.y) || 0));
  const scale = Math.min(width / Math.max(maxX, 1), height / Math.max(maxY, 1));
  return points
    .map((point) => {
      const x = offsetX + (Number(point.x) || 0) * scale;
      const y = offsetY + (Number(point.y) || 0) * scale;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
}

function fieldValueLabel(key) {
  return `${form.params[key] || 0} ${selectedUnit.value}`;
}

watch(selectedTemplate, () => {
  resetParams();
});

watch(selectedUnit, (unit, oldUnit) => {
  const oldMeta = unitOptions.find((item) => item.code === (oldUnit || lastUnit.value)) || unitOptions[0];
  const newMeta = activeUnit();
  const ratio = oldMeta.toCm / newMeta.toCm;
  for (const key of Object.keys(form.params)) {
    if (key.startsWith('x') || key.startsWith('y') || key === 'pointCount' || key === 'unitToCm') {
      continue;
    }
    form.params[key] = Number(((Number(form.params[key]) || 0) * ratio).toFixed(2));
  }
  lastUnit.value = unit;
  result.value = null;
});

onMounted(loadData);
</script>

<template>
  <section class="page-section window-page">
    <div class="page-heading">
      <div>
        <h1>玻璃面积计算</h1>
        <p>选择常见窗型或直接画异形轮廓，标注边长后由后端复算玻璃面积</p>
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
          <select v-model="selectedUnit" class="mini-select">
            <option v-for="unit in unitOptions" :key="unit.code" :value="unit.code">{{ unit.label }}</option>
          </select>
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
          <div v-if="isCustomPolygon" class="point-editor">
            <div class="point-editor-head">
              <strong>边长标注</strong>
              <button class="secondary-button compact" type="button" @click="clearCustomPoints">
                <RotateCcw :size="14" />
                <span>重画</span>
              </button>
            </div>
            <div v-for="edge in customEdges" :key="edge.key" class="point-row">
              <span>{{ edge.label }}</span>
              <label>
                <small>{{ edge.from }} -> {{ edge.to }}</small>
                <input v-model.number="form.params[edge.key]" type="number" min="0.1" step="0.1" />
              </label>
              <b>{{ selectedUnit }}</b>
              <button class="icon-button muted" type="button" :disabled="customPoints.length <= 3" @click="removePoint(Number(edge.key.replace('length', '')) - 1)">
                <Trash2 :size="15" />
              </button>
            </div>
            <p>先在右侧画布按窗户外轮廓依次点击点位，再给每条边填写实际长度。</p>
          </div>
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
          <svg
            viewBox="0 0 360 260"
            role="img"
            aria-label="窗户形状预览"
            :class="{ drawable: isCustomPolygon }"
            @click="handleCanvasClick"
          >
            <defs>
              <linearGradient id="glassFill" x1="0" x2="1" y1="0" y2="1">
                <stop offset="0%" stop-color="#dbeafe" />
                <stop offset="100%" stop-color="#a7f3d0" />
              </linearGradient>
            </defs>
            <polygon v-if="customPoints.length >= 3 || !isCustomPolygon" :points="previewPoints" fill="url(#glassFill)" stroke="#2563eb" stroke-width="4" />
            <polyline :points="previewPoints" fill="none" stroke="#0f172a" stroke-width="1.2" opacity="0.18" />
            <g v-if="isCustomPolygon">
              <circle v-for="(point, index) in customPoints" :key="index" :cx="point.x" :cy="point.y" r="5" fill="#2563eb" />
              <text v-for="(point, index) in customPoints" :key="`text-${index}`" :x="point.x + 8" :y="point.y - 8">P{{ index + 1 }}</text>
            </g>
          </svg>
          <p v-if="isCustomPolygon" class="canvas-tip">
            {{ customPoints.length < 3 ? '在画布上依次点击至少 3 个点形成窗户轮廓' : '继续点击可加点，左侧可标注每条边长度' }}
          </p>
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
