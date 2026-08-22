declare namespace Api {
  namespace Hr {
    type EmploymentStatus = 'probation' | 'active' | 'leave' | 'terminated'
    type EmploymentType = 'full_time' | 'part_time' | 'intern' | 'contractor'
    type PositionKind = 'standard' | 'driver'
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
      enabled: boolean
    }

    interface EmployeeDriverInput {
      carrierId: string
      driverType: Tms.BasicData.Driver['driverType']
      licenseType: string
      licenseExpireDate: string
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
  }
}
