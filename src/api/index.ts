export {
  deleteEmployee,
  fetchEmployeeList,
  fetchEmployeeOrganizationTree,
  fetchEmployeeProfile,
  fetchEmployeeSelectorList,
  saveEmployeeProfile
} from '@hr/api/modules/employee'

export {
  addPosition,
  deletePosition,
  editPosition,
  fetchEmployeeDriverCarrierOptions,
  fetchPositionList,
  fetchPositionOptions
} from '@hr/api/modules/position'

export {
  completeLifecycleTask,
  deleteHrWorkspaceRecord,
  effectPersonnelChange,
  effectRecruitmentRequisition,
  fetchHrWorkspaceRecords,
  saveHrWorkspaceRecord,
  submitHrApproval
} from '@hr/api/modules/workspace'

export { fetchWorkforceRiskOverview } from '@hr/api/modules/workforce-risk'
export { fetchTalentInventory } from '@hr/api/modules/talent-inventory'
export { fetchSkillMatrix } from '@hr/api/modules/skill-matrix'
