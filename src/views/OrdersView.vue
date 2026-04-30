<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import { PackageCheck, Plus, RefreshCw, Save, Truck, X } from 'lucide-vue-next';
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
// 打包完成后不能直接点状态进入配送中，必须先填写发货信息，由后端自动推进到配送中。
const nextStatusMap = {
  NOT_STARTED: 'PRODUCING',
  PRODUCING: 'PACKED',
  SHIPPING: 'COMPLETED'
};

const rows = ref([]);
const selectedId = ref(null);
const trace = ref(null);
const errorMessage = ref('');
const createVisible = ref(false);
const statusVisible = ref(false);
const shipmentVisible = ref(false);
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
  return index < 0 ? 0 : (index / (statusSteps.length - 1)) * 100;
});
const nextStatus = computed(() => nextStatusMap[selectedOrder.value?.status]);

function statusLabel(status) {
  return statusSteps.find((item) => item.code === status)?.label || status;
}

function resetCreateForm() {
  Object.assign(form, {
    orderNo: '',
    customerName: '',
    productName: '',
    quantity: 1,
    remark: ''
  });
}

function selectOrder(row) {
  selectedId.value = row.id;
  trace.value = null;
}

function syncCompanyName() {
  const company = companyOptions.find((item) => item.code === expressForm.expressCompanyCode);
  expressForm.expressCompanyName = company?.name || expressForm.expressCompanyCode;
}

function openStatusModal() {
  if (!nextStatus.value) {
    return;
  }
  Object.assign(statusForm, {
    status: nextStatus.value,
    operator: 'admin',
    remark: ''
  });
  statusVisible.value = true;
}

function openShipmentModal() {
  Object.assign(expressForm, {
    expressCompanyCode: selectedOrder.value.express?.expressCompanyCode || 'SF',
    expressCompanyName: selectedOrder.value.express?.expressCompanyName || '顺丰速运',
    trackingNo: selectedOrder.value.express?.trackingNo || '',
    receiverPhoneSuffix: selectedOrder.value.express?.receiverPhoneSuffix || ''
  });
  shipmentVisible.value = true;
}

async function loadRows() {
  errorMessage.value = '';
  try {
    rows.value = await orderApi.list();
    if (!rows.value.some((item) => item.id === selectedId.value) && rows.value.length) {
      selectOrder(rows.value[0]);
    }
  } catch (error) {
    console.warn('[orders] load failed', error);
    errorMessage.value = error.message;
  }
}

async function createOrder() {
  try {
    const created = await orderApi.create(form);
    resetCreateForm();
    createVisible.value = false;
    selectedId.value = created.id;
    await loadRows();
  } catch (error) {
    console.warn('[orders] create failed', error);
    errorMessage.value = error.message;
  }
}

async function changeStatus() {
  try {
    await orderApi.changeStatus(selectedOrder.value.id, statusForm);
    statusVisible.value = false;
    await loadRows();
  } catch (error) {
    console.warn('[orders] change status failed', error);
    errorMessage.value = error.message;
  }
}

async function submitShipment() {
  try {
    syncCompanyName();
    await orderApi.bindExpress(selectedOrder.value.id, expressForm);
    shipmentVisible.value = false;
    await loadRows();
  } catch (error) {
    console.warn('[orders] submit shipment failed', error);
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
        <p>生产完成后填写发货信息，订单才进入配送中</p>
      </div>
      <div class="heading-actions">
        <button class="secondary-button" type="button" @click="loadRows">
          <RefreshCw :size="16" />
          <span>刷新</span>
        </button>
        <button class="primary-button" type="button" @click="createVisible = true">
          <Plus :size="16" />
          <span>新增订单</span>
        </button>
      </div>
    </div>

    <p v-if="errorMessage" class="error-text">{{ errorMessage }}</p>

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

        <div class="order-actions">
          <button v-if="nextStatus" class="primary-button" type="button" @click="openStatusModal">
            <Save :size="16" />
            {{ statusLabel(nextStatus) }}
          </button>
          <button
            v-if="selectedOrder.status === 'PACKED' || selectedOrder.status === 'SHIPPING'"
            class="secondary-button"
            type="button"
            @click="openShipmentModal"
          >
            <PackageCheck :size="16" />
            {{ selectedOrder.express ? '编辑物流' : '填写发货信息' }}
          </button>
        </div>

        <div class="express-summary">
          <strong>{{ selectedOrder.express?.expressCompanyName || '未填写发货信息' }}</strong>
          <span>{{ selectedOrder.express?.trackingNo || '打包完成后填写快递公司和快递单号' }}</span>
          <small>{{ selectedOrder.express?.latestLocation || '暂无最新位置' }}</small>
          <button class="primary-button" type="button" :disabled="!selectedOrder.express" @click="queryTrace">
            <Truck :size="16" />查询轨迹
          </button>
        </div>

        <div class="trace-list">
          <article v-for="log in selectedOrder.statusLogs" :key="`${log.toStatus}-${log.createdAt}`">
            <span></span>
            <div>
              <strong>{{ statusLabel(log.toStatus) }}</strong>
              <p>{{ log.remark || '状态更新' }}</p>
              <small>{{ log.createdAt }}</small>
            </div>
          </article>
        </div>

        <div v-if="trace" class="trace-list express-trace">
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

    <div v-if="createVisible" class="modal-backdrop">
      <form class="modal-panel" @submit.prevent="createOrder">
        <div class="modal-header">
          <strong>新增订单</strong>
          <button class="icon-button" type="button" @click="createVisible = false"><X :size="16" /></button>
        </div>
        <label><span>订单号</span><input v-model="form.orderNo" placeholder="JZ202604300002" /></label>
        <label><span>客户</span><input v-model="form.customerName" placeholder="客户名称" /></label>
        <label><span>商品</span><input v-model="form.productName" placeholder="手工饺子礼盒" /></label>
        <label><span>数量</span><input v-model.number="form.quantity" type="number" min="1" /></label>
        <label><span>备注</span><input v-model="form.remark" placeholder="订单备注" /></label>
        <button class="primary-button" type="submit"><Plus :size="16" />提交</button>
      </form>
    </div>

    <div v-if="statusVisible" class="modal-backdrop">
      <form class="modal-panel" @submit.prevent="changeStatus">
        <div class="modal-header">
          <strong>推进订单阶段</strong>
          <button class="icon-button" type="button" @click="statusVisible = false"><X :size="16" /></button>
        </div>
        <p class="modal-tip">当前阶段：{{ statusLabel(selectedOrder.status) }}，下一阶段：{{ statusLabel(statusForm.status) }}</p>
        <label><span>操作人</span><input v-model="statusForm.operator" /></label>
        <label><span>备注</span><input v-model="statusForm.remark" placeholder="状态变更说明" /></label>
        <button class="primary-button" type="submit"><Save :size="16" />确认推进</button>
      </form>
    </div>

    <div v-if="shipmentVisible" class="modal-backdrop">
      <form class="modal-panel" @submit.prevent="submitShipment">
        <div class="modal-header">
          <strong>{{ selectedOrder.express ? '编辑物流' : '填写发货信息' }}</strong>
          <button class="icon-button" type="button" @click="shipmentVisible = false"><X :size="16" /></button>
        </div>
        <p class="modal-tip">打包完成后填写快递信息，系统会自动把订单推进到配送中。</p>
        <label>
          <span>快递公司</span>
          <select v-model="expressForm.expressCompanyCode" @change="syncCompanyName">
            <option v-for="company in companyOptions" :key="company.code" :value="company.code">{{ company.name }}</option>
          </select>
        </label>
        <label><span>快递单号</span><input v-model="expressForm.trackingNo" placeholder="请输入快递单号" /></label>
        <label><span>手机号后四位</span><input v-model="expressForm.receiverPhoneSuffix" placeholder="顺丰常用" /></label>
        <button class="primary-button" type="submit"><PackageCheck :size="16" />保存发货信息</button>
      </form>
    </div>
  </section>
</template>
