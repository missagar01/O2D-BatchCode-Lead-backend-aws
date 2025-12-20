const qcLabSamplesService = require('./qcLabSamples.service');
const smsRegisterService = require('./smsRegister.service');
const hotCoilService = require('./hotCoil.service');
const reCoilerService = require('./reCoiler.service');
const pipeMillService = require('./pipeMill.service');
const laddleChecklistService = require('./laddleChecklist.service');
const tundishChecklistService = require('./tundishChecklist.service');
const laddleReturnService = require('./laddleReturn.service');

const buildFilters = (uniqueCode) => (uniqueCode ? { uniqueCode } : {});

const isAdminUser = (user) => {
  const role = (user?.role || user?.userType || '').toString().toLowerCase();
  return role === 'admin' || role === 'superadmin' || role === 'super_admin';
};

const normalizeUsername = (user) => {
  const username = user?.username || user?.user_name || user?.userName;
  if (typeof username !== 'string') {
    return '';
  }
  return username.trim().toLowerCase();
};

const filterRowsByFields = (rows, username, fields) => {
  if (!rows || !rows.length || !username || !fields.length) {
    return rows ?? [];
  }

  return rows.filter((row) =>
    fields.some((field) => {
      const value = row[field];
      if (typeof value !== 'string') {
        return false;
      }
      return value.trim().toLowerCase() === username;
    })
  );
};

const getAdminTablesSnapshot = async ({ uniqueCode, user } = {}) => {
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

  const filteredTables = (() => {
    if (isAdminUser(user)) {
      return tables;
    }

    const username = normalizeUsername(user);
    if (!username) {
      return Object.fromEntries(Object.keys(tables).map((tableName) => [tableName, []]));
    }

    return {
      qc_lab_samples: filterRowsByFields(tables.qc_lab_samples, username, ['tested_by']),
      sms_register: filterRowsByFields(tables.sms_register, username, ['shift_incharge', 'sms_head', 'created_by']),
      hot_coil: filterRowsByFields(tables.hot_coil, username, [
        'mill_incharge',
        'quality_supervisor',
        'electrical_dc_operator',
        'shift_supervisor',
        'created_by'
      ]),
      re_coiler: filterRowsByFields(tables.re_coiler, username, [
        'supervisor',
        'incharge',
        'contractor',
        'welder_name',
        'created_by'
      ]),
      pipe_mill: filterRowsByFields(tables.pipe_mill, username, [
        'quality_supervisor',
        'mill_incharge',
        'forman_name',
        'fitter_name',
        'created_by'
      ]),
      laddle_checklist: filterRowsByFields(tables.laddle_checklist, username, [
        'timber_man_name',
        'laddle_man_name',
        'laddle_foreman_name',
        'supervisor_name',
        'created_by'
      ]),
      tundish_checklist: filterRowsByFields(tables.tundish_checklist, username, [
        'tundish_mession_name',
        'stand1_mould_operator',
        'stand2_mould_operator',
        'timber_man_name',
        'laddle_operator_name',
        'shift_incharge_name',
        'forman_name',
        'created_by'
      ]),
      laddle_return: filterRowsByFields(tables.laddle_return, username, [
        'furnace_shift_incharge',
        'furnace_crane_driver',
        'ccm_crane_driver',
        'stand1_mould_operator',
        'stand2_mould_operator',
        'shift_incharge',
        'timber_man',
        'operation_incharge',
        'created_by'
      ])
    };
  })();

  const counts = Object.fromEntries(
    Object.entries(filteredTables).map(([tableName, rows]) => [tableName, rows.length])
  );

  const appliedFilters = uniqueCode ? { unique_code: uniqueCode } : {};

  return { tables: filteredTables, counts, appliedFilters };
};

module.exports = { getAdminTablesSnapshot };
