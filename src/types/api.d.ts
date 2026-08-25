declare namespace Api {
  namespace Hr {
    type EmploymentStatus = 'probation' | 'active' | 'leave' | 'terminated'
    type EmploymentType = 'full_time' | 'part_time' | 'intern' | 'contractor'
    type PositionKind = 'standard' | 'driver'
    type DriverType = 'primary' | 'secondary'
    type JobArchitectureEntity = 'family' | 'grade' | 'profile'
    type EmployeeFieldKey =
      | 'contactDetails'
      | 'identityDetails'
      | 'compensationDetails'
      | 'careerRecords'
      | 'maintenanceAudit'
    type EmployeeFieldAccessMap = Partial<Record<EmployeeFieldKey, Api.Common.FieldAccessLevel>>
    type ProtectedAmount = number | string | null

    interface Position {
      id?: string
      tenantId?: string
      tenant?: Pick<SystemManage.TenantListItem, 'id' | 'tenantCode' | 'tenantName'> | null
      positionCode: string
      positionName: string
      positionKind?: PositionKind
      systemCode?: string | null
      organizationId?: string | null
      organization?: Pick<
        SystemManage.OrganizationListItem,
        'id' | 'organizationCode' | 'organizationName'
      > | null
      jobProfileId: string
      jobProfile?: Pick<JobProfile, 'id' | 'jobCode' | 'jobName'> | null
      gradeId?: string | null
      grade?: Pick<Grade, 'id' | 'gradeCode' | 'gradeName'> | null
      headcountLimit: number
      multipleIncumbentsAllowed: boolean
      enabled: boolean
      sort: number
      description?: string | null
      employeeCount?: number
      createBy?: string
      createTime?: string
      updateBy?: string
      updateTime?: string
    }

    type PositionSearchParams = Partial<
      Pick<Position, 'tenantId' | 'enabled'> &
        Api.Common.CommonSearchParams & {
          keyword?: string
        }
    >

    interface PositionOption {
      id: string
      tenantId: string
      positionCode: string
      positionName: string
      positionKind: PositionKind
      systemCode?: string | null
      organizationId?: string | null
      jobProfileId: string
      jobProfile?: Pick<JobProfile, 'id' | 'jobCode' | 'jobName'> | null
      gradeId?: string | null
      grade?: Pick<Grade, 'id' | 'gradeCode' | 'gradeName'> | null
      headcountLimit: number
      multipleIncumbentsAllowed: boolean
      enabled: boolean
    }

    interface JobFamily {
      id?: string
      tenantId?: string
      tenant?: Pick<SystemManage.TenantListItem, 'id' | 'tenantCode' | 'tenantName'> | null
      familyCode: string
      familyName: string
      enabled: boolean
      sort: number
      description?: string | null
      jobProfileCount?: number
      createBy?: string
      createTime?: string
      updateBy?: string
      updateTime?: string
    }

    interface Grade {
      id?: string
      tenantId?: string
      tenant?: Pick<SystemManage.TenantListItem, 'id' | 'tenantCode' | 'tenantName'> | null
      gradeCode: string
      gradeName: string
      gradeLevel: number
      enabled: boolean
      sort: number
      description?: string | null
      jobProfileCount?: number
      createBy?: string
      createTime?: string
      updateBy?: string
      updateTime?: string
    }

    interface JobProfile {
      id?: string
      tenantId?: string
      tenant?: Pick<SystemManage.TenantListItem, 'id' | 'tenantCode' | 'tenantName'> | null
      familyId: string
      family?: Pick<JobFamily, 'id' | 'familyCode' | 'familyName'> | null
      defaultGradeId?: string | null
      defaultGrade?: Pick<Grade, 'id' | 'gradeCode' | 'gradeName'> | null
      jobCode: string
      jobName: string
      enabled: boolean
      sort: number
      responsibilities?: string | null
      requirements?: string | null
      description?: string | null
      positionCount?: number
      createBy?: string
      createTime?: string
      updateBy?: string
      updateTime?: string
    }

    interface JobArchitectureSearchParams extends Api.Common.CommonSearchParams {
      tenantId?: string
      keyword?: string
      enabled?: boolean
    }

    interface JobArchitectureOption {
      id: string
      code: string
      name: string
      level?: number
      familyId?: string
      defaultGradeId?: string | null
    }

    type CompensationEntity = 'employee' | 'plan' | 'component' | 'band'
    type CompensationComponentCategory = 'earning' | 'deduction' | 'employer_cost'
    type CompensationAmountType = 'fixed' | 'rate' | 'variable'
    type PayFrequency = 'monthly' | 'annual' | 'hourly'
    type CompensationLifecycleStatus = 'draft' | 'scheduled' | 'active' | 'expired' | 'cancelled'
    type CompensationRangeStatus = 'within' | 'below' | 'above' | 'unconfigured'

    interface CompensationReference {
      id: string
      code?: string
      name?: string
      employeeNo?: string
      employeeName?: string
      organizationId?: string | null
      organizationName?: string | null
      gradeId?: string | null
      gradeName?: string | null
      currencyCode?: string
      payFrequency?: PayFrequency
      category?: CompensationComponentCategory
      amountType?: CompensationAmountType
      level?: number
    }

    interface PayComponent {
      id?: string
      tenantId?: string
      tenant?: Pick<SystemManage.TenantListItem, 'id' | 'tenantCode' | 'tenantName'> | null
      componentCode: string
      componentName: string
      category: CompensationComponentCategory
      amountType: CompensationAmountType
      taxable: boolean
      enabled: boolean
      sort: number
      description?: string | null
      planCount?: number
      createBy?: string
      createTime?: string
      updateBy?: string
      updateTime?: string
    }

    interface CompensationPlanItem {
      id?: string
      componentId: string
      componentCode?: string
      componentName?: string
      category?: CompensationComponentCategory
      amountType?: CompensationAmountType
      defaultAmount?: ProtectedAmount
      defaultRate?: ProtectedAmount
      required: boolean
      sort: number
    }

    interface CompensationPlan {
      id?: string
      tenantId?: string
      tenant?: Pick<SystemManage.TenantListItem, 'id' | 'tenantCode' | 'tenantName'> | null
      planCode: string
      planName: string
      currencyCode: string
      payFrequency: PayFrequency
      enabled: boolean
      sort: number
      description?: string | null
      componentCount?: number
      employeeCount?: number
      items: CompensationPlanItem[]
      createBy?: string
      createTime?: string
      updateBy?: string
      updateTime?: string
    }

    interface SalaryBand {
      id?: string
      tenantId?: string
      tenant?: Pick<SystemManage.TenantListItem, 'id' | 'tenantCode' | 'tenantName'> | null
      gradeId: string
      grade?: Pick<Grade, 'id' | 'gradeCode' | 'gradeName' | 'gradeLevel'> | null
      currencyCode: string
      minimumAmount: ProtectedAmount
      midpointAmount: ProtectedAmount
      maximumAmount: ProtectedAmount
      effectiveFrom: string
      effectiveTo?: string | null
      status?: 'draft' | 'approved' | 'cancelled'
      lifecycleStatus?: CompensationLifecycleStatus
      description?: string | null
      createBy?: string
      createTime?: string
      updateBy?: string
      updateTime?: string
    }

    interface EmployeeCompensationItem {
      id?: string
      componentId: string
      componentCode?: string
      componentName?: string
      category?: CompensationComponentCategory
      amountType?: CompensationAmountType
      amount?: ProtectedAmount
      rate?: ProtectedAmount
      source?: 'plan' | 'override'
    }

    interface EmployeeCompensation {
      id?: string
      tenantId?: string
      tenant?: Pick<SystemManage.TenantListItem, 'id' | 'tenantCode' | 'tenantName'> | null
      employeeId: string
      employee?: Pick<Employee, 'id' | 'employeeNo' | 'employeeName'> | null
      organization?: Pick<
        SystemManage.OrganizationListItem,
        'id' | 'organizationCode' | 'organizationName'
      > | null
      planId: string
      plan?: Pick<CompensationPlan, 'id' | 'planCode' | 'planName'> | null
      gradeId?: string | null
      grade?: Pick<Grade, 'id' | 'gradeCode' | 'gradeName' | 'gradeLevel'> | null
      baseAmount: ProtectedAmount
      currencyCode: string
      payFrequency: PayFrequency
      effectiveFrom: string
      effectiveTo?: string | null
      status?: 'draft' | 'approved' | 'cancelled'
      lifecycleStatus?: CompensationLifecycleStatus
      rangeStatus?: CompensationRangeStatus
      bandMinimum?: ProtectedAmount
      bandMaximum?: ProtectedAmount
      changeReason: string
      sourceChangeId?: string | null
      approvedBy?: string | null
      approvedAt?: string | null
      items: EmployeeCompensationItem[]
      createBy?: string
      createTime?: string
      updateBy?: string
      updateTime?: string
    }

    type CompensationRecord = EmployeeCompensation | CompensationPlan | PayComponent | SalaryBand

    interface CompensationSearchParams extends Api.Common.CommonSearchParams {
      tenantId?: string
      keyword?: string
      status?: string
    }

    interface CompensationOverview {
      employeeCount: number
      coveredCount: number
      coverageRate: number
      scheduledCount: number
      enabledPlanCount: number
      enabledComponentCount: number
    }

    interface CompensationListResult<TRecord extends CompensationRecord = CompensationRecord> {
      records: TRecord[]
      total: number
      amountAccess: boolean
    }

    type AbsenceEntity = 'request' | 'balance' | 'policy' | 'type' | 'ledger'
    type LeaveUnit = 'day' | 'hour'
    type LeavePolicyScope = 'all' | 'organization' | 'employee' | 'grade'
    type LeaveEntitlementMethod = 'annual' | 'monthly_accrual' | 'manual' | 'none'
    type LeavePolicyStatus = 'draft' | 'active' | 'inactive'
    type LeaveRequestStatus = 'draft' | 'pending' | 'approved' | 'rejected' | 'cancelled'

    interface AbsenceReference {
      id: string
      tenantId?: string
      code?: string
      name?: string
      unit?: LeaveUnit
      minimumIncrement?: number
      leaveTypeId?: string
      organizationId?: string | null
      organizationName?: string | null
    }

    interface LeaveType {
      id?: string
      tenantId?: string
      tenant?: Pick<SystemManage.TenantListItem, 'id' | 'tenantCode' | 'tenantName'> | null
      leaveCode: string
      leaveName: string
      category: string
      unit: LeaveUnit
      paidRatio: number
      minimumIncrement: number
      proofRequiredAfter?: number | null
      color: string
      enabled: boolean
      sort: number
      description?: string | null
      policyCount?: number
      createBy?: string
      createTime?: string
      updateBy?: string
      updateTime?: string
    }

    interface LeavePolicyScopeReference {
      organizationId?: string | null
      organizationCode?: string | null
      organizationName?: string | null
      employeeId?: string | null
      employeeNo?: string | null
      employeeName?: string | null
      gradeId?: string | null
      gradeCode?: string | null
      gradeName?: string | null
    }

    interface LeavePolicy {
      id?: string
      tenantId?: string
      tenant?: Pick<SystemManage.TenantListItem, 'id' | 'tenantCode' | 'tenantName'> | null
      leaveTypeId: string
      leaveType?: Pick<LeaveType, 'id' | 'leaveCode' | 'leaveName' | 'unit'> | null
      policyCode: string
      policyName: string
      scopeType: LeavePolicyScope
      organizationId?: string | null
      employeeId?: string | null
      gradeId?: string | null
      scope?: LeavePolicyScopeReference | null
      entitlementMethod: LeaveEntitlementMethod
      annualQuota: number
      monthlyAccrual: number
      carryoverLimit: number
      carryoverExpiryMonths?: number | null
      allowNegative: boolean
      negativeLimit: number
      probationEligible: boolean
      effectiveFrom: string
      effectiveTo?: string | null
      status: LeavePolicyStatus
      description?: string | null
      createBy?: string
      createTime?: string
      updateBy?: string
      updateTime?: string
    }

    interface LeaveBalance {
      id?: string
      tenantId?: string
      tenant?: Pick<SystemManage.TenantListItem, 'id' | 'tenantCode' | 'tenantName'> | null
      employeeId: string
      employee?: Pick<Employee, 'id' | 'employeeNo' | 'employeeName'> | null
      organization?: Pick<SystemManage.OrganizationListItem, 'organizationName'> | null
      leaveTypeId: string
      leaveType?: Pick<LeaveType, 'id' | 'leaveCode' | 'leaveName' | 'unit'> | null
      policyId?: string | null
      policy?: Pick<LeavePolicy, 'id' | 'policyCode' | 'policyName'> | null
      balanceYear: number
      openingAmount: number
      accruedAmount: number
      adjustedAmount: number
      pendingAmount: number
      usedAmount: number
      expiredAmount: number
      availableAmount: number
      expiresOn?: string | null
      createBy?: string
      createTime?: string
      updateBy?: string
      updateTime?: string
    }

    interface LeaveRequest {
      id?: string
      tenantId?: string
      tenant?: Pick<SystemManage.TenantListItem, 'id' | 'tenantCode' | 'tenantName'> | null
      requestNo?: string
      employeeId: string
      employee?: Pick<Employee, 'id' | 'employeeNo' | 'employeeName'> | null
      organization?: Pick<SystemManage.OrganizationListItem, 'organizationName'> | null
      leaveTypeId: string
      leaveType?: Pick<LeaveType, 'id' | 'leaveCode' | 'leaveName' | 'unit'> | null
      policyId?: string | null
      balanceId?: string | null
      startDate: string
      endDate: string
      startSession: 'full' | 'morning' | 'afternoon'
      endSession: 'full' | 'morning' | 'afternoon'
      requestedAmount: number
      unitSnapshot?: LeaveUnit
      reason: string
      proofUrls: string[]
      status?: LeaveRequestStatus
      workflowInstanceId?: string | null
      submittedAt?: string | null
      reviewedAt?: string | null
      reviewedBy?: string | null
      reviewComment?: string | null
      createBy?: string
      createTime?: string
      updateBy?: string
      updateTime?: string
    }

    interface LeaveLedger {
      id: string
      tenantId: string
      balanceId: string
      employeeId: string
      employee?: Pick<Employee, 'id' | 'employeeNo' | 'employeeName'> | null
      leaveTypeId: string
      leaveType?: Pick<LeaveType, 'id' | 'leaveCode' | 'leaveName' | 'unit'> | null
      requestId?: string | null
      request?: Pick<LeaveRequest, 'id' | 'requestNo'> | null
      transactionType: string
      deltaOpening: number
      deltaAccrued: number
      deltaAdjusted: number
      deltaPending: number
      deltaUsed: number
      deltaExpired: number
      occurredOn: string
      reason: string
      createBy?: string
      createTime?: string
    }

    type AbsenceRecord = LeaveRequest | LeaveBalance | LeavePolicy | LeaveType | LeaveLedger

    interface AbsenceSearchParams extends Api.Common.CommonSearchParams {
      tenantId?: string
      keyword?: string
      status?: string
      balanceYear?: number
    }

    interface AbsenceOverview {
      pendingCount: number
      upcomingCount: number
      coveredEmployeeCount: number
      activePolicyCount: number
      expiringBalanceCount: number
    }

    interface AbsenceListResult<TRecord extends AbsenceRecord = AbsenceRecord> {
      records: TRecord[]
      total: number
      reasonAccess: boolean
    }

    interface AssignmentSnapshot {
      assignmentId?: string | null
      assignmentUpdatedAt?: string | null
      organizationId?: string | null
      organizationCode?: string | null
      organizationName?: string | null
      positionId?: string | null
      positionCode?: string | null
      positionName?: string | null
      jobProfileId?: string | null
      jobCode?: string | null
      jobName?: string | null
      gradeId?: string | null
      gradeCode?: string | null
      gradeName?: string | null
      businessTitle?: string | null
      assignmentStatus?: string | null
      employmentStatus?: EmploymentStatus | null
      effectiveStart?: string | null
      fte?: number | null
    }

    interface PersonnelChangeEmployeeOption {
      id: string
      tenantId: string
      employeeNo: string
      employeeName: string
      avatarUrl?: string | null
      jobTitle?: string | null
      employmentStatus: EmploymentStatus
      assignmentId: string
      assignmentUpdatedAt: string
      assignmentSnapshot: AssignmentSnapshot
    }

    interface OrganizationPositionEmployee {
      id: string
      organizationId?: string | null
      positionId: string
      employeeNo: string
      employeeName: string
      avatarUrl?: string | null
      jobTitle?: string | null
      employmentStatus: EmploymentStatus
      employmentType: EmploymentType
      hireDate?: string | null
    }

    interface OrganizationPositionDirectory {
      positions: Position[]
      employees: OrganizationPositionEmployee[]
      employeeTotal: number
      truncated: boolean
    }

    interface EmployeeDriverInput {
      carrierId: string
      driverType: DriverType
      licenseType: string
      licenseExpireDate: string
    }

    interface DriverCarrierOption {
      id: string
      carrierCode?: string
      companyName: string
      enabled?: boolean
    }

    interface EmployeeAccount {
      id: string
      userEmail: string
      status: string
    }

    interface Employee {
      id?: string
      tenantId?: string
      tenant?: Pick<SystemManage.TenantListItem, 'id' | 'tenantCode' | 'tenantName'> | null
      organizationId?: string | null
      organization?: Pick<
        SystemManage.OrganizationListItem,
        'id' | 'organizationCode' | 'organizationName'
      > | null
      positionId?: string | null
      employeeNo: string
      employeeName: string
      avatarUrl?: string | null
      jobTitle?: string | null
      employmentStatus: EmploymentStatus
      employmentType: EmploymentType
      gender?: string | null
      birthDate?: string | null
      phone?: string | null
      email?: string | null
      idCardNo?: string | null
      ethnicity?: string | null
      educationLevel?: string | null
      schoolName?: string | null
      majorName?: string | null
      maritalStatus?: string | null
      politicalStatus?: string | null
      nativePlace?: string | null
      homeAddress?: string | null
      hireDate?: string | null
      probationEndDate?: string | null
      leaveDate?: string | null
      contractStartDate?: string | null
      contractEndDate?: string | null
      emergencyContactName?: string | null
      emergencyContactRelation?: string | null
      emergencyContactPhone?: string | null
      remark?: string | null
      account?: EmployeeAccount | null
      createBy?: string
      createTime?: string
      updateBy?: string
      updateTime?: string
      fieldAccess?: EmployeeFieldAccessMap
      isRecordOwner?: boolean
    }

    type EmployeeSearchParams = Partial<
      Pick<Employee, 'tenantId' | 'organizationId' | 'employmentStatus' | 'employmentType'> &
        Api.Common.CommonSearchParams & {
          keyword?: string
          hireDateRange?: string[]
          recordId?: string
          organizationIds?: string[]
          organizationUnassigned?: boolean
        }
    >

    interface EmployeeContract {
      id?: string
      tenantId?: string
      employeeId?: string
      contractNo: string
      contractType: string
      contractStatus: string
      signDate?: string | null
      startDate: string
      endDate?: string | null
      probationEndDate?: string | null
      workLocation?: string | null
      monthlySalary?: ProtectedAmount
      attachmentUrl?: string | null
      renewalReminderDays?: number
      remark?: string | null
    }

    interface EmployeeEducation {
      id?: string
      tenantId?: string
      employeeId?: string
      schoolName: string
      majorName?: string | null
      educationLevel: string
      degree?: string | null
      startDate?: string | null
      endDate?: string | null
      fullTime: boolean
      certificateNo?: string | null
      remark?: string | null
    }

    interface EmployeeWorkExperience {
      id?: string
      tenantId?: string
      employeeId?: string
      companyName: string
      departmentName?: string | null
      jobTitle: string
      startDate: string
      endDate?: string | null
      responsibilities?: string | null
      leavingReason?: string | null
      referenceName?: string | null
      referencePhone?: string | null
    }

    interface EmployeeTraining {
      id?: string
      tenantId?: string
      employeeId?: string
      trainingName: string
      trainingType: string
      providerName?: string | null
      startDate: string
      endDate?: string | null
      trainingResult?: string | null
      certificateName?: string | null
      certificateNo?: string | null
      cost?: ProtectedAmount
      remark?: string | null
    }

    interface EmployeeReward {
      id?: string
      tenantId?: string
      employeeId?: string
      recordType: string
      recordLevel?: string | null
      title: string
      recordDate: string
      issuingOrganization?: string | null
      amount?: ProtectedAmount
      description?: string | null
    }

    interface EmployeeProfile extends Employee {
      contracts: EmployeeContract[]
      educations: EmployeeEducation[]
      workExperiences: EmployeeWorkExperience[]
      trainings: EmployeeTraining[]
      rewards: EmployeeReward[]
      historyCounts?: Partial<
        Record<'contracts' | 'educations' | 'workExperiences' | 'trainings' | 'rewards', number>
      >
      historiesMasked?: boolean
    }

    interface EmployeeProfilePayload {
      employee: Employee
      driver?: EmployeeDriverInput | null
      contracts?: EmployeeContract[]
      educations?: EmployeeEducation[]
      workExperiences?: EmployeeWorkExperience[]
      trainings?: EmployeeTraining[]
      rewards?: EmployeeReward[]
    }

    interface EmployeeSelectorItem {
      id: string
      tenantId: string
      organizationId?: string | null
      employeeNo: string
      employeeName: string
      avatarUrl?: string | null
      jobTitle?: string | null
      employmentStatus: EmploymentStatus
      gender?: string | null
      phone?: string | null
      email?: string | null
      organization?: Pick<
        SystemManage.OrganizationListItem,
        'id' | 'organizationCode' | 'organizationName'
      > | null
    }

    type ApprovalStatus = 'draft' | 'pending' | 'approved' | 'effective' | 'rejected' | 'cancelled'
    type WorkspaceEntity =
      | 'contract'
      | 'personnelChange'
      | 'lifecycleCase'
      | 'lifecycleTask'
      | 'qualification'
      | 'headcount'
      | 'shift'
      | 'shiftAssignment'
      | 'attendance'
      | 'selfServiceRequest'
      | 'performanceCycle'
      | 'performanceReview'
      | 'performanceGoal'
      | 'trainingPlan'
      | 'trainingEnrollment'
      | 'competency'
      | 'positionCompetency'
      | 'employeeCompetency'
      | 'recruitmentRequisition'
      | 'candidate'

    interface WorkspaceReference {
      id: string
      employeeNo?: string
      employeeName?: string
      positionCode?: string
      positionName?: string
      jobCode?: string
      jobName?: string
      gradeCode?: string
      gradeName?: string
      organizationCode?: string
      organizationName?: string
      shiftCode?: string
      shiftName?: string
      cycleCode?: string
      cycleName?: string
      planCode?: string
      planName?: string
      competencyCode?: string
      competencyName?: string
      requisitionNo?: string
    }

    interface WorkspaceRecord {
      id?: string
      tenantId?: string
      employeeId?: string | null
      employee?: WorkspaceReference | null
      organizationId?: string | null
      organization?: WorkspaceReference | null
      fromOrganization?: WorkspaceReference | null
      toOrganization?: WorkspaceReference | null
      positionId?: string | null
      position?: WorkspaceReference | null
      fromPosition?: WorkspaceReference | null
      toPosition?: WorkspaceReference | null
      contractNo?: string
      contractType?: string
      contractStatus?: string
      signDate?: string | null
      probationEndDate?: string | null
      workLocation?: string | null
      monthlySalary?: ProtectedAmount
      renewalReminderDays?: number
      changeNo?: string
      changeType?: string
      effectiveDate?: string
      status?: string
      fromOrganizationId?: string | null
      toOrganizationId?: string | null
      fromPositionId?: string | null
      toPositionId?: string | null
      fromEmploymentStatus?: string | null
      toEmploymentStatus?: string | null
      fromJobTitle?: string | null
      toJobTitle?: string | null
      fromJobProfileId?: string | null
      toJobProfileId?: string | null
      fromGradeId?: string | null
      toGradeId?: string | null
      fromBusinessTitle?: string | null
      toBusinessTitle?: string | null
      baseAssignmentId?: string | null
      baseAssignmentUpdatedAt?: string | null
      beforeAssignmentSnapshot?: AssignmentSnapshot
      afterAssignmentSnapshot?: AssignmentSnapshot
      reason?: string | null
      caseNo?: string
      caseType?: string
      plannedEffectiveDate?: string
      ownerUserId?: string | null
      lifecycleCaseId?: string | null
      lifecycleCase?: WorkspaceReference | null
      taskType?: string
      taskName?: string
      responsibleUserId?: string | null
      dueDate?: string | null
      completionNote?: string | null
      sort?: number
      qualificationType?: string
      qualificationName?: string
      certificateNo?: string | null
      issuer?: string | null
      issueDate?: string | null
      expiryDate?: string | null
      attachmentUrl?: string | null
      reminderDays?: number
      approvedCount?: number
      occupiedCount?: number
      vacancyCount?: number
      effectiveFrom?: string
      effectiveTo?: string | null
      enabled?: boolean
      shiftCode?: string
      shiftName?: string
      shiftType?: string
      startTime?: string
      endTime?: string
      breakMinutes?: number
      crossDay?: boolean
      shiftId?: string | null
      shift?: WorkspaceReference | null
      workDate?: string
      assignmentStatus?: string
      clockInAt?: string | null
      clockOutAt?: string | null
      workMinutes?: number
      overtimeMinutes?: number
      attendanceStatus?: string
      source?: string
      requestNo?: string
      requestType?: string
      title?: string
      startAt?: string | null
      endAt?: string | null
      durationHours?: number | null
      requestData?: Record<string, unknown>
      cycleCode?: string
      cycleName?: string
      startDate?: string
      endDate?: string | null
      description?: string | null
      cycleId?: string | null
      cycle?: WorkspaceReference | null
      reviewerUserId?: string | null
      totalScore?: number | null
      performanceLevel?: string | null
      employeeSummary?: string | null
      reviewerComment?: string | null
      reviewId?: string | null
      review?: WorkspaceReference | null
      goalName?: string
      targetDescription?: string
      weight?: number
      actualResult?: string | null
      evidenceSource?: string | null
      planCode?: string
      planName?: string
      trainingType?: string
      providerName?: string | null
      budget?: number | null
      objective?: string | null
      planId?: string | null
      plan?: WorkspaceReference | null
      score?: number | null
      result?: string | null
      competencyCode?: string
      competencyName?: string
      category?: string
      competencyId?: string | null
      competency?: WorkspaceReference | null
      currentLevel?: string
      requiredLevel?: string
      assessedDate?: string
      evidence?: string | null
      requisitionNo?: string
      openingCount?: number
      hiredCount?: number
      expectedOnboardDate?: string | null
      employmentType?: EmploymentType
      requirements?: string | null
      requisitionId?: string | null
      requisition?: WorkspaceReference | null
      candidateName?: string
      phone?: string | null
      email?: string | null
      stage?: string
      expectedSalary?: number | null
      resumeUrl?: string | null
      interviewFeedback?: string | null
      offerDate?: string | null
      onboardEmployeeId?: string | null
      remark?: string | null
      createBy?: string | null
      createTime?: string
      updateBy?: string | null
      updateTime?: string
    }

    interface WorkspaceSearchParams extends Api.Common.CommonSearchParams {
      keyword?: string
      status?: string
      employeeId?: string
      tenantId?: string
    }

    type RecruitmentEntity =
      'requisition' | 'candidate' | 'interview' | 'offer' | 'handoff' | 'task'

    interface RecruitmentReference {
      id: string
      tenantId?: string
      code?: string
      name: string
      organizationName?: string
      positionName?: string
      requisitionNo?: string
      candidateId?: string
      proposedOnboardDate?: string
      plannedOnboardDate?: string
      stage?: string
    }

    interface RecruitmentBaseRecord {
      id?: string
      tenantId?: string
      createBy?: string | null
      createTime?: string
      updateBy?: string | null
      updateTime?: string
    }

    interface RecruitmentRequisition extends RecruitmentBaseRecord {
      requisitionNo: string
      organizationId: string
      positionId: string
      openingCount: number
      hiredCount?: number
      expectedOnboardDate?: string | null
      employmentType: EmploymentType
      status: string
      reason: string
      requirements?: string | null
      candidateCount?: number
      interviewCount?: number
      offerCount?: number
      organization?: RecruitmentReference
      position?: RecruitmentReference
    }

    interface RecruitmentCandidate extends RecruitmentBaseRecord {
      requisitionId: string
      candidateName: string
      phone?: string | null
      email?: string | null
      source: string
      stage: string
      expectedSalary?: number | null
      resumeUrl?: string | null
      remark?: string | null
      consentStatus: string
      consentAt?: string | null
      retentionUntil?: string | null
      rejectionReason?: string | null
      onboardEmployeeId?: string | null
      interviewCount?: number
      latestOfferStatus?: string | null
      stageChangedAt?: string | null
      requisition?: RecruitmentReference
    }

    interface RecruitmentInterview extends RecruitmentBaseRecord {
      candidateId: string
      roundNo: number
      interviewType: string
      scheduledStartAt: string
      scheduledEndAt: string
      location?: string | null
      interviewerEmployeeId: string
      status: string
      score?: number | null
      recommendation?: string | null
      feedback?: string | null
      completedAt?: string | null
      candidate?: RecruitmentReference
      interviewer?: RecruitmentReference
    }

    interface RecruitmentOffer extends RecruitmentBaseRecord {
      candidateId: string
      offerNo: string
      versionNo: number
      employmentType: EmploymentType
      monthlySalary?: number | null
      targetBonus?: number | null
      currency: string
      probationMonths: number
      proposedOnboardDate: string
      expiresOn: string
      status: string
      approvalComment?: string | null
      approvedBy?: string | null
      approvedAt?: string | null
      sentAt?: string | null
      respondedAt?: string | null
      responseNote?: string | null
      candidate?: RecruitmentReference
    }

    interface RecruitmentHandoff extends RecruitmentBaseRecord {
      candidateId: string
      offerId: string
      organizationId: string
      positionId: string
      plannedOnboardDate: string
      ownerEmployeeId?: string | null
      buddyEmployeeId?: string | null
      onboardEmployeeId?: string | null
      status: string
      handoffNote?: string | null
      completedAt?: string | null
      taskCount?: number
      completedTaskCount?: number
      overdueTaskCount?: number
      candidate?: RecruitmentReference
      offer?: RecruitmentReference
      organization?: RecruitmentReference
      position?: RecruitmentReference
      owner?: RecruitmentReference | null
      buddy?: RecruitmentReference | null
      onboardEmployee?: RecruitmentReference | null
    }

    interface RecruitmentTask extends RecruitmentBaseRecord {
      handoffId: string
      taskCategory: string
      taskTitle: string
      taskDescription?: string | null
      ownerEmployeeId?: string | null
      dueDate: string
      status: string
      completionNote?: string | null
      completedAt?: string | null
      handoff?: RecruitmentReference
      owner?: RecruitmentReference | null
    }

    type RecruitmentRecord =
      | RecruitmentRequisition
      | RecruitmentCandidate
      | RecruitmentInterview
      | RecruitmentOffer
      | RecruitmentHandoff
      | RecruitmentTask

    interface RecruitmentOverview {
      activeRequisitionCount: number
      openCandidateCount: number
      upcomingInterviewCount: number
      awaitingOfferResponseCount: number
      acceptedOfferCount: number
      pendingHandoffCount: number
      overdueTaskCount: number
      hiredCandidateCount: number
    }

    interface RecruitmentSearchParams extends Api.Common.CommonSearchParams {
      keyword?: string
      status?: string
      tenantId?: string
    }

    interface RecruitmentListResult<TRecord extends RecruitmentRecord = RecruitmentRecord> {
      records: TRecord[]
      total: number
      sensitiveAccess: boolean
    }

    type WorkforceRiskKind = 'contract' | 'qualification' | 'headcount' | 'probation'
    type WorkforceRiskLevel = 'critical' | 'warning' | 'attention'

    interface WorkforceRiskItem {
      id: string
      kind: WorkforceRiskKind
      level: WorkforceRiskLevel
      title: string
      subject: string
      dueDate?: string | null
      daysRemaining?: number | null
      description: string
      routePath: string
    }

    interface WorkforceRiskOverview {
      generatedAt: string
      activeEmployeeCount: number
      criticalCount: number
      expiringContractCount: number
      expiringQualificationCount: number
      vacancyCount: number
      probationDueCount: number
      items: WorkforceRiskItem[]
    }

    type LearningEntity =
      | 'plan'
      | 'course'
      | 'course_competency'
      | 'session'
      | 'enrollment'
      | 'certificate'
    type LearningOptionKind = 'plan' | 'course' | 'session' | 'competency'
    type LearningPlanStatus = 'draft' | 'published' | 'in_progress' | 'completed' | 'cancelled'
    type LearningCourseStatus = 'draft' | 'published' | 'retired'
    type LearningSessionStatus = 'planned' | 'open' | 'in_progress' | 'completed' | 'cancelled'
    type LearningEnrollmentStatus =
      | 'enrolled'
      | 'attending'
      | 'passed'
      | 'failed'
      | 'withdrawn'
      | 'no_show'
    type LearningCertificateStatus = 'valid' | 'expired' | 'revoked'

    interface LearningReference {
      id: string
      tenantId?: string
      code?: string | null
      name?: string | null
      status?: string | null
      planId?: string | null
      courseId?: string | null
      startAt?: string | null
      endAt?: string | null
      durationHours?: number | null
    }

    interface LearningPlan {
      id?: string
      tenantId?: string
      planCode: string
      planName: string
      trainingType: string
      startDate: string
      endDate?: string | null
      providerName?: string | null
      budget?: number | null
      actualCost?: number | null
      status: LearningPlanStatus
      objective?: string | null
      remark?: string | null
      ownerEmployeeId?: string | null
      targetAudience?: string | null
      mandatory: boolean
      approvedBy?: string | null
      approvedAt?: string | null
      owner?: LearningReference | null
      sessionCount?: number
      learnerCount?: number
      createTime?: string
      updateTime?: string
    }

    interface LearningCourse {
      id?: string
      tenantId?: string
      courseCode: string
      courseName: string
      category: string
      deliveryMode: string
      durationHours: number
      creditHours: number
      providerName?: string | null
      passingScore?: number | null
      minimumAttendancePercent: number
      certificateEnabled: boolean
      certificateValidMonths?: number | null
      status: LearningCourseStatus
      description?: string | null
      learningObjectives?: string | null
      targetAudience?: string | null
      sessionCount?: number
      competencyCount?: number
      createTime?: string
      updateTime?: string
    }

    interface LearningSession {
      id?: string
      tenantId?: string
      sessionCode: string
      planId: string
      courseId: string
      startAt: string
      endAt: string
      enrollmentDeadline?: string | null
      capacity: number
      instructorName?: string | null
      location?: string | null
      meetingUrl?: string | null
      estimatedCost?: number | null
      actualCost?: number | null
      status: LearningSessionStatus
      completionNote?: string | null
      plan?: LearningReference
      course?: LearningReference
      enrollmentCount?: number
      passedCount?: number
      createTime?: string
      updateTime?: string
    }

    interface LearningCourseCompetency {
      id?: string
      tenantId?: string
      courseId: string
      competencyId: string
      targetLevel: string
      course?: LearningReference
      competency?: LearningReference
      createTime?: string
      updateTime?: string
    }

    interface LearningEnrollment {
      id?: string
      tenantId?: string
      planId: string
      sessionId: string
      employeeId: string
      status: LearningEnrollmentStatus
      attendancePercent?: number | null
      score?: number | null
      result?: string | null
      certificateNo?: string | null
      completedAt?: string | null
      completionComment?: string | null
      nominatedByEmployeeId?: string | null
      remark?: string | null
      employee?: LearningReference
      session?: LearningReference
      plan?: LearningReference
      course?: LearningReference
      nominator?: LearningReference | null
      createTime?: string
      updateTime?: string
    }

    interface LearningCertificate {
      id?: string
      tenantId?: string
      enrollmentId: string
      employeeId: string
      courseId: string
      certificateNo: string
      certificateName: string
      issuedOn: string
      expiresOn?: string | null
      credentialUrl?: string | null
      status: LearningCertificateStatus
      revokedReason?: string | null
      revokedAt?: string | null
      employee?: LearningReference
      course?: LearningReference
      createTime?: string
      updateTime?: string
    }

    type LearningRecord =
      | LearningPlan
      | LearningCourse
      | LearningCourseCompetency
      | LearningSession
      | LearningEnrollment
      | LearningCertificate

    interface LearningOverview {
      publishedCourseCount: number
      openSessionCount: number
      activeLearnerCount: number
      completionRate: number
      expiringCertificateCount: number
      budgetExecutionRate: number
    }

    interface LearningListResult<TRecord extends LearningRecord = LearningRecord> {
      records: TRecord[]
      total: number
    }

    interface LearningSearchParams extends Api.Common.CommonSearchParams {
      tenantId?: string
      status?: string
    }

    type SuccessionEntity = 'plan' | 'candidate' | 'action'
    type SuccessionPlanStatus = 'draft' | 'active' | 'closed'
    type SuccessionReadiness =
      'ready_now' | 'one_to_two_years' | 'three_to_five_years' | 'development_needed'
    type SuccessionCandidateStatus = 'nominated' | 'active' | 'withdrawn' | 'placed'
    type SuccessionActionStatus = 'planned' | 'in_progress' | 'completed' | 'cancelled'

    interface SuccessionReference {
      id: string
      tenantId: string
      code?: string
      name: string
      positionName?: string | null
      organizationName?: string | null
      jobTitle?: string | null
      employeeId?: string
      employeeNo?: string
      employeeName?: string
      planName?: string
    }

    interface SuccessionPlan {
      id?: string
      tenantId?: string
      planCode: string
      positionId: string
      planName: string
      criticality: 'medium' | 'high' | 'critical'
      vacancyRisk: 'low' | 'medium' | 'high'
      businessImpact: 'medium' | 'high' | 'critical'
      targetSuccessors: number
      reviewCycleMonths: number
      nextReviewDate: string
      ownerEmployeeId?: string | null
      status: SuccessionPlanStatus
      notes?: string | null
      tenant?: SuccessionReference
      position?: SuccessionReference
      owner?: SuccessionReference | null
      activeCandidateCount?: number
      readyNowCount?: number
      createTime?: string
      updateTime?: string
    }

    interface SuccessionCandidate {
      id?: string
      tenantId?: string
      planId: string
      employeeId: string
      readiness: SuccessionReadiness
      potentialLevel: 'emerging' | 'medium' | 'high'
      retentionRisk: 'low' | 'medium' | 'high'
      priority: number
      nominationSource: 'talent_review' | 'manager' | 'hr' | 'self' | 'external_assessment'
      aspirationConfirmed: boolean
      mobilityScope?: string | null
      strengths?: string | null
      developmentGaps?: string | null
      reviewComment?: string | null
      status: SuccessionCandidateStatus
      nominatedOn: string
      lastReviewedOn?: string | null
      plan?: SuccessionReference
      employee?: SuccessionReference
      openActionCount?: number
      createTime?: string
      updateTime?: string
    }

    interface SuccessionDevelopmentAction {
      id?: string
      tenantId?: string
      candidateId: string
      actionType:
        | 'mentoring'
        | 'training'
        | 'stretch_assignment'
        | 'job_rotation'
        | 'coaching'
        | 'assessment'
        | 'other'
      actionTitle: string
      actionDescription?: string | null
      ownerEmployeeId?: string | null
      startDate: string
      dueDate: string
      status: SuccessionActionStatus
      completionDate?: string | null
      outcome?: string | null
      candidate?: SuccessionReference
      owner?: SuccessionReference | null
      createTime?: string
      updateTime?: string
    }

    type SuccessionRecord = SuccessionPlan | SuccessionCandidate | SuccessionDevelopmentAction

    interface SuccessionOverview {
      activePlanCount: number
      criticalPositionCount: number
      readyNowCount: number
      uncoveredPlanCount: number
      overdueActionCount: number
      dueReviewCount: number
    }

    interface SuccessionListResult<TRecord extends SuccessionRecord = SuccessionRecord> {
      records: TRecord[]
      total: number
    }

    interface SuccessionSearchParams extends Api.Common.CommonSearchParams {
      keyword?: string
      status?: string
      tenantId?: string
      from?: number
      to?: number
    }

    interface TalentInventoryRecord {
      id: string
      employeeNo: string
      employeeName: string
      jobTitle?: string | null
      organizationName?: string | null
      positionName?: string | null
      performanceLevel?: string | null
      totalScore?: number | null
      cycleName?: string | null
      competencyTotal: number
      competencyMet: number
      competencyGapCount: number
      readinessRate?: number | null
    }

    interface TalentInventoryOverview {
      generatedAt: string
      totalRecords: number
      returnedRecords: number
      truncated: boolean
      employeeCount: number
      assessedCount: number
      highPerformerCount: number
      gapEmployeeCount: number
      averageReadinessRate?: number
      records: TalentInventoryRecord[]
    }

    interface SkillMatrixEmployee {
      id: string
      employeeNo: string
      employeeName: string
      jobTitle?: string | null
      organizationName?: string | null
      positionName?: string | null
      requiredCount: number
      assessedCount: number
      metCount: number
      gapCount: number
      unassessedCount: number
      readinessRate?: number | null
    }

    interface SkillMatrixCompetency {
      id: string
      competencyCode: string
      competencyName: string
      category: string
      requiredEmployees: number
      assessedEmployees: number
      metEmployees: number
      gapEmployees: number
      unassessedEmployees: number
      readinessRate?: number | null
      averageWeight?: number | null
    }

    interface SkillMatrixOverview {
      generatedAt: string
      totalRecords: number
      returnedRecords: number
      truncated: boolean
      employeeCount: number
      modelledEmployeeCount: number
      assessedEmployeeCount: number
      readyEmployeeCount: number
      gapEmployeeCount: number
      unassessedEmployeeCount: number
      records: SkillMatrixEmployee[]
      competencies: SkillMatrixCompetency[]
    }
  }
}
