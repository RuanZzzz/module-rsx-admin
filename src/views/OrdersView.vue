<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import { PackageCheck, Plus, RefreshCw, Save, Truck } from 'lucide-vue-next';
import { orderApi } from '../api/resources';

const statusSteps = [
  { code: 'NOT_STARTED', label: '未开始生产' },
  { code: 'PRODUCING', label: '生产中' },
  { code: 'PACKED', label: '打包完成' },
  { code: 'SHIPPING', label: '配送中' },
  { code: 'COMPLETED', label: '订单完成' }
];
const companyOptions = [
  { code: 'SF', name: '顺丰速运' },
  { code: 'YTO', name: '圆通速递' },
  { code: 'ZTO', name: '中通快递' }
];

const rows = ref([]);
const selectedId = ref(null);
const trace = ref(null);
const errorMessage = ref('');
const form = reactive({
  orderNo: '',
  customerName: '',
  productName: '',
  quantity: 1,
  remark: ''
});
const statusForm = reactive({
  status: 'NOT_STARTED',
  operator: 'admin',
  remark: ''
});
const expressForm = reactive({
  expressCompanyCode: 'SF',
  expressCompanyName: '顺丰速运',
  trackingNo: '',
  receiverPhoneSuffix: ''
});

const selectedOrder = computed(() => rows.value.find((item) => item.id === selectedId.value) || rows.value[0]);
const progressPercent = computed(() => {
  const index = statusSteps.findIndex((item) => item.code === selectedOrder.value?.status);
  if (index < 0) {
    return 0;
  }
  return (index / (statusSteps.length - 1)) * 100;
});

function statusLabel(status) {
  return statusSteps.find((item) => item.code === status)?.label || status;
}

function selectOrder(row) {
  selectedId.value = row.id;
  trace.value = null;
  Object.assign(statusForm, {
    status: row.status,
    operator: 'admin',
    remark: ''
  });
  Object.assign(expressForm, {
    expressCompanyCode: row.express?.expressCompanyCode || 'SF',
    expressCompanyName: row.express?.expressCompanyName || '顺丰速运',
    trackingNo: row.express?.trackingNo || '',
    receiverPhoneSuffix: row.express?.receiverPhoneSuffix || ''
  });
}

function syncCompanyName() {
  const company = companyOptions.find((item) => item.code === expressForm.expressCompanyCode);
  expressForm.expressCompanyName = company?.name || expressForm.expressCompanyCode;
}

async function loadRows() {
  errorMessage.value = '';
  try {
    rows.value = await orderApi.list();
    if (!selectedId.value && rows.value.length) {
      selectOrder(rows.value[0]);
    }
  } catch (error) {
    console.warn('[orders] load failed', error);
    errorMessage.value = error.message;
  }
}

async function createOrder() {
  try {
    await orderApi.create(form);
    Object.assign(form, {
      orderNo: '',
      customerName: '',
      productName: '',
      quantity: 1,
      remark: ''
    });
    await loadRows();
  } catch (error) {
    console.warn('[orders] create failed', error);
    errorMessage.value = error.message;
  }
}

async function changeStatus() {
  try {
    await orderApi.changeStatus(selectedOrder.value.id, statusForm);
    await loadRows();
  } catch (error) {
    console.warn('[orders] change status failed', error);
    errorMessage.value = error.message;
  }
}

async function bindExpress() {
  try {
    syncCompanyName();
    await orderApi.bindExpress(selectedOrder.value.id, expressForm);
    await loadRows();
  } catch (error) {
    console.warn('[orders] bind express failed', error);
    errorMessage.value = error.message;
  }
}

async function queryTrace() {
  try {
    trace.value = await orderApi.trace(selectedOrder.value.id);
    await loadRows();
  } catch (error) {
    console.warn('[orders] query trace failed', error);
    errorMessage.value = error.message;
  }
}

onMounted(loadRows);
</script>

<template>
  <section class="page-section orders-page">
    <div class="page-heading">
      <div>
        <h1>订单管理</h1>
        <p>维护订单生产阶段、快递单号和物流轨迹</p>
      </div>
      <button class="secondary-button" type="button" @click="loadRows">
        <RefreshCw :size="16" />
        <span>刷新</span>
      </button>
    </div>

    <p v-if="errorMessage" class="error-text">{{ errorMessage }}</p>

    <section class="panel form-panel">
      <div class="panel-header">
        <strong>新增订单</strong>
      </div>
      <form class="order-editor" @submit.prevent="createOrder">
        <label><span>订单号</span><input v-model="form.orderNo" placeholder="JZ202604300002" /></label>
        <label><span>客户</span><input v-model="form.customerName" placeholder="客户名称" /></label>
        <label><span>商品</span><input v-model="form.productName" placeholder="手工饺子礼盒" /></label>
        <label><span>数量</span><input v-model.number="form.quantity" type="number" min="1" /></label>
        <label><span>备注</span><input v-model="form.remark" placeholder="订单备注" /></label>
        <button class="primary-button" type="submit"><Plus :size="16" />新增</button>
      </form>
    </section>

    <div class="order-layout">
      <section class="panel table-panel">
        <div class="panel-header">
          <strong>订单列表</strong>
          <span>共 {{ rows.length }} 条</span>
        </div>
        <table class="data-table">
          <thead>
            <tr>
              <th>订单号</th>
              <th>客户</th>
              <th>商品</th>
              <th>数量</th>
              <th>状态</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="row in rows"
              :key="row.id"
              :class="{ selected: selectedOrder?.id === row.id }"
              @click="selectOrder(row)"
            >
              <td><code class="code-text">{{ row.orderNo }}</code></td>
              <td>{{ row.customerName }}</td>
              <td>{{ row.productName }}</td>
              <td>{{ row.quantity }}</td>
              <td><span class="status-pill" :class="row.status">{{ statusLabel(row.status) }}</span></td>
            </tr>
          </tbody>
        </table>
      </section>

      <aside v-if="selectedOrder" class="panel order-detail">
        <div class="panel-header">
          <strong>{{ selectedOrder.orderNo }}</strong>
          <span>{{ selectedOrder.customerName }}</span>
        </div>

        <div class="order-progress">
          <div class="progress-track">
            <span class="progress-fill" :style="{ width: `${progressPercent}%` }"></span>
            <span class="truck-marker" :style="{ left: `${progressPercent}%` }"><Truck :size="20" /></span>
          </div>
          <div class="step-row">
            <span v-for="step in statusSteps" :key="step.code">{{ step.label }}</span>
          </div>
        </div>

        <form class="stack-form" @submit.prevent="changeStatus">
          <label>
            <span>订单阶段</span>
            <select v-model="statusForm.status">
              <option v-for="step in statusSteps" :key="step.code" :value="step.code">{{ step.label }}</option>
            </select>
          </label>
          <label><span>备注</span><input v-model="statusForm.remark" placeholder="状态变更说明" /></label>
          <button class="primary-button" type="submit"><Save :size="16" />更新状态</button>
        </form>

        <form class="stack-form" @submit.prevent="bindExpress">
          <label>
            <span>快递公司</span>
            <select v-model="expressForm.expressCompanyCode" @change="syncCompanyName">
              <option v-for="company in companyOptions" :key="company.code" :value="company.code">
                {{ company.name }}
              </option>
            </select>
          </label>
          <label><span>快递单号</span><input v-model="expressForm.trackingNo" placeholder="请输入快递单号" /></label>
          <label><span>手机号后四位</span><input v-model="expressForm.receiverPhoneSuffix" placeholder="顺丰常用" /></label>
          <button class="secondary-button" type="submit"><PackageCheck :size="16" />绑定物流</button>
        </form>

        <div class="express-summary">
          <strong>{{ selectedOrder.express?.expressCompanyName || '未绑定物流' }}</strong>
          <span>{{ selectedOrder.express?.trackingNo || '暂无单号' }}</span>
          <small>{{ selectedOrder.express?.latestLocation || '暂无最新位置' }}</small>
          <button class="primary-button" type="button" :disabled="!selectedOrder.express" @click="queryTrace">
            <Truck :size="16" />查询轨迹
          </button>
        </div>

        <div v-if="trace" class="trace-list">
          <article v-for="item in trace.traces" :key="item.time">
            <span></span>
            <div>
              <strong>{{ item.location }}</strong>
              <p>{{ item.description }}</p>
              <small>{{ item.time }}</small>
            </div>
          </article>
        </div>
      </aside>
    </div>
  </section>
</template>
