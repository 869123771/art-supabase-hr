import { omit } from 'lodash-es'

export type Employee = Api.Hr.Employee
export type EmployeeProfileForm = Api.Hr.EmployeeProfile

export const createEmployee = (tenantId?: string): Employee => ({
  tenantId,
  organizationId: null,
  positionId: null,
  employeeNo: '',
  employeeName: '',
  avatarUrl: null,
  jobTitle: '',
  employmentStatus: 'active',
  employmentType: 'full_time',
  gender: null,
  birthDate: null,
  phone: '',
  email: '',
  idCardNo: '',
  ethnicity: null,
  educationLevel: null,
  schoolName: '',
  majorName: '',
  maritalStatus: null,
  politicalStatus: null,
  nativePlace: '',
  homeAddress: '',
  hireDate: null,
  probationEndDate: null,
  leaveDate: null,
  contractStartDate: null,
  contractEndDate: null,
  emergencyContactName: '',
  emergencyContactRelation: null,
  emergencyContactPhone: '',
  remark: ''
})

export const createEducation = (): Api.Hr.EmployeeEducation => ({
  schoolName: '',
  majorName: '',
  educationLevel: 'bachelor',
  degree: null,
  startDate: null,
  endDate: null,
  fullTime: true,
  certificateNo: '',
  remark: ''
})

export const createWorkExperience = (): Api.Hr.EmployeeWorkExperience => ({
  companyName: '',
  departmentName: '',
  jobTitle: '',
  startDate: '',
  endDate: null,
  responsibilities: '',
  leavingReason: '',
  referenceName: '',
  referencePhone: ''
})

export const createTraining = (): Api.Hr.EmployeeTraining => ({
  trainingName: '',
  trainingType: 'internal',
  providerName: '',
  startDate: '',
  endDate: null,
  trainingResult: null,
  certificateName: '',
  certificateNo: '',
  cost: null,
  remark: ''
})

export const createReward = (): Api.Hr.EmployeeReward => ({
  recordType: 'reward',
  recordLevel: null,
  title: '',
  recordDate: '',
  issuingOrganization: '',
  amount: null,
  description: ''
})

export const createEmployeeProfile = (tenantId?: string): EmployeeProfileForm => ({
  ...createEmployee(tenantId),
  contracts: [],
  educations: [],
  workExperiences: [],
  trainings: [],
  rewards: []
})

interface NormalizeEmployeeOptions {
  contactDetailsEditable: boolean
  identityDetailsEditable: boolean
  careerRecordsEditable: boolean
  tenantId?: string
}

export const normalizeEmployee = (
  profile: EmployeeProfileForm,
  options: NormalizeEmployeeOptions
): Employee => {
  const employee = omit(structuredClone(profile), [
    'contracts',
    'educations',
    'workExperiences',
    'trainings',
    'rewards',
    'tenant',
    'organization',
    'account',
    'fieldAccess',
    'isRecordOwner',
    'historyCounts',
    'historiesMasked',
    'createBy',
    'createTime',
    'updateBy',
    'updateTime'
  ]) as Employee

  if (!options.contactDetailsEditable) {
    ;[
      'phone',
      'email',
      'homeAddress',
      'emergencyContactName',
      'emergencyContactRelation',
      'emergencyContactPhone'
    ].forEach((key) => Reflect.deleteProperty(employee, key))
  }
  if (!options.identityDetailsEditable) {
    ;[
      'gender',
      'birthDate',
      'idCardNo',
      'ethnicity',
      'educationLevel',
      'schoolName',
      'majorName',
      'maritalStatus',
      'politicalStatus',
      'nativePlace'
    ].forEach((key) => Reflect.deleteProperty(employee, key))
  }
  if (!options.careerRecordsEditable) Reflect.deleteProperty(employee, 'remark')
  if (options.tenantId) employee.tenantId = options.tenantId
  return employee
}
