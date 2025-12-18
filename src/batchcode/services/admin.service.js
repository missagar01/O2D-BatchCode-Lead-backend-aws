const qcLabSamplesService = require('./qcLabSamples.service');
const smsRegisterService = require('./smsRegister.service');
const hotCoilService = require('./hotCoil.service');
const reCoilerService = require('./reCoiler.service');
const pipeMillService = require('./pipeMill.service');
const laddleChecklistService = require('./laddleChecklist.service');
const tundishChecklistService = require('./tundishChecklist.service');
const laddleReturnService = require('./laddleReturn.service');

const buildFilters = (uniqueCode) => (uniqueCode ? { uniqueCode } : {});

const getAdminTablesSnapshot = async ({ uniqueCode } = {}) => {
  const filters = buildFilters(uniqueCode);

  const [
    qcLabSamples,
    smsRegisters,
    hotCoilEntries,
    reCoilerEntries,
    pipeMillEntries,
    laddleChecklistEntries,
    tundishChecklistEntries,
    laddleReturnEntries
  ] = await Promise.all([
    qcLabSamplesService.listSamples(filters),
    smsRegisterService.listSmsRegisters(filters),
    hotCoilService.listHotCoilEntries(filters),
    reCoilerService.listReCoilerEntries(filters),
    pipeMillService.listPipeMillEntries(filters),
    laddleChecklistService.listLaddleChecklists(filters),
    tundishChecklistService.listTundishChecklists(filters),
    laddleReturnService.listLaddleReturns(filters)
  ]);

  const tables = {
    qc_lab_samples: qcLabSamples,
    sms_register: smsRegisters,
    hot_coil: hotCoilEntries,
    re_coiler: reCoilerEntries,
    pipe_mill: pipeMillEntries,
    laddle_checklist: laddleChecklistEntries,
    tundish_checklist: tundishChecklistEntries,
    laddle_return: laddleReturnEntries
  };

  const counts = Object.fromEntries(
    Object.entries(tables).map(([tableName, rows]) => [tableName, rows.length])
  );

  const appliedFilters = uniqueCode ? { unique_code: uniqueCode } : {};

  return { tables, counts, appliedFilters };
};

module.exports = { getAdminTablesSnapshot };
